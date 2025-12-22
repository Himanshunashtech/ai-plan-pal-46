import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Flame, Wheat, Drumstick, Droplets } from 'lucide-react';
import NutritionRing from '@/components/ui/NutritionRing';

interface EditGoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'calories' | 'carbs' | 'protein' | 'fats';
  value: number;
  onSave: (value: number) => void;
}

const goalConfig = {
  calories: {
    label: 'Calories',
    max: 3000,
    unit: '',
    icon: Flame,
  },
  carbs: {
    label: 'Carbs',
    max: 400,
    unit: 'g',
    icon: Wheat,
  },
  protein: {
    label: 'Protein',
    max: 300,
    unit: 'g',
    icon: Drumstick,
  },
  fats: {
    label: 'Fats',
    max: 150,
    unit: 'g',
    icon: Droplets,
  },
};

const EditGoalSheet = ({ open, onOpenChange, type, value, onSave }: EditGoalSheetProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const config = goalConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value, open]);

  const handleRevert = () => {
    setInputValue(value.toString());
  };

  const handleDone = () => {
    const numValue = parseInt(inputValue) || 0;
    onSave(numValue);
    onOpenChange(false);
  };

  const currentValue = parseInt(inputValue) || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-full rounded-t-none p-0">
        <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
          <div className="px-6 py-4">
            <button
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-6">
            <h1 className="text-2xl font-bold text-foreground mb-6">
              Edit {config.label} Goal
            </h1>

            <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <NutritionRing value={currentValue} max={config.max} color={type} size={100} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                <span className="text-2xl font-bold">
                  {currentValue}{config.unit}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-input" className="text-muted-foreground">
                {config.label}
              </Label>
              <Input
                id="goal-input"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="text-lg h-14"
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-4 flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleRevert}
            >
              Revert
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleDone}
            >
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditGoalSheet;
