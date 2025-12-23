-- Create job queue table for async food analysis
CREATE TABLE public.food_analysis_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_base64 TEXT NOT NULL,
  image_url TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.food_analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own jobs"
ON public.food_analysis_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
ON public.food_analysis_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.food_analysis_jobs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_food_analysis_jobs_updated_at
BEFORE UPDATE ON public.food_analysis_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient job polling
CREATE INDEX idx_food_analysis_jobs_status ON public.food_analysis_jobs(status, created_at);
CREATE INDEX idx_food_analysis_jobs_user ON public.food_analysis_jobs(user_id, created_at DESC);

-- Create cache table for summaries (alternative to Redis for Supabase-native solution)
CREATE TABLE public.cache_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cache"
ON public.cache_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache"
ON public.cache_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache"
ON public.cache_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cache"
ON public.cache_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for cache lookups
CREATE INDEX idx_cache_entries_key ON public.cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires ON public.cache_entries(expires_at);