import { supabase } from '@/integrations/supabase/client';

export interface BarcodeProduct {
  name: string;
  brand: string;
  barcode: string;
  image: string | null;
  servingSize: string;
  nutrition: {
    calories: number;
    carbs: number;
    protein: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  nutritionPer: string;
  categories: string[];
  nutriscore: string | null;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct> {
  const { data, error } = await supabase.functions.invoke('barcode-lookup', {
    body: { barcode }
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Product not found');

  return data.product;
}
