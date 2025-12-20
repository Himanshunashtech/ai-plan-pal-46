import { format, subDays, startOfWeek } from 'date-fns';

interface DayStreakCardProps {
  streakDays: number;
  trackedDays: Date[];
}

const DayStreakCard = ({ streakDays, trackedDays }: DayStreakCardProps) => {
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
  
  // Check which days of the current week have been tracked
  const weekTracked = weekDays.map((_, index) => {
    const dayDate = new Date(startOfCurrentWeek);
    dayDate.setDate(startOfCurrentWeek.getDate() + index);
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    return trackedDays.some(d => format(new Date(d), 'yyyy-MM-dd') === dayStr);
  });

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft flex-1 flex flex-col items-center">
      <div className="relative mb-2">
        <span className="text-5xl">🔥</span>
        <span className="absolute -top-1 -left-1 text-lg">✨</span>
        <span className="absolute -top-1 -right-1 text-lg">✨</span>
      </div>
      
      <div className="text-center mb-3">
        <p className="text-orange-500 font-semibold text-lg">Day streak</p>
        <p className="text-3xl font-bold text-orange-500">{streakDays}</p>
      </div>
      
      <div className="flex gap-2 mt-2">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1">{day}</span>
            <div 
              className={`w-5 h-5 rounded-full ${
                weekTracked[index] 
                  ? 'bg-green-500' 
                  : 'bg-muted'
              }`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayStreakCard;
