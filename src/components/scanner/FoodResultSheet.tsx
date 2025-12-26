import { useState } from 'react';
import { FoodAnalysisResult } from '@/lib/api/food-analysis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Flame, Wheat, Beef, Droplets, Heart, Minus, Plus, Pencil, Check, Apple, Candy, Salad, Share2 } from 'lucide-react';

interface FoodResultSheetProps {
  result: FoodAnalysisResult;
  imageUrl: string;
  onClose: () => void;
  onDone: (adjustedNutrition: {
    calories: number; carbs: number; protein: number; fats: number;
    fiber: number; sugar: number; sodium: number;
    foodName: string;
  }) => void;
  onRetake: () => void;
}

const FoodResultSheet = ({ result, imageUrl, onClose, onDone, onRetake }: FoodResultSheetProps) => {
  const [servings, setServings] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState({
    foodName: result.foodName,
    calories: result.totalNutrition.calories,
    carbs: result.totalNutrition.carbs,
    protein: result.totalNutrition.protein,
    fats: result.totalNutrition.fats,
    fiber: result.totalNutrition.fiber || 0,
    sugar: result.totalNutrition.sugar || 0,
    sodium: result.totalNutrition.sodium || 0
  });

  const adjustedNutrition = {
    calories: Math.round(customValues.calories * servings),
    carbs: Math.round(customValues.carbs * servings),
    protein: Math.round(customValues.protein * servings),
    fats: Math.round(customValues.fats * servings),
    fiber: Math.round(customValues.fiber * servings),
    sugar: Math.round(customValues.sugar * servings),
    sodium: Math.round(customValues.sodium * servings)
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSave = () => {
    setEditingField(null);
  };

  const handleValueChange = (field: keyof typeof customValues, value: string) => {
    const numValue = parseInt(value) || 0;
    setCustomValues(prev => ({ ...prev, [field]: numValue }));
  };

  const handleDone = () => {
    onDone({ ...adjustedNutrition, foodName: customValues.foodName });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Healthy Meal! 🥗',
          text: `I just tracked ${customValues.foodName} (${adjustedNutrition.calories} kcal) with CaloAI!`,
          url: window.location.origin
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`I just tracked ${customValues.foodName} (${adjustedNutrition.calories} kcal) with CaloAI!`);
        // We'd typically show a toast here, but for now we'll rely on user knowing it worked or adding a toast via props if strictly needed.
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col">
      {/* Top Image Section with Labels */}
      <div className="h-[40%] relative flex-shrink-0">
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
      <div className="flex-1 bg-background rounded-t-3xl -mt-6 relative z-10 flex flex-col overflow-hidden">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 flex-shrink-0" />

        <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto flex flex-col">
          {/* Meal Type Badge */}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{result.mealType}</span>

          {/* Food Name & Servings */}
          <div className="flex items-start justify-between mt-1 mb-4">
            <div className="flex-1 pr-4">
              {editingField === 'name' ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={customValues.foodName}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, foodName: e.target.value }))}
                    className="h-9 text-xl font-bold px-2 py-1"
                    autoFocus
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Check className="w-5 h-5 text-green-500 cursor-pointer" onClick={handleSave} />
                </div>
              ) : (
                <div className="flex items-center gap-2" onClick={() => handleEdit('name')}>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{customValues.foodName}</h2>
                  <Pencil className="w-4 h-4 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>

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

          {/* Slidable Nutrition Section */}
          <div className="relative mb-4 group">
            <style>{`
              .scrollbar-none::-webkit-scrollbar { display: none; }
              .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-2"
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.offsetWidth;
                const newPage = Math.round(scrollLeft / width);
                if (newPage !== activePage) setActivePage(newPage);
              }}
            >
              {/* Page 1: Main Macros */}
              <div className="w-full shrink-0 snap-center pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Calories</p>
                      {editingField === 'calories' ? (
                        <Input
                          type="number"
                          value={customValues.calories}
                          onChange={(e) => handleValueChange('calories', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.calories}</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'calories' ? handleSave() : handleEdit('calories')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'calories' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Wheat className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      {editingField === 'carbs' ? (
                        <Input
                          type="number"
                          value={customValues.carbs}
                          onChange={(e) => handleValueChange('carbs', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.carbs}g</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'carbs' ? handleSave() : handleEdit('carbs')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'carbs' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Beef className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Protein</p>
                      {editingField === 'protein' ? (
                        <Input
                          type="number"
                          value={customValues.protein}
                          onChange={(e) => handleValueChange('protein', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.protein}g</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'protein' ? handleSave() : handleEdit('protein')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'protein' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Fats</p>
                      {editingField === 'fats' ? (
                        <Input
                          type="number"
                          value={customValues.fats}
                          onChange={(e) => handleValueChange('fats', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.fats}g</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'fats' ? handleSave() : handleEdit('fats')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'fats' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Page 2: Micronutrients */}
              <div className="w-full shrink-0 snap-center pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <Apple className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Fiber</p>
                      {editingField === 'fiber' ? (
                        <Input
                          type="number"
                          value={customValues.fiber}
                          onChange={(e) => handleValueChange('fiber', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.fiber}g</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'fiber' ? handleSave() : handleEdit('fiber')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'fiber' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                      <Candy className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Sugar</p>
                      {editingField === 'sugar' ? (
                        <Input
                          type="number"
                          value={customValues.sugar}
                          onChange={(e) => handleValueChange('sugar', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.sugar}g</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'sugar' ? handleSave() : handleEdit('sugar')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'sugar' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl relative">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Salad className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Sodium</p>
                      {editingField === 'sodium' ? (
                        <Input
                          type="number"
                          value={customValues.sodium}
                          onChange={(e) => handleValueChange('sodium', e.target.value)}
                          className="h-7 w-20 text-lg font-bold p-1"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-bold text-foreground">{adjustedNutrition.sodium}mg</p>
                      )}
                    </div>
                    <button
                      onClick={() => editingField === 'sodium' ? handleSave() : handleEdit('sodium')}
                      className="absolute bottom-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      {editingField === 'sodium' ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {[0, 1].map(i => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activePage === i ? 'bg-primary w-3' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Health score</p>
            </div>
            <p className="text-lg font-bold text-foreground">{result.healthScore}/10</p>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Action Buttons - Always visible at bottom */}
          <div className="flex gap-3 pt-4 flex-shrink-0">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl"
              onClick={onRetake}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-14 rounded-2xl"
              onClick={handleDone}
            >
              Add Meal
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-14 w-14 rounded-2xl shrink-0"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodResultSheet;
