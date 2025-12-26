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

export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: FoodAnalysisResult;
  error?: string;
  imageUrl?: string;
}

export interface RateLimitError extends Error {
  limitReached: boolean;
  scansUsed: number;
  scansLimit: number;
}

export interface EnqueueResult {
  jobId: string;
  usage?: {
    scansUsed: number;
    scansLimit: number;
    isPremium: boolean;
  };
}

// Enqueue a food analysis job (async)
export async function enqueueAnalysis(imageBase64: string): Promise<EnqueueResult> {
  const { data, error } = await supabase.functions.invoke('enqueue-food-analysis', {
    body: { imageBase64 }
  });

  if (error) {
    throw new Error(error.message || 'Failed to enqueue analysis');
  }

  // Check for rate limit error
  if (data?.limitReached) {
    const rateLimitError = new Error(data.error || 'Daily scan limit reached') as RateLimitError;
    rateLimitError.limitReached = true;
    rateLimitError.scansUsed = data.scansUsed;
    rateLimitError.scansLimit = data.scansLimit;
    throw rateLimitError;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to enqueue');
  }

  return {
    jobId: data.jobId,
    usage: data.usage
  };
}

// Poll for job status
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || "https://ijotcekseqoasueihvsh.supabase.co"}/functions/v1/get-job-status?jobId=${jobId}`,
    {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  const data = await response.json();
  return data.job;
}

// Poll until job completes
export async function waitForAnalysis(
  jobId: string,
  onProgress?: (status: string) => void,
  maxWaitMs: number = 60000,
  pollIntervalMs: number = 1000
): Promise<FoodAnalysisResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getJobStatus(jobId);

    if (status.status === 'completed' && status.result) {
      return status.result;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Analysis failed');
    }

    onProgress?.(status.status === 'processing' ? 'Analyzing food...' : 'Queued...');

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Analysis timed out');
}

// Legacy synchronous analysis (fallback)
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

// Utility for exponential backoff retry
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's a permanent error (like 400 Bad Request)
      // But DO retry 429s (Rate Limit) and 5xx (Server Errors)
      const isRateLimit = error.limitReached || error.message?.includes('429') || error.status === 429;
      const isServerErr = error.message?.includes('500') || error.message?.includes('503') || error.status >= 500;

      if (!isRateLimit && !isServerErr) {
        throw error;
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }

  throw lastError;
}

// Async analysis using job queue
export async function analyzeFoodAsync(
  imageBase64: string,
  onProgress?: (status: string) => void
): Promise<FoodAnalysisResult> {
  onProgress?.('Queuing analysis...');

  // Wrap enqueue in retry logic
  const { jobId } = await withRetry(() => enqueueAnalysis(imageBase64), 3, 2000);

  // Wait for result (polling internal logic already handles some waiting, but wrap top level if needed)
  // Logic here assumes polling is safe, but we can wrap individual poll checks if network flakes
  return waitForAnalysis(jobId, onProgress);
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
  // Detect mime type
  const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
  const extension = mimeType.split('/')[1] === 'webp' ? 'webp' : 'jpg';

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const fileName = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('food-images')
    .getPublicUrl(fileName);

  return publicUrl;
}
