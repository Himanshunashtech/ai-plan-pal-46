-- Add composite index for optimized queries on food_entries
CREATE INDEX IF NOT EXISTS idx_food_entries_user_logged 
ON public.food_entries(user_id, logged_at DESC);

-- Add index for daily_nutrition_logs as well
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_logs_user_date 
ON public.daily_nutrition_logs(user_id, log_date DESC);