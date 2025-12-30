import { OnboardingData, GeneratedPlan } from '@/store/slices/onboardingSlice';

export const calculatePlan = (data: OnboardingData): GeneratedPlan => {
    // 1. Standardize Weight to KG
    const isLbs = data.weightUnit === 'lbs';
    const weightKg = isLbs
        ? (data.currentWeight || 150) / 2.20462
        : (data.currentWeight || 70);

    // 2. Standardize Height to CM
    const heightCm = data.heightUnit === 'ft'
        ? (data.height || 67) * 2.54
        : (data.height || 170);

    // 3. Calculate BMR (Mifflin-St Jeor or Harris-Benedict revised)
    // Using Harris-Benedict (revised) as in original code logic
    const bmr = data.gender === 'male'
        ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * (data.age || 25))
        : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * (data.age || 25));

    const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };

    const tdee = bmr * (activityMultipliers[data.activityLevel || 'moderate'] || 1.55);
    let dailyCalories = Math.round(tdee);

    if (data.goal === 'lose') dailyCalories -= 500;
    if (data.goal === 'gain') dailyCalories += 300;

    // Ensure minimums
    if (data.gender === 'male' && dailyCalories < 1500) dailyCalories = 1500;
    if (data.gender === 'female' && dailyCalories < 1200) dailyCalories = 1200;

    const dailyCarbs = Math.round(dailyCalories * 0.45 / 4);
    const dailyProtein = Math.round(dailyCalories * 0.30 / 4);
    const dailyFats = Math.round(dailyCalories * 0.25 / 9);

    const recommendation = data.goal === 'lose'
        ? 'Based on your profile, we recommend a moderate calorie deficit for sustainable weight loss.'
        : data.goal === 'gain'
            ? 'Based on your profile, we recommend a slight calorie surplus to support muscle growth.'
            : 'Based on your profile, we recommend maintaining your current intake for stable weight.';

    // 4. Set Water Intake to 2000ml (User Request)
    const dailyWater = 2000;

    return {
        dailyCalories,
        dailyCarbs,
        dailyProtein,
        dailyFats,
        dailyWater,
        targetWeight: data.targetWeight || data.currentWeight || 65,
        recommendation
    };
};
