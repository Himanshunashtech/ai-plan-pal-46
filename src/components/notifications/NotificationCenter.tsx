import { useState, useRef } from 'react';
import { X, Bell, Clock, Trash2, CheckCheck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItemProps {
  notification: Notification;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
}

const NotificationItem = ({ notification, onSwipeLeft, onSwipeRight, onTap }: NotificationItemProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setSwipeOffset(currentTouch - touchStart);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setIsAnimating(true);
      setSwipeOffset(-300);
      setTimeout(() => {
        onSwipeLeft();
      }, 200);
    } else if (isRightSwipe) {
      setIsAnimating(true);
      setSwipeOffset(300);
      setTimeout(() => {
        onSwipeRight();
      }, 200);
    } else {
      setSwipeOffset(0);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meal_reminder':
        return '🍽️';
      case 'goal_reached':
        return '🎯';
      case 'streak':
        return '🔥';
      case 'water_reminder':
        return '💧';
      case 'weekly_summary':
        return '📊';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-amber-500 flex items-center justify-start pl-4">
          <Clock className="w-5 h-5 text-white" />
          <span className="text-white text-sm ml-2">Snooze</span>
        </div>
        <div className="flex-1 bg-destructive flex items-center justify-end pr-4">
          <span className="text-white text-sm mr-2">Delete</span>
          <Trash2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Notification content */}
      <div
        ref={containerRef}
        className={cn(
          'relative bg-card p-4 border-b border-border',
          isAnimating && 'transition-transform duration-200',
          !notification.read && 'bg-primary/5'
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onTap}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn('font-medium truncate', !notification.read && 'font-semibold')}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    snoozeNotification,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background animate-in slide-in-from-right duration-300">
      <div className="flex flex-col h-full safe-area-top safe-area-bottom">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary">
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </header>

        {/* Notification list */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSwipeLeft={() => deleteNotification(notification.id)}
                  onSwipeRight={() => snoozeNotification(notification.id, 24)}
                  onTap={() => !notification.read && markAsRead(notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hint */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-secondary/50 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Swipe right to snooze • Swipe left to delete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
