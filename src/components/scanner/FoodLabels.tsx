import { FoodItem } from '@/lib/api/food-analysis';

interface FoodLabelsProps {
  items: FoodItem[];
}

const FoodLabels = ({ items }: FoodLabelsProps) => {
  return (
    <>
      {items.map((item, index) => (
        <div
          key={index}
          className="absolute pointer-events-none animate-fade-in"
          style={{
            left: `${item.position.x}%`,
            top: `${item.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Connection dot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
          
          {/* Connection line */}
          <div className="absolute left-1/2 top-1/2 w-8 h-px bg-white/60" 
            style={{ transform: index % 2 === 0 ? 'rotate(-30deg)' : 'rotate(30deg)' }} 
          />
          
          {/* Label pill */}
          <div 
            className="absolute bg-white rounded-full px-3 py-1.5 shadow-lg whitespace-nowrap"
            style={{
              left: index % 2 === 0 ? '-70px' : '20px',
              top: index % 2 === 0 ? '-20px' : '-20px'
            }}
          >
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            <span className="text-xs text-muted-foreground ml-1">{item.calories}</span>
          </div>
        </div>
      ))}
    </>
  );
};

export default FoodLabels;
