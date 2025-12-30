-- Add feature toggle columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS burned_calories_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS rollover_calories_enabled boolean DEFAULT true;