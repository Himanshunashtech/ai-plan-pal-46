import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { paymentService } from '@/lib/services/paymentService';
import { subscriptionApi } from '@/lib/api/subscription';

interface PremiumStatus {
  isPremium: boolean;
  status: 'free' | 'trial' | 'active' | 'cancelled' | 'expired';
  expiresAt: string | null;
  isLoading: boolean;
}

export function usePremium() {
  const { user } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isPremium: false,
    status: 'free',
    expiresAt: null,
    isLoading: true
  });

  const fetchStatus = useCallback(async () => {
    if (!user?.id) {
      setPremiumStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get local profile status first (fast)
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const status = profile.subscription_status as PremiumStatus['status'] || 'free';
        const isActive = status === 'active' || status === 'trial';
        
        // Check if expired
        let isPremium = isActive;
        if (profile.subscription_expires_at) {
          const expiresAt = new Date(profile.subscription_expires_at);
          if (expiresAt < new Date()) {
            isPremium = false;
          }
        }

        setPremiumStatus({
          isPremium,
          status,
          expiresAt: profile.subscription_expires_at,
          isLoading: false
        });
      } else {
        setPremiumStatus({
          isPremium: false,
          status: 'free',
          expiresAt: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
      setPremiumStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Bind iapSuccess listener for native purchases
  useEffect(() => {
    if (!user?.id) return;

    const getEntitlements = async () => {
      try {
        const result = await subscriptionApi.getSubscriptionStatus(user.id);
        return { active: result.isPremium };
      } catch {
        return null;
      }
    };

    paymentService.bindIapSuccessListener(getEntitlements);

    // Listen for subscription-confirmed event
    const handleConfirmed = async () => {
      console.log('Subscription confirmed, refreshing status...');
      
      // Update local profile
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      // Refresh status
      await fetchStatus();
    };

    window.addEventListener('subscription-confirmed', handleConfirmed);

    return () => {
      window.removeEventListener('subscription-confirmed', handleConfirmed);
    };
  }, [user?.id, fetchStatus]);

  // Verify with server periodically (every 5 minutes when active)
  useEffect(() => {
    if (!user?.id || !premiumStatus.isPremium) return;

    const verifyWithServer = async () => {
      try {
        const serverStatus = await subscriptionApi.getSubscriptionStatus(user.id);
        
        if (!serverStatus.isPremium && premiumStatus.isPremium) {
          // Server says not premium but we think we are - update
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
          
          setPremiumStatus(prev => ({
            ...prev,
            isPremium: false,
            status: 'expired'
          }));
        }
      } catch (error) {
        console.error('Error verifying subscription with server:', error);
      }
    };

    const interval = setInterval(verifyWithServer, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, premiumStatus.isPremium]);

  const refresh = useCallback(async () => {
    setPremiumStatus(prev => ({ ...prev, isLoading: true }));
    await fetchStatus();
  }, [fetchStatus]);

  return {
    ...premiumStatus,
    refresh
  };
}
