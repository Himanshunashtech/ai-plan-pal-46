import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import despia from 'despia-native';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported] = useState(true); // Assumed true in Despia
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Link user to OneSignal when authenticated
  useEffect(() => {
    const linkUser = async () => {
      if (!user?.id) return;

      try {
        // In Despia, we get the player ID directly from the environment
        // typings might not be perfect on 'despia' object if library doesn't export them fully, casting to any if needed
        const playerId = (despia as any).onesignalplayerid || (despia as any).oneSignalPlayerId;

        if (playerId) {
          console.log('Registering Despia Player ID:', playerId);
          await supabase.functions.invoke('push-notifications/register', {
            body: { playerId, userId: user.id },
          });
          setIsSubscribed(true);
        } else {
          // If debugging in browser without Despia wrapper, this will be missing.
          console.log('No Despia Player ID found (are you in Despia app?)');
        }
      } catch (error) {
        console.error('Failed to link user to OneSignal:', error);
      }
    };

    if (user) {
      linkUser();
    }
  }, [user]);

  const requestPermission = async () => {
    // In Despia/Native, permissions are usually requested via specific scheme/system dialog trigger
    // OR implicit. Assuming generic notification permission request if needed.
    // despia('settings://notifications') or similar might start intent.
    // For now, assuming permissions are handled by the container or OS level prompt on first run.
    console.log('Requesting permission logic would go here if not handled by container');
    return true;
  };

  const unsubscribe = async () => {
    // Logic to opt-out on backend?
    return true;
  };

  const sendTestNotification = async () => {
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
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
    sendTestNotification,
  };
}
