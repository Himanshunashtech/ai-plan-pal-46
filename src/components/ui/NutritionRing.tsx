interface NutritionRingProps {
  value: number;
  max: number;
  color: 'calories' | 'carbs' | 'protein' | 'fats';
  size?: number;
}

const colorClasses = {
  calories: 'stroke-foreground',
  carbs: 'stroke-carbs',
  protein: 'stroke-protein',
  fats: 'stroke-fats',
};

const NutritionRing = ({ value, max, color, size = 60 }: NutritionRingProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={colorClasses[color]}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
    </div>
  );
};

export default NutritionRing;
