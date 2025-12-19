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
    const { barcode } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up barcode:', barcode);

    // Query OpenFoodFacts API (free, no API key needed)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'CalAI-App/1.0' } }
    );

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Extract nutrition per serving or per 100g
    const servingSize = product.serving_size || '100g';
    const nutritionPer = product.nutrition_data_per === 'serving' ? 'serving' : '100g';

    const result = {
      success: true,
      product: {
        name: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        barcode: barcode,
        image: product.image_url || product.image_front_url || null,
        servingSize: servingSize,
        nutrition: {
          calories: Math.round(nutriments['energy-kcal_serving'] || nutriments['energy-kcal_100g'] || 0),
          carbs: Math.round(nutriments.carbohydrates_serving || nutriments.carbohydrates_100g || 0),
          protein: Math.round(nutriments.proteins_serving || nutriments.proteins_100g || 0),
          fats: Math.round(nutriments.fat_serving || nutriments.fat_100g || 0),
          fiber: Math.round(nutriments.fiber_serving || nutriments.fiber_100g || 0),
          sugar: Math.round(nutriments.sugars_serving || nutriments.sugars_100g || 0),
          sodium: Math.round(nutriments.sodium_serving || nutriments.sodium_100g || 0)
        },
        nutritionPer,
        categories: product.categories_tags?.slice(0, 3) || [],
        nutriscore: product.nutriscore_grade || null
      }
    };

    console.log('Product found:', result.product.name);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Barcode lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Lookup failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
