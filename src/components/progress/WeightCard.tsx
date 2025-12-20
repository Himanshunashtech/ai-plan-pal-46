import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface WeightCardProps {
  currentWeight: number;
  targetWeight: number;
  weightUnit: string;
  lastWeighIn?: Date;
}

const WeightCard = ({ currentWeight, targetWeight, weightUnit, lastWeighIn }: WeightCardProps) => {
  const progress = targetWeight > 0 
    ? Math.min(100, Math.max(0, (currentWeight / targetWeight) * 100))
    : 0;
  
  const daysUntilNextWeighIn = lastWeighIn 
    ? Math.max(0, 7 - Math.floor((new Date().getTime() - new Date(lastWeighIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft flex-1">
      <p className="text-sm text-muted-foreground mb-1">My Weight</p>
      <p className="text-3xl font-bold mb-3">
        {currentWeight} <span className="text-lg font-normal">{weightUnit}</span>
      </p>
      
      <div className="mb-3">
        <Progress value={progress} className="h-2 bg-muted" />
      </div>
      
      <p className="text-sm text-foreground">
        Goal <span className="font-semibold">{targetWeight} {weightUnit}s</span>
      </p>
      
      <p className="text-sm text-green-600 mt-3">
        Next weight-in: {daysUntilNextWeighIn}d
      </p>
    </div>
  );
};

export default WeightCard;
