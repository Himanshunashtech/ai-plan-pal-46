import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  targetDate?: Date;
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
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const TOTAL_STEPS = 25;

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

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

  const resetOnboarding = () => {
    setStep(1);
    setData({});
    setGeneratedPlan(null);
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
