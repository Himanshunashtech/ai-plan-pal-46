import { useState } from 'react';
import { Bell, BellOff, Send, Loader2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      if (enabled) {
        const success = await requestPermission();
        if (success) {
          toast.success('Push notifications enabled');
        } else {
          toast.error('Failed to enable push notifications');
        }
      } else {
        const success = await unsubscribe();
        if (success) {
          toast.success('Push notifications disabled');
        } else {
          toast.error('Failed to disable push notifications');
        }
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        toast.success('Test notification sent');
      } else {
        toast.error('Failed to send test notification');
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Real-time alerts for meals, streaks, and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not available. This could be because notifications are blocked in your browser settings, or the feature isn't configured yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Real-time alerts for meals, streaks, and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="font-medium">Enable Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive instant alerts on your device
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="w-full"
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
