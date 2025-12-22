import { supabase } from '@/integrations/supabase/client';
import { checkMealBadges, updateUserStreak, checkGoalBadges } from '@/lib/badge-triggers';

export interface FoodItem {
  name: string;
  calories: number;
  position: { x: number; y: number };
}

export interface FoodAnalysisResult {
  foodName: string;
  mealType: string;
  items: FoodItem[];
  totalNutrition: {
    calories: number;
    carbs: number;
    protein: number;
    fats: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  healthScore: number;
  servingSize: string;
}

export async function analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-food', {
    body: { imageBase64 }
  });

  if (error) {
    throw new Error(error.message || 'Failed to analyze food');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Analysis failed');
  }

  return data.data;
}

export interface SaveFoodResult {
  entry: any;
  earnedBadgeIds: string[];
}

export async function saveFoodEntry(
  userId: string,
  analysis: FoodAnalysisResult,
  imageUrl?: string
): Promise<SaveFoodResult> {
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      user_id: userId,
      name: analysis.foodName,
      calories: analysis.totalNutrition.calories,
      carbs: analysis.totalNutrition.carbs,
      protein: analysis.totalNutrition.protein,
      fats: analysis.totalNutrition.fats,
      fiber: analysis.totalNutrition.fiber || 0,
      sugar: analysis.totalNutrition.sugar || 0,
      sodium: analysis.totalNutrition.sodium || 0,
      serving_size: analysis.servingSize,
      meal_type: analysis.mealType,
      image_url: imageUrl,
      logged_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  const earnedBadgeIds: string[] = [];

  // Check for meal badges
  const mealBadgeId = await checkMealBadges(userId);
  if (mealBadgeId) earnedBadgeIds.push(mealBadgeId);

  // Update streak and check for streak badges
  const { earnedBadgeId: streakBadgeId } = await updateUserStreak(userId);
  if (streakBadgeId) earnedBadgeIds.push(streakBadgeId);

  // Check for goal achievement badges
  const goalBadges = await checkGoalBadges(userId);
  earnedBadgeIds.push(...goalBadges);

  return { entry: data, earnedBadgeIds };
}

export async function uploadFoodImage(userId: string, imageBase64: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const fileName = `${userId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('food-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
