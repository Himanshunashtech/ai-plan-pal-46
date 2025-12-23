import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_SCAN_LIMIT = 10; // Free users get 10 scans per day

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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // User client for auth
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for rate limiting function
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit using the database function
    const { data: usageCheck, error: usageError } = await supabaseService
      .rpc('check_and_increment_scan_usage', {
        p_user_id: user.id,
        p_daily_limit: DAILY_SCAN_LIMIT
      });

    if (usageError) {
      console.error('Usage check error:', usageError);
      throw new Error('Failed to check usage limits');
    }

    console.log('Usage check result:', usageCheck);

    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: usageCheck.message || 'Daily scan limit reached',
          limitReached: true,
          scansUsed: usageCheck.scans_used,
          scansLimit: usageCheck.scans_limit
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enqueueing food analysis job for user ${user.id}`);

    // Create a job in the queue (use service client to bypass RLS for job creation)
    const { data: job, error: insertError } = await supabaseService
      .from('food_analysis_jobs')
      .insert({
        user_id: user.id,
        image_base64: imageBase64,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create job:', insertError);
      throw new Error('Failed to enqueue job');
    }

    console.log(`Created job ${job.id}`);

    // Trigger the processor function asynchronously
    const processUrl = `${supabaseUrl}/functions/v1/process-food-analysis`;
    
    // Use globalThis.EdgeRuntime if available, otherwise fire-and-forget
    const processPromise = fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ jobId: job.id })
    }).catch(err => console.error('Failed to trigger processor:', err));
    
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof globalThis.EdgeRuntime !== 'undefined') {
      // @ts-ignore
      globalThis.EdgeRuntime.waitUntil(processPromise);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: 'Job queued for processing',
        usage: {
          scansUsed: usageCheck.scans_used,
          scansLimit: usageCheck.scans_limit,
          isPremium: usageCheck.is_premium
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enqueueing job:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to enqueue job' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
