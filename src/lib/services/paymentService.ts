import despia from 'despia-native';

export class PaymentService {
    private static instance: PaymentService;

    private constructor() { }

    static getInstance(): PaymentService {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async initialize(userId: string) {
        // Despia native initialization is implicit or handled via despia() calls.
        // Keeping this method for compatibility if needed, or we can just log.
        console.log('PaymentService: Native initialization (no-op)');
    }

    async getOfferings() {
        // In Despia model, offerings should be fetched from the backend.
        // For now, we return a placeholder or throw to indicate this needs backend implementation.
        console.warn('PaymentService: getOfferings() called. In Despia native, fetch offerings from your server.');
        return null;
    }

    async startPurchase(userId: string, productId: string) {
        // Optional: check store location
        try { await despia('getstorelocation://', ['storeLocation']); } catch { /* ignore */ }

        // Trigger native IAP via Despia → RevenueCat
        try {
            await despia(
                `revenuecat://purchase?external_id=${encodeURIComponent(userId)}&product=${encodeURIComponent(productId)}`
            );
            return { success: true };
        } catch (error) {
            console.error('PaymentService: Purchase failed or cancelled', error);
            return { success: false, error };
        }
    }

    // Bind listener for IAP success
    bindIapSuccessOnce(getEntitlements: () => Promise<{ active?: boolean } | null>) {
        // The prompt provided code for this
        if ((window as any)._iapBound) return;
        (window as any)._iapBound = true;

        (window as any).iapSuccess = async (payload: any) => {
            console.log('PaymentService: iapSuccess received', payload);
            try {
                const current = await getEntitlements();
                if (current?.active) return;

                // Poll for confirmation
                const confirmed = await this.waitForSubscriptionConfirm(getEntitlements, { timeoutMs: 15000, intervalMs: 1500 });
                if (!confirmed) {
                    console.warn('PaymentService: Subscription not confirmed after timeout.');
                } else {
                    console.log('PaymentService: Subscription confirmed!');
                }
            } catch (err) {
                console.error('PaymentService: iapSuccess handler error', err);
            }
        };
    }

    private async waitForSubscriptionConfirm(
        getEntitlements: () => Promise<{ active?: boolean } | null>,
        opts: { timeoutMs: number; intervalMs: number }
    ) {
        const start = Date.now();
        while (Date.now() - start < opts.timeoutMs) {
            const ent = await getEntitlements();
            if (ent?.active) return true;
            await new Promise(r => setTimeout(r, opts.intervalMs));
        }
        return false;
    }

    // Standard method for checking status (should also be server backed or via RC hook)
    async checkSubscriptionStatus() {
        // In Despia model, server is authority. Client should check user profile/entitlements from DB/API.
        console.warn('PaymentService: checkSubscriptionStatus should check server/DB.');
        return { isPremium: false };
    }
}

export const paymentService = PaymentService.getInstance();
