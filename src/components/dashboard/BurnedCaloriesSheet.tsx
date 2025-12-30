import { useState } from 'react';
import { Flame, Plus, Minus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface BurnedCaloriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBurned: number;
  onSave: (amount: number) => void;
}

const PRESET_VALUES = [100, 200, 300, 500];

const BurnedCaloriesSheet = ({
  open,
  onOpenChange,
  currentBurned,
  onSave
}: BurnedCaloriesSheetProps) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(currentBurned);

  const handleSave = () => {
    onSave(amount);
    onOpenChange(false);
  };

  const adjustAmount = (change: number) => {
    setAmount(prev => Math.max(0, prev + change));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            {t('add_burned_calories')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Main counter */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => adjustAmount(-50)}
              className="w-14 h-14 rounded-full border-2 border-border flex items-center justify-center active:scale-95 transition-transform"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-5xl font-bold">{amount}</span>
              <p className="text-muted-foreground mt-1">{t('calories')}</p>
            </div>

            <button
              onClick={() => adjustAmount(50)}
              className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex justify-center gap-2">
            {PRESET_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  amount === val
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                +{val}
              </button>
            ))}
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            className="w-full h-14 rounded-2xl text-lg font-semibold"
          >
            {t('save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BurnedCaloriesSheet;
