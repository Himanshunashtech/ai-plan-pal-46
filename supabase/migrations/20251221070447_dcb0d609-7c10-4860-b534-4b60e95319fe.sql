-- Add email preferences columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_weekly_summary boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_meal_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_streak_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_tips_updates boolean DEFAULT true;