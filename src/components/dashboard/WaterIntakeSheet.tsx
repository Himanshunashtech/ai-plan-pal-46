import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Droplet, X, Plus, Minus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface WaterIntakeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    currentIntake: number;
    onSave: (amount: number) => void;
    goal: number;
}

const WaterIntakeSheet = ({ isOpen, onClose, currentIntake, onSave, goal }: WaterIntakeSheetProps) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(currentIntake);

    useEffect(() => {
        if (isOpen) {
            setValue(currentIntake);
        }
    }, [isOpen, currentIntake]);

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const quickAdd = (amount: number) => {
        setValue(prev => Math.min(5000, Math.max(0, prev + amount)));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[32px] z-[101] p-6 pb-12 shadow-elevated"
                    >
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-8" />

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">{t('water_intake')}</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center mb-10">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Droplet className="w-16 h-16 text-blue-500 animate-pulse-soft" fill="currentColor" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <Plus className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="flex items-baseline justify-center gap-2 mb-1">
                                    <span className="text-5xl font-black text-foreground tracking-tighter">{value}</span>
                                    <span className="text-xl font-bold text-muted-foreground uppercase">ml</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {t('goal')}: <span className="text-foreground">{goal} ml</span>
                                </p>
                            </div>
                        </div>

                        <div className="px-4 mb-10">
                            <div className="flex justify-between text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4">
                                <span>100ml</span>
                                <span>5000ml</span>
                            </div>
                            <Slider
                                value={[value]}
                                min={100}
                                max={5000}
                                step={50}
                                onValueChange={(vals) => setValue(vals[0])}
                                className="mb-8"
                            />

                            <div className="grid grid-cols-3 gap-3">
                                {[200, 500, 1000].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => quickAdd(amount)}
                                        className="py-3 px-4 rounded-2xl bg-secondary/50 border border-border/50 font-bold hover:bg-secondary transition-colors text-sm"
                                    >
                                        +{amount}ml
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 h-16 rounded-2xl text-lg font-bold border-2"
                                onClick={() => setValue(currentIntake)}
                            >
                                {t('reset')}
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1 h-16 rounded-2xl text-lg font-bold bg-foreground text-background"
                                onClick={handleSave}
                            >
                                <Check className="w-6 h-6 mr-2" />
                                {t('update')}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WaterIntakeSheet;
