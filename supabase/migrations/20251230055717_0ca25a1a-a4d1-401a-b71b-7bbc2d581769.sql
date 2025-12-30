-- Add rollover_calories column to daily_nutrition_logs table
ALTER TABLE public.daily_nutrition_logs
ADD COLUMN IF NOT EXISTS rollover_calories integer DEFAULT 0;