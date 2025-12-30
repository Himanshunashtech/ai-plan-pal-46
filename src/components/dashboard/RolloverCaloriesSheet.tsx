import { useState, useEffect } from 'react';
import { ArrowRight, Zap, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface RolloverCaloriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingCalories: number;
  onRollover: () => void;
  alreadyRolledOver: boolean;
}

const RolloverCaloriesSheet = ({
  open,
  onOpenChange,
  remainingCalories,
  onRollover,
  alreadyRolledOver
}: RolloverCaloriesSheetProps) => {
  const { t } = useTranslation();

  const handleRollover = () => {
    onRollover();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            {t('rollover_calories')}
          </SheetTitle>
          <SheetDescription>
            {t('rollover_description')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Visual representation */}
          <div className="bg-secondary/50 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('today')}</p>
                <p className="text-3xl font-bold text-emerald-500">+{remainingCalories}</p>
                <p className="text-xs text-muted-foreground">{t('remaining')}</p>
              </div>

              <ArrowRight className="w-8 h-8 text-muted-foreground" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t('tomorrow')}</p>
                <p className="text-3xl font-bold">+{remainingCalories}</p>
                <p className="text-xs text-muted-foreground">{t('bonus_calories')}</p>
              </div>
            </div>
          </div>

          {alreadyRolledOver ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500 py-4">
              <Check className="w-5 h-5" />
              <span className="font-medium">{t('already_rolled_over')}</span>
            </div>
          ) : (
            <Button
              onClick={handleRollover}
              className="w-full h-14 rounded-2xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600"
            >
              {t('rollover_to_tomorrow')}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RolloverCaloriesSheet;
