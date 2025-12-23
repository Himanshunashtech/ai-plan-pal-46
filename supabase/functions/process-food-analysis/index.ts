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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { jobId } = await req.json();

    if (!jobId) {
      // If no jobId provided, process pending jobs
      const { data: pendingJobs, error: fetchError } = await supabase
        .from('food_analysis_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (fetchError) {
        throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
      }

      if (!pendingJobs || pendingJobs.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No pending jobs' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing ${pendingJobs.length} pending jobs`);

      for (const job of pendingJobs) {
        await processJob(supabase, job);
      }

      return new Response(
        JSON.stringify({ success: true, processed: pendingJobs.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process specific job
    const { data: job, error: jobError } = await supabase
      .from('food_analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    await processJob(supabase, job);

    return new Response(
      JSON.stringify({ success: true, jobId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing job:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processJob(supabase: any, job: any) {
  console.log(`Processing job ${job.id} for user ${job.user_id}`);

  // Update status to processing
  await supabase
    .from('food_analysis_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const imageBase64 = job.image_base64;

    console.log('Calling AI for food analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert AI that analyzes food images. When given an image of food, identify all food items visible and provide detailed nutritional information including fiber, sugar, and sodium.

Always respond with valid JSON in this exact format:
{
  "foodName": "Main dish name",
  "mealType": "breakfast|lunch|dinner|snack",
  "items": [
    {
      "name": "Item name",
      "calories": number,
      "position": { "x": 0-100, "y": 0-100 }
    }
  ],
  "totalNutrition": {
    "calories": number,
    "carbs": number (in grams),
    "protein": number (in grams),
    "fats": number (in grams),
    "fiber": number (in grams),
    "sugar": number (in grams),
    "sodium": number (in milligrams)
  },
  "healthScore": number (1-10),
  "servingSize": "1 serving"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image. Identify each food item with its approximate position (as percentage from top-left), calories, and provide total nutritional breakdown including fiber, sugar, and sodium. Return only valid JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add funds.');
      }
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysisResult = {
        foodName: "Food detected",
        mealType: "snack",
        items: [{ name: "Unknown food", calories: 200, position: { x: 50, y: 50 } }],
        totalNutrition: { calories: 200, carbs: 25, protein: 10, fats: 8, fiber: 2, sugar: 5, sodium: 300 },
        healthScore: 5,
        servingSize: "1 serving"
      };
    }

    // Upload image to storage with CDN-optimized settings
    let imageUrl = null;
    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Detect WebP format from base64 header
      const isWebP = imageBase64.includes('data:image/webp');
      const contentType = isWebP ? 'image/webp' : 'image/jpeg';
      const extension = isWebP ? 'webp' : 'jpg';
      const fileName = `${job.user_id}/${job.id}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(fileName, buffer, {
          contentType,
          cacheControl: '31536000', // 1 year cache - immutable content
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('food-images')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
        console.log('Image uploaded to CDN:', imageUrl);
      }
    } catch (uploadErr) {
      console.error('Failed to upload image:', uploadErr);
    }

    // Update job with result
    await supabase
      .from('food_analysis_jobs')
      .update({
        status: 'completed',
        result: analysisResult,
        image_url: imageUrl,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`Job ${job.id} completed successfully`);

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);

    await supabase
      .from('food_analysis_jobs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}
