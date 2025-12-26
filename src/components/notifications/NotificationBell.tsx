import { Bell, Flame } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell = ({ onClick }: NotificationBellProps) => {
  const { unreadCount, streak } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 transition-colors hover:bg-secondary/80"
    >
      {/* Streak display */}
      {/* {streak && streak.current_streak > 0 && (
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-sm">{streak.current_streak}</span>
        </div>
      )} */}

      {/* Bell with badge */}
      <div className="relative">
        <Bell className={cn('w-5 h-5', unreadCount > 0 && 'text-primary')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};
