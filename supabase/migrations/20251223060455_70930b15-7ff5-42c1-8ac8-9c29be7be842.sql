-- Create usage tracking table for rate limiting
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
ON public.user_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.user_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.user_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient lookups
CREATE INDEX idx_user_usage_user_date ON public.user_usage(user_id, usage_date);

-- Create function to check and increment usage (security definer to bypass RLS for service role)
CREATE OR REPLACE FUNCTION public.check_and_increment_scan_usage(
  p_user_id UUID,
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_subscription_status TEXT;
  v_is_premium BOOLEAN;
BEGIN
  -- Get user's subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Check if premium (active, trial, or premium status)
  v_is_premium := v_subscription_status IN ('active', 'premium', 'trial');
  
  -- If premium, always allow
  IF v_is_premium THEN
    -- Still track usage for analytics
    INSERT INTO public.user_usage (user_id, usage_date, scan_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET scan_count = user_usage.scan_count + 1, updated_at = now();
    
    RETURN jsonb_build_object(
      'allowed', true,
      'is_premium', true,
      'scans_used', 0,
      'scans_limit', -1
    );
  END IF;
  
  -- Get or create today's usage
  INSERT INTO public.user_usage (user_id, usage_date, scan_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;
  
  SELECT scan_count INTO v_current_count
  FROM public.user_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  -- Check if under limit
  IF v_current_count >= p_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'is_premium', false,
      'scans_used', v_current_count,
      'scans_limit', p_daily_limit,
      'message', 'Daily scan limit reached. Upgrade to Premium for unlimited scans.'
    );
  END IF;
  
  -- Increment usage
  UPDATE public.user_usage
  SET scan_count = scan_count + 1, updated_at = now()
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'is_premium', false,
    'scans_used', v_current_count + 1,
    'scans_limit', p_daily_limit
  );
END;
$$;