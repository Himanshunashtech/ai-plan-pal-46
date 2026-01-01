import despia from 'despia-native';
import { supabase } from '@/integrations/supabase/client';

interface DespiaEnv {
  uuid?: string;
  platform?: string;
}

interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  productId?: string;
  error?: unknown;
}

interface EntitlementStatus {
  active?: boolean;
  expiresAt?: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private iapBound = false;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async initialize(userId: string) {
    // Set up RevenueCat user identification via Despia
    try {
      const despiaEnv = despia as unknown as DespiaEnv;
      const deviceUuid = despiaEnv?.uuid;
      
      await despia(`revenuecat://identify?external_id=${encodeURIComponent(userId)}${deviceUuid ? `&device_id=${encodeURIComponent(deviceUuid)}` : ''}`);
      console.log('PaymentService: RevenueCat initialized for user', userId);
    } catch (error) {
      console.warn('PaymentService: RevenueCat initialization (may already be set)', error);
    }
  }

  async getOfferings() {
    // Fetch offerings from server (authority model)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke('revenuecat', {
        body: { action: 'get_offerings', userId: user.id }
      });

      if (error) throw error;
      return data?.offerings || null;
    } catch (error) {
      console.error('PaymentService: Failed to fetch offerings', error);
      return null;
    }
  }

  async startPurchase(userId: string, productId: string): Promise<PurchaseResult> {
    try {
      // Get store location (optional, for analytics)
      try {
        await despia('getstorelocation://', ['storeLocation']);
      } catch {
        // Ignore - not critical
      }

      // Trigger native IAP via Despia → RevenueCat
      const result = await despia(
        `revenuecat://purchase?external_id=${encodeURIComponent(userId)}&product=${encodeURIComponent(productId)}`
      ) as unknown as PurchaseResult;

      return { success: true, ...result };
    } catch (error) {
      console.error('PaymentService: Purchase failed or cancelled', error);
      return { success: false, error };
    }
  }

  async restorePurchases(userId: string): Promise<boolean> {
    try {
      await despia(`revenuecat://restore?external_id=${encodeURIComponent(userId)}`);
      
      // Verify with server after restore
      const status = await this.checkSubscriptionStatus(userId);
      return status.isPremium;
    } catch (error) {
      console.error('PaymentService: Restore failed', error);
      return false;
    }
  }

  // Bind global listener for IAP success callback from native
  bindIapSuccessListener(getEntitlements: () => Promise<EntitlementStatus | null>) {
    if (this.iapBound) return;
    this.iapBound = true;

    (window as any).iapSuccess = async (payload: { transactionId?: string; productId?: string }) => {
      console.log('PaymentService: iapSuccess received', payload);
      
      try {
        // Check current status first
        const current = await getEntitlements();
        if (current?.active) {
          console.log('PaymentService: Already has active entitlement');
          return;
        }

        // Poll server for confirmation (server is authority)
        const confirmed = await this.pollForConfirmation(getEntitlements, {
          timeoutMs: 20000,
          intervalMs: 2000
        });

        if (confirmed) {
          console.log('PaymentService: Subscription confirmed by server');
          // Dispatch custom event for UI updates
          window.dispatchEvent(new CustomEvent('subscription-confirmed'));
        } else {
          console.warn('PaymentService: Subscription not confirmed within timeout');
        }
      } catch (error) {
        console.error('PaymentService: iapSuccess handler error', error);
      }
    };
  }

  private async pollForConfirmation(
    getEntitlements: () => Promise<EntitlementStatus | null>,
    opts: { timeoutMs: number; intervalMs: number }
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < opts.timeoutMs) {
      const entitlements = await getEntitlements();
      if (entitlements?.active) return true;
      await new Promise(resolve => setTimeout(resolve, opts.intervalMs));
    }
    
    return false;
  }

  async checkSubscriptionStatus(userId?: string): Promise<{ isPremium: boolean; expiresAt?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const id = userId || user?.id;
      
      if (!id) return { isPremium: false };

      const { data, error } = await supabase.functions.invoke('revenuecat', {
        body: { action: 'get_subscriber', userId: id }
      });

      if (error) throw error;

      return {
        isPremium: data?.isPremium || false,
        expiresAt: data?.expiresAt
      };
    } catch (error) {
      console.error('PaymentService: Failed to check subscription', error);
      return { isPremium: false };
    }
  }
}

export const paymentService = PaymentService.getInstance();
