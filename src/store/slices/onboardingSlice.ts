import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/* ================= TYPES ================= */

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

interface OnboardingState {
    step: number;
    totalSteps: number;
    data: OnboardingData;
    generatedPlan: GeneratedPlan | null;
}

const STORAGE_KEY = 'onboarding_progress';

/* ================= HELPERS ================= */
const loadFromStorage = (): { step: number; data: OnboardingData } => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure we have a valid step and data object, defaulting if corrupt
            return {
                step: typeof parsed.step === 'number' ? parsed.step : 1,
                data: parsed.data || {}
            };
        }
    } catch { }
    return { step: 1, data: {} };
};

const KG_TO_LBS = 2.20462;
const kgToLbs = (kg: number) => Math.round(kg * KG_TO_LBS);
const lbsToKg = (lbs: number) => Math.round(lbs / KG_TO_LBS);
const cmToInches = (cm: number) => Math.round(cm / 2.54);
const inchesToCm = (inches: number) => Math.round(inches * 2.54);

/* ================= INITIAL STATE ================= */
const stored = loadFromStorage();
const initialState: OnboardingState = {
    step: stored.step,
    totalSteps: 15,
    data: stored.data,
    generatedPlan: null,
};

/* ================= SLICE ================= */
export const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        setStep: (state, action: PayloadAction<number>) => {
            state.step = action.payload;
        },
        nextStep: (state) => {
            if (state.step < state.totalSteps) {
                state.step += 1;
                // Apply defaults for next step if needed (logic moved from useEffect)
                applyStepDefaults(state);
            }
        },
        prevStep: (state) => {
            if (state.step > 1) {
                state.step -= 1;
            }
        },
        updateData: (state, action: PayloadAction<Partial<OnboardingData>>) => {
            const newData = action.payload;
            const prevData = state.data;

            // Handle conversions before merging
            // Weight
            if (newData.weightUnit && prevData.weightUnit && newData.weightUnit !== prevData.weightUnit) {
                if (newData.weightUnit === 'lbs' && prevData.currentWeight != null) {
                    newData.currentWeight = kgToLbs(prevData.currentWeight);
                    if (prevData.targetWeight != null) newData.targetWeight = kgToLbs(prevData.targetWeight);
                } else if (newData.weightUnit === 'kg' && prevData.currentWeight != null) {
                    newData.currentWeight = lbsToKg(prevData.currentWeight);
                    if (prevData.targetWeight != null) newData.targetWeight = lbsToKg(prevData.targetWeight);
                }
            }
            // Height
            if (newData.heightUnit && prevData.heightUnit && newData.heightUnit !== prevData.heightUnit && prevData.height != null) {
                newData.height = newData.heightUnit === 'ft' ? cmToInches(prevData.height) : inchesToCm(prevData.height);
            }

            state.data = { ...state.data, ...newData };
        },
        setGeneratedPlan: (state, action: PayloadAction<GeneratedPlan | null>) => {
            state.generatedPlan = action.payload;
        },
        updateGeneratedPlan: (state, action: PayloadAction<Partial<GeneratedPlan>>) => {
            if (state.generatedPlan) {
                state.generatedPlan = { ...state.generatedPlan, ...action.payload };
            }
        },
        resetOnboarding: (state) => {
            state.step = 1;
            state.data = {};
            state.generatedPlan = null;
            localStorage.removeItem(STORAGE_KEY);
        },
        clearStepData: (state, action: PayloadAction<number>) => {
            const step = action.payload;
            const fieldsToClear: Record<number, (keyof OnboardingData)[]> = {
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

            const fields = fieldsToClear[step];
            if (fields) {
                fields.forEach(field => {
                    delete state.data[field];
                });
            }
        },
    },
});

// Helper to replicate the useEffect defaults logic
function applyStepDefaults(state: OnboardingState) {
    const { step, data } = state;
    switch (step) {
        case 3:
            if (data.age == null) state.data.age = 25;
            break;
        case 4:
            if (data.height == null) {
                state.data.height = 170;
                state.data.heightUnit = data.heightUnit || 'cm';
            }
            break;
        case 5:
            if (data.currentWeight == null) {
                state.data.currentWeight = 70;
                state.data.weightUnit = data.weightUnit || 'kg';
            }
            break;
        case 7:
            if (data.targetWeight == null) state.data.targetWeight = (data.currentWeight || 70) - 5;
            break;
        case 13:
            if (data.exerciseFrequency == null) state.data.exerciseFrequency = 3;
            break;
    }
}

export const { setStep, nextStep, prevStep, updateData, setGeneratedPlan, updateGeneratedPlan, resetOnboarding, clearStepData } = onboardingSlice.actions;
export default onboardingSlice.reducer;
