import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    OnboardingData,
    GeneratedPlan,
    nextStep,
    prevStep,
    setStep,
    updateData,
    setGeneratedPlan,
    updateGeneratedPlan,
    resetOnboarding
} from '@/store/slices/onboardingSlice';

const STORAGE_KEY = 'onboarding_storage';

export const useOnboarding = () => {
    const dispatch = useAppDispatch();
    const { step, totalSteps, data, generatedPlan } = useAppSelector(state => state.onboarding);

    // Persistence side-effect
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
        } catch { }
    }, [step, data]);

    // Validation Logic
    const isStepValid = useCallback((s: number, d: OnboardingData): boolean => {
        switch (s) {
            case 1: return !!d.fullName?.trim();
            case 2: return !!d.gender;
            case 3: return d.age != null;
            case 4: return d.height != null && !!d.heightUnit;
            case 5: return d.currentWeight != null && !!d.weightUnit;
            case 6: return !!d.goal;
            case 7: return d.targetWeight != null;
            case 8: return true; // Interstitial: Long-term Effect
            case 9: return true; // Interstitial: Support message
            case 10: return !!d.activityLevel;
            case 11: return !!d.dietType;
            case 12: return true; // Interstitial: AI Food Scanning
            case 13: return d.exerciseFrequency != null;
            default: return true;
        }
    }, []);

    const handleNextStep = useCallback(() => {
        if (isStepValid(step, data)) {
            dispatch(nextStep());
        }
    }, [dispatch, step, data, isStepValid]);

    const handlePrevStep = useCallback(() => {
        dispatch(prevStep());
    }, [dispatch]);

    const handleUpdateData = useCallback((newData: Partial<OnboardingData>) => {
        dispatch(updateData(newData));
    }, [dispatch]);

    const handleSetGeneratedPlan = useCallback((plan: GeneratedPlan) => {
        dispatch(setGeneratedPlan(plan));
    }, [dispatch]);

    const handleUpdateGeneratedPlan = useCallback((updates: Partial<GeneratedPlan>) => {
        dispatch(updateGeneratedPlan(updates));
    }, [dispatch]);

    const handleReset = useCallback(() => {
        dispatch(resetOnboarding());
    }, [dispatch]);

    const getStepDataKeys = useCallback((stepNumber: number): (keyof OnboardingData)[] => {
        const map: Record<number, (keyof OnboardingData)[]> = {
            1: ['fullName'],
            2: ['gender'],
            3: ['age'],
            4: ['height', 'heightUnit'],
            5: ['currentWeight', 'weightUnit'],
            6: ['goal'],
            7: ['targetWeight'],
            10: ['activityLevel'],
            11: ['dietType'],
            13: ['exerciseFrequency'],
        };
        return map[stepNumber] || [];
    }, []);

    const handleClearStepData = useCallback((stepNumber: number) => {
        const keys = getStepDataKeys(stepNumber);
        if (!keys.length) return;

        const resetData: any = {};
        keys.forEach(k => resetData[k] = undefined);
        dispatch(updateData(resetData));
    }, [dispatch, getStepDataKeys]);

    return {
        step,
        totalSteps,
        data,
        generatedPlan,
        setStep: useCallback((s: number) => dispatch(setStep(s)), [dispatch]),
        nextStep: handleNextStep,
        prevStep: handlePrevStep,
        updateData: handleUpdateData,
        setGeneratedPlan: handleSetGeneratedPlan,
        updateGeneratedPlan: handleUpdateGeneratedPlan,
        resetOnboarding: handleReset,
        clearStepData: handleClearStepData,
        exitOnboarding: handleReset,
    };
};
