import { supabase } from '@/integrations/supabase/client';

export interface Offering {
  id: string;
  price: string;
  priceAmount: number;
  currency: string;
  period: string;
  trialDays: number;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  expiresAt: string | null;
}

export const subscriptionApi = {
  async getOfferings(userId: string): Promise<{ offerings: Record<string, Offering> }> {
    const { data, error } = await supabase.functions.invoke('revenuecat', {
      body: { action: 'get_offerings', userId }
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const { data, error } = await supabase.functions.invoke('revenuecat', {
      body: { action: 'get_subscriber', userId }
    });

    if (error) throw new Error(error.message);
    return {
      isPremium: data.isPremium || false,
      expiresAt: data.expiresAt || null
    };
  },

  async startFreeTrial(userId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('revenuecat', {
      body: { action: 'grant_trial', userId }
    });

    if (error) throw new Error(error.message);
    return data;
  }
};
