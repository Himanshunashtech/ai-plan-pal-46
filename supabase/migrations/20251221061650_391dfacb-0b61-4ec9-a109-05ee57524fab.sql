-- Add scheduled deletion column to profiles
ALTER TABLE public.profiles 
ADD COLUMN scheduled_deletion_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient querying of scheduled deletions
CREATE INDEX idx_profiles_scheduled_deletion ON public.profiles(scheduled_deletion_at) 
WHERE scheduled_deletion_at IS NOT NULL;