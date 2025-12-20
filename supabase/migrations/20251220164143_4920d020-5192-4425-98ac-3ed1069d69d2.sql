-- Add fiber, sugar, sodium columns to daily_nutrition_logs
ALTER TABLE public.daily_nutrition_logs 
ADD COLUMN IF NOT EXISTS total_fiber numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sugar numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sodium numeric DEFAULT 0;

-- Add daily goals for fiber, sugar, sodium to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_fiber integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS daily_sugar integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS daily_sodium integer DEFAULT 2300;

-- Add fiber, sugar, sodium to food_entries
ALTER TABLE public.food_entries
ADD COLUMN IF NOT EXISTS fiber numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugar numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sodium numeric DEFAULT 0;