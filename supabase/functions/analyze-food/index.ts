import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing food image...');

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a default response if parsing fails
      analysisResult = {
        foodName: "Food detected",
        mealType: "snack",
        items: [{ name: "Unknown food", calories: 200, position: { x: 50, y: 50 } }],
        totalNutrition: { calories: 200, carbs: 25, protein: 10, fats: 8, fiber: 2, sugar: 5, sodium: 300 },
        healthScore: 5,
        servingSize: "1 serving"
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing food:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
