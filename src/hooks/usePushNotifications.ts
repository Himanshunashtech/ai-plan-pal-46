import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import despia from 'despia-native';

interface DespiaEnv {
  uuid?: string;
  onesignalplayerid?: string;
  oneSignalPlayerId?: string;
  platform?: string;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if running in Despia environment
  useEffect(() => {
    const despiaEnv = despia as unknown as DespiaEnv;
    const hasDespia = !!(despiaEnv?.uuid || despiaEnv?.onesignalplayerid || despiaEnv?.oneSignalPlayerId);
    setIsSupported(hasDespia);
    setIsLoading(false);
  }, []);

  // Link user to OneSignal when authenticated
  useEffect(() => {
    const linkDevice = async () => {
      if (!user?.id || !isSupported) return;

      setIsLoading(true);
      try {
        const despiaEnv = despia as unknown as DespiaEnv;
        const playerId = despiaEnv.onesignalplayerid || despiaEnv.oneSignalPlayerId;
        const deviceUuid = despiaEnv.uuid;

        if (playerId) {
          console.log('Registering Despia device:', { playerId, deviceUuid });
          
          const { error } = await supabase.functions.invoke('push-notifications/register', {
            body: { 
              playerId, 
              userId: user.id,
              deviceUuid,
              platform: despiaEnv.platform || 'unknown'
            },
          });

          if (!error) {
            setIsSubscribed(true);
          } else {
            console.error('Failed to register device:', error);
          }
        } else {
          console.log('No OneSignal Player ID found (running outside Despia app)');
        }
      } catch (error) {
        console.error('Failed to link device to OneSignal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isSupported) {
      linkDevice();
    }
  }, [user, isSupported]);

  const requestPermission = useCallback(async () => {
    // In Despia, trigger native notification permission dialog
    try {
      await despia('settings://notifications');
      return true;
    } catch {
      // Permissions might already be granted or handled by OS
      return true;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;
    try {
      await supabase.functions.invoke('push-notifications/unregister', {
        body: { userId: user.id },
      });
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }, [user?.id]);

  const sendTestNotification = useCallback(async () => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.functions.invoke('push-notifications/send', {
        body: {
          userId: user.id,
          title: 'Test Notification',
          message: 'Push notifications are working! 🎉',
          data: { type: 'test' },
        },
      });
      return !error;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }, [user?.id]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
    sendTestNotification,
  };
}
