import { HelpCircle } from 'lucide-react';

interface BMICardProps {
  bmi: number;
}

const BMICard = ({ bmi }: BMICardProps) => {
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (bmi < 25) return { label: 'Healthy', color: 'bg-green-500', textColor: 'text-green-500' };
    if (bmi < 30) return { label: 'Overweight', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { label: 'Obese', color: 'bg-red-500', textColor: 'text-red-500' };
  };

  const status = getBMIStatus(bmi);
  
  // Calculate position on the scale (BMI 15-40 mapped to 0-100%)
  const position = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Your BMI</h3>
        <HelpCircle className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl font-bold">{bmi.toFixed(2)}</span>
        <span className="text-muted-foreground">Your weight is</span>
        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>
      
      {/* BMI Scale */}
      <div className="relative mb-3">
        <div className="h-3 rounded-full flex overflow-hidden">
          <div className="bg-blue-400 flex-1" />
          <div className="bg-green-400 flex-1" />
          <div className="bg-yellow-400 flex-1" />
          <div className="bg-red-400 flex-1" />
        </div>
        {/* Indicator */}
        <div 
          className="absolute top-0 w-1 h-4 bg-foreground rounded-full transform -translate-x-1/2"
          style={{ left: `${position}%` }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-muted-foreground">Underweight</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-muted-foreground">Healthy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-muted-foreground">Overweight</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-muted-foreground">Obese</span>
        </div>
      </div>
    </div>
  );
};

export default BMICard;
