import { supabase } from '@/integrations/supabase/client';

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  image?: string;
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    // Search OpenFoodFacts API
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
    );

    if (!response.ok) {
      throw new Error('Failed to search foods');
    }

    const data = await response.json();

    return (data.products || [])
      .filter((product: any) => product.product_name && product.nutriments)
      .map((product: any) => ({
        id: product.code || product._id,
        name: product.product_name || 'Unknown',
        brand: product.brands,
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy-kcal'] || 0),
        protein: Math.round((product.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fats: Math.round((product.nutriments?.fat_100g || 0) * 10) / 10,
        servingSize: product.serving_size || '100g',
        image: product.image_small_url || product.image_url
      }));
  } catch (error) {
    console.error('Error searching foods:', error);
    return [];
  }
}

export async function logFoodFromLibrary(
  userId: string,
  food: FoodSearchResult,
  quantity: number = 1
): Promise<void> {
  const { error } = await supabase.from('food_entries').insert({
    user_id: userId,
    name: food.name,
    calories: Math.round(food.calories * quantity),
    protein: Math.round(food.protein * quantity * 10) / 10,
    carbs: Math.round(food.carbs * quantity * 10) / 10,
    fats: Math.round(food.fats * quantity * 10) / 10,
    serving_size: food.servingSize,
    image_url: food.image,
    logged_at: new Date().toISOString()
  });

  if (error) throw error;
}
