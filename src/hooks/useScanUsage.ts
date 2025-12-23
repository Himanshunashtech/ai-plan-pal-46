import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsageData {
  scansUsed: number;
  scansLimit: number;
  isPremium: boolean;
  date: string;
}

export function useScanUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's usage
      const { data: usageData } = await supabase
        .from('user_usage')
        .select('scan_count, usage_date')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      // Fetch subscription status
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const isPremium = ['active', 'premium', 'trial'].includes(profile?.subscription_status || '');

      setUsage({
        scansUsed: usageData?.scan_count || 0,
        scansLimit: isPremium ? -1 : 10,
        isPremium,
        date: today
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const scansRemaining = usage 
    ? (usage.isPremium ? Infinity : Math.max(0, usage.scansLimit - usage.scansUsed))
    : 0;

  return {
    usage,
    loading,
    scansRemaining,
    refetch: fetchUsage
  };
}
