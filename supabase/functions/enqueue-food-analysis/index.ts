import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Create a job in the queue
    const { data: job, error: insertError } = await supabase
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
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
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
        message: 'Job queued for processing'
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
