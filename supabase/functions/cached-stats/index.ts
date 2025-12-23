import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MINUTES = {
  daily_summary: 5,      // 5 minutes for daily stats
  weekly_stats: 30,      // 30 minutes for weekly stats
  user_goals: 60,        // 1 hour for user goals
  nutrition_trends: 15   // 15 minutes for trends
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'daily_summary';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const cacheKey = `${type}:${user.id}:${new Date().toISOString().split('T')[0]}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('cache_entries')
        .select('data, expires_at')
        .eq('cache_key', cacheKey)
        .eq('user_id', user.id)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log(`Cache hit for ${cacheKey}`);
        return new Response(
          JSON.stringify({ success: true, data: cached.data, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Cache miss for ${cacheKey}, fetching fresh data`);

    // Fetch fresh data based on type
    let data;
    switch (type) {
      case 'daily_summary':
        data = await fetchDailySummary(supabase, user.id);
        break;
      case 'weekly_stats':
        data = await fetchWeeklyStats(supabase, user.id);
        break;
      case 'user_goals':
        data = await fetchUserGoals(supabase, user.id);
        break;
      case 'nutrition_trends':
        data = await fetchNutritionTrends(supabase, user.id);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Cache the result
    const ttl = CACHE_TTL_MINUTES[type as keyof typeof CACHE_TTL_MINUTES] || 15;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    await supabase
      .from('cache_entries')
      .upsert({
        cache_key: cacheKey,
        user_id: user.id,
        data,
        expires_at: expiresAt
      }, { onConflict: 'cache_key' });

    return new Response(
      JSON.stringify({ success: true, data, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cached-stats:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch stats' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchDailySummary(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's food entries
  const { data: entries } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', `${today}T00:00:00`)
    .lte('logged_at', `${today}T23:59:59`);

  // Get user goals
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_calories, daily_protein, daily_carbs, daily_fats, daily_fiber, daily_sugar, daily_sodium')
    .eq('user_id', userId)
    .single();

  const totals = (entries || []).reduce((acc: any, entry: any) => ({
    calories: acc.calories + (entry.calories || 0),
    protein: acc.protein + (entry.protein || 0),
    carbs: acc.carbs + (entry.carbs || 0),
    fats: acc.fats + (entry.fats || 0),
    fiber: acc.fiber + (entry.fiber || 0),
    sugar: acc.sugar + (entry.sugar || 0),
    sodium: acc.sodium + (entry.sodium || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 });

  return {
    date: today,
    totals,
    goals: profile || {},
    entryCount: entries?.length || 0
  };
}

async function fetchWeeklyStats(supabase: any, userId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const { data: entries } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startDate.toISOString())
    .lte('logged_at', endDate.toISOString());

  // Group by day
  const dailyData: Record<string, any> = {};
  (entries || []).forEach((entry: any) => {
    const day = entry.logged_at.split('T')[0];
    if (!dailyData[day]) {
      dailyData[day] = { calories: 0, protein: 0, carbs: 0, fats: 0, entries: 0 };
    }
    dailyData[day].calories += entry.calories || 0;
    dailyData[day].protein += entry.protein || 0;
    dailyData[day].carbs += entry.carbs || 0;
    dailyData[day].fats += entry.fats || 0;
    dailyData[day].entries += 1;
  });

  const daysLogged = Object.keys(dailyData).length;
  const avgCalories = daysLogged > 0 
    ? Math.round(Object.values(dailyData).reduce((sum: number, d: any) => sum + d.calories, 0) / daysLogged)
    : 0;

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dailyData,
    daysLogged,
    avgCalories,
    totalEntries: entries?.length || 0
  };
}

async function fetchUserGoals(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    profile: profile || {},
    streak: streak || { current_streak: 0, longest_streak: 0 }
  };
}

async function fetchNutritionTrends(supabase: any, userId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: entries } = await supabase
    .from('food_entries')
    .select('logged_at, calories, protein, carbs, fats, fiber, sugar, sodium')
    .eq('user_id', userId)
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true });

  // Aggregate by day
  const trends: Record<string, any> = {};
  (entries || []).forEach((entry: any) => {
    const day = entry.logged_at.split('T')[0];
    if (!trends[day]) {
      trends[day] = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 };
    }
    trends[day].calories += entry.calories || 0;
    trends[day].protein += entry.protein || 0;
    trends[day].carbs += entry.carbs || 0;
    trends[day].fats += entry.fats || 0;
    trends[day].fiber += entry.fiber || 0;
    trends[day].sugar += entry.sugar || 0;
    trends[day].sodium += entry.sodium || 0;
  });

  return {
    period: '30d',
    trends: Object.entries(trends).map(([date, data]) => ({ date, ...data as object }))
  };
}
