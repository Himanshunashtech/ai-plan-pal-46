import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface OnboardingData {
  gender?: 'male' | 'female' | 'other';
  age?: number;
  height?: number;
  heightUnit?: 'cm' | 'ft';
  currentWeight?: number;
  targetWeight?: number;
  weightUnit?: 'kg' | 'lbs';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose' | 'maintain' | 'gain';
  weeklyGoal?: number;
  dietType?: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  allergies?: string[];
  mealsPerDay?: number;
  waterIntake?: number;
  sleepHours?: number;
  stressLevel?: 'low' | 'medium' | 'high';
  motivation?: string[];
  previousDiets?: boolean;
  cookingTime?: 'minimal' | 'moderate' | 'plenty';
  snacking?: 'rarely' | 'sometimes' | 'often';
  exerciseFrequency?: number;
  exerciseType?: string[];
  healthConditions?: string[];
  medications?: boolean;
  targetDate?: string;
  targetMonths?: number;
  fullName?: string;
}

export interface GeneratedPlan {
  dailyCalories: number;
  dailyCarbs: number;
  dailyProtein: number;
  dailyFats: number;
  targetWeight: number;
  recommendation: string;
}

interface OnboardingContextType {
  step: number;
  totalSteps: number;
  data: OnboardingData;
  generatedPlan: GeneratedPlan | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (newData: Partial<OnboardingData>) => void;
  setGeneratedPlan: (plan: GeneratedPlan) => void;
  updateGeneratedPlan: (updates: Partial<GeneratedPlan>) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const TOTAL_STEPS = 27;
const STORAGE_KEY = 'onboarding_progress';

const loadFromStorage = (): { step: number; data: OnboardingData } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { step: parsed.step || 1, data: parsed.data || {} };
    }
  } catch (e) {
    console.error('Failed to load onboarding progress:', e);
  }
  return { step: 1, data: {} };
};

const saveToStorage = (step: number, data: OnboardingData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
  } catch (e) {
    console.error('Failed to save onboarding progress:', e);
  }
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const stored = loadFromStorage();
  const [step, setStep] = useState(stored.step);
  const [data, setData] = useState<OnboardingData>(stored.data);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

  // Persist progress on changes
  useEffect(() => {
    saveToStorage(step, data);
  }, [step, data]);

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const updateGeneratedPlan = (updates: Partial<GeneratedPlan>) => {
    setGeneratedPlan(prev => prev ? { ...prev, ...updates } : null);
  };

  const resetOnboarding = () => {
    setStep(1);
    setData({});
    setGeneratedPlan(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <OnboardingContext.Provider value={{
      step,
      totalSteps: TOTAL_STEPS,
      data,
      generatedPlan,
      setStep,
      nextStep,
      prevStep,
      updateData,
      setGeneratedPlan,
      updateGeneratedPlan,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
