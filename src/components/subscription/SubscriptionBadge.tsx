import { useState, useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanStatus = 'free' | 'trial' | 'active' | 'cancelled';

interface SubscriptionBadgeProps {
  compact?: boolean;
}

const SubscriptionBadge = ({ compact = false }: SubscriptionBadgeProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PlanStatus>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.subscription_status) {
          setStatus(data.subscription_status as PlanStatus);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  if (loading) {
    return null;
  }

  const getBadgeConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: compact ? 'PRO' : 'Premium',
          icon: Crown,
          className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
          iconColor: 'text-white'
        };
      case 'trial':
        return {
          label: compact ? 'TRIAL' : 'Trial',
          icon: Sparkles,
          className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
          iconColor: 'text-white'
        };
      case 'cancelled':
        return {
          label: compact ? 'FREE' : 'Free',
          icon: null,
          className: 'bg-muted text-muted-foreground',
          iconColor: ''
        };
      default:
        return {
          label: compact ? 'FREE' : 'Free',
          icon: null,
          className: 'bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary',
          iconColor: ''
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <Link
      to="/subscription"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${config.className}`}
    >
      {Icon && <Icon className={`w-3 h-3 ${config.iconColor}`} />}
      <span>{config.label}</span>
    </Link>
  );
};

export default SubscriptionBadge;
