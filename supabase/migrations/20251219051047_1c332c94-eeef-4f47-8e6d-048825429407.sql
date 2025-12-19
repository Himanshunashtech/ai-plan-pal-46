-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  age INTEGER,
  height NUMERIC,
  height_unit TEXT DEFAULT 'cm',
  current_weight NUMERIC,
  target_weight NUMERIC,
  weight_unit TEXT DEFAULT 'kg',
  activity_level TEXT,
  goal TEXT,
  weekly_goal NUMERIC,
  diet_type TEXT,
  allergies TEXT[],
  meals_per_day INTEGER,
  water_intake INTEGER,
  sleep_hours INTEGER,
  stress_level TEXT,
  motivation TEXT[],
  previous_diets BOOLEAN DEFAULT false,
  cooking_time TEXT,
  snacking TEXT,
  exercise_frequency INTEGER,
  exercise_type TEXT[],
  health_conditions TEXT[],
  medications BOOLEAN DEFAULT false,
  target_date DATE,
  daily_calories INTEGER,
  daily_carbs INTEGER,
  daily_protein INTEGER,
  daily_fats INTEGER,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create food_entries table
CREATE TABLE public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  fats NUMERIC DEFAULT 0,
  serving_size TEXT,
  meal_type TEXT,
  image_url TEXT,
  barcode TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily_nutrition_logs table
CREATE TABLE public.daily_nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_fats NUMERIC DEFAULT 0,
  water_intake INTEGER DEFAULT 0,
  weight NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for food_entries
CREATE POLICY "Users can view their own food entries" 
ON public.food_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food entries" 
ON public.food_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries" 
ON public.food_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries" 
ON public.food_entries FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for daily_nutrition_logs
CREATE POLICY "Users can view their own daily logs" 
ON public.daily_nutrition_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs" 
ON public.daily_nutrition_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs" 
ON public.daily_nutrition_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs" 
ON public.daily_nutrition_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_nutrition_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();