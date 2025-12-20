-- Add steps and calories_burned columns to daily_nutrition_logs
ALTER TABLE public.daily_nutrition_logs 
ADD COLUMN IF NOT EXISTS steps integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS calories_burned integer DEFAULT 0;