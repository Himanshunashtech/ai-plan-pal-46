import { useState } from 'react';
import { FoodAnalysisResult } from '@/lib/api/food-analysis';
import { Button } from '@/components/ui/button';
import { Flame, Wheat, Beef, Droplets, Heart, Minus, Plus, Sparkles } from 'lucide-react';

interface FoodResultSheetProps {
  result: FoodAnalysisResult;
  imageUrl: string;
  onClose: () => void;
  onDone: () => void;
  onRetake: () => void;
}

const FoodResultSheet = ({ result, imageUrl, onClose, onDone, onRetake }: FoodResultSheetProps) => {
  const [servings, setServings] = useState(1);

  const adjustedNutrition = {
    calories: Math.round(result.totalNutrition.calories * servings),
    carbs: Math.round(result.totalNutrition.carbs * servings),
    protein: Math.round(result.totalNutrition.protein * servings),
    fats: Math.round(result.totalNutrition.fats * servings)
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      {/* Top Image Section with Labels */}
      <div className="h-1/2 relative">
        <img src={imageUrl} alt="Food" className="w-full h-full object-cover" />
        
        {/* Floating nutrition labels */}
        {result.items.slice(0, 3).map((item, index) => (
          <div
            key={index}
            className="absolute bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg"
            style={{
              left: `${15 + index * 30}%`,
              top: `${20 + (index % 2) * 15}%`
            }}
          >
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-xs text-muted-foreground ml-1">{item.calories}</span>
          </div>
        ))}
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-6 relative z-10 flex flex-col">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
        
        <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
          {/* Meal Type Badge */}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{result.mealType}</span>
          
          {/* Food Name & Servings */}
          <div className="flex items-start justify-between mt-1 mb-4">
            <h2 className="text-xl font-bold text-foreground leading-tight pr-4">{result.foodName}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full"
                onClick={() => setServings(Math.max(1, servings - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-6 text-center font-semibold">{servings}</span>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full"
                onClick={() => setServings(servings + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Nutrition Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="text-lg font-bold text-foreground">{adjustedNutrition.calories}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Wheat className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-lg font-bold text-foreground">{adjustedNutrition.carbs}g</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Beef className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-lg font-bold text-foreground">{adjustedNutrition.protein}g</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="text-lg font-bold text-foreground">{adjustedNutrition.fats}g</p>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-6">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Health score</p>
            </div>
            <p className="text-lg font-bold text-foreground">{result.healthScore}/10</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl"
              onClick={onRetake}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Fix Results
            </Button>
            <Button
              className="flex-1 h-14 rounded-2xl"
              onClick={onDone}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodResultSheet;
