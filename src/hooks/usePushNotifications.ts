import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    OneSignal?: {
      init: (config: Record<string, unknown>) => Promise<void>;
      login: (externalUserId: string) => Promise<void>;
      logout: () => Promise<void>;
      User: {
        PushSubscription: {
          id: string | null;
          optedIn: boolean;
          optIn: () => Promise<void>;
          optOut: () => Promise<void>;
        };
      };
      Notifications: {
        permission: boolean;
        requestPermission: () => Promise<void>;
      };
    };
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize OneSignal
  useEffect(() => {
    if (!ONESIGNAL_APP_ID || typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const initOneSignal = async () => {
      try {
        // Load OneSignal SDK if not already loaded
        if (!window.OneSignal) {
          const script = document.createElement('script');
          script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
          script.async = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
          });
        }

        if (window.OneSignal) {
          await window.OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false,
            },
          });

          setIsSupported(true);
          setIsSubscribed(window.OneSignal.User?.PushSubscription?.optedIn ?? false);
        }
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initOneSignal();
  }, []);

  // Link user to OneSignal when authenticated
  useEffect(() => {
    const linkUser = async () => {
      if (!window.OneSignal || !user?.id) return;

      try {
        await window.OneSignal.login(user.id);

        // Register device with our backend
        const playerId = window.OneSignal.User?.PushSubscription?.id;
        if (playerId) {
          await supabase.functions.invoke('push-notifications/register', {
            body: { playerId, userId: user.id },
          });
        }
      } catch (error) {
        console.error('Failed to link user to OneSignal:', error);
      }
    };

    if (isSupported && user) {
      linkUser();
    }
  }, [isSupported, user]);

  const requestPermission = useCallback(async () => {
    if (!window.OneSignal) return false;

    try {
      await window.OneSignal.Notifications.requestPermission();
      await window.OneSignal.User.PushSubscription.optIn();
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!window.OneSignal) return false;

    try {
      await window.OneSignal.User.PushSubscription.optOut();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }, []);

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
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
    sendTestNotification,
  };
}
