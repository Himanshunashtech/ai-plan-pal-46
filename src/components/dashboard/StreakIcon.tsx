import { Flame } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface StreakIconProps {
  onClick?: () => void;
}

export function StreakIcon({ onClick }: StreakIconProps) {
  const { streak } = useNotifications();
  const currentStreak = streak?.current_streak || 0;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-secondary transition-colors"
      title={`${currentStreak} day streak`}
    >
      <Flame 
        className={`w-6 h-6 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} 
        fill={currentStreak > 0 ? 'currentColor' : 'none'}
      />
      {currentStreak > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-orange-500 text-white rounded-full px-1">
          {currentStreak > 99 ? '99+' : currentStreak}
        </span>
      )}
    </button>
  );
}
