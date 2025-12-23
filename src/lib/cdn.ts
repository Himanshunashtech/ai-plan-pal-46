import { supabase } from '@/integrations/supabase/client';

/**
 * CDN utilities for optimized image delivery from Supabase Storage
 * Supabase automatically serves public bucket images via their global CDN
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'contain' | 'cover' | 'fill';
}

/**
 * Get CDN URL for a food image with optional transformations
 * Uses Supabase Image Transformation for on-the-fly optimization
 */
export function getFoodImageCdnUrl(
  fileName: string,
  options?: ImageTransformOptions
): string {
  const bucket = 'food-images';
  
  // Build transform parameters
  const transforms: string[] = [];
  
  if (options?.width) transforms.push(`width=${options.width}`);
  if (options?.height) transforms.push(`height=${options.height}`);
  if (options?.quality) transforms.push(`quality=${options.quality}`);
  if (options?.format) transforms.push(`format=${options.format}`);
  if (options?.resize) transforms.push(`resize=${options.resize}`);
  
  // Use render endpoint for transformations, otherwise public URL
  if (transforms.length > 0) {
    const transformString = transforms.join('&');
    return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${fileName}?${transformString}`;
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
}

/**
 * Get thumbnail URL for food images (optimized for lists/grids)
 */
export function getFoodThumbnailUrl(fileName: string): string {
  return getFoodImageCdnUrl(fileName, {
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp',
    resize: 'cover',
  });
}

/**
 * Get medium-sized URL for food images (optimized for detail views)
 */
export function getFoodMediumUrl(fileName: string): string {
  return getFoodImageCdnUrl(fileName, {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp',
    resize: 'contain',
  });
}

/**
 * Get full-size optimized URL for food images
 */
export function getFoodFullUrl(fileName: string): string {
  return getFoodImageCdnUrl(fileName, {
    width: 800,
    quality: 90,
    format: 'webp',
    resize: 'contain',
  });
}

/**
 * Get avatar CDN URL with transformations
 */
export function getAvatarCdnUrl(
  fileName: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const bucket = 'avatars';
  const sizes = {
    small: 40,
    medium: 80,
    large: 160,
  };
  
  const dimension = sizes[size];
  
  return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${fileName}?width=${dimension}&height=${dimension}&resize=cover&format=webp&quality=85`;
}

/**
 * Upload image to food-images bucket with CDN-optimized settings
 */
export async function uploadFoodImage(
  userId: string,
  jobId: string,
  imageBase64: string
): Promise<{ url: string; error: Error | null }> {
  try {
    // Remove data URL prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Determine content type
    const isWebP = imageBase64.startsWith('data:image/webp');
    const contentType = isWebP ? 'image/webp' : 'image/jpeg';
    const extension = isWebP ? 'webp' : 'jpg';
    
    const fileName = `${userId}/${jobId}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache (immutable content)
        upsert: false,
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Return the CDN URL
    const url = getFoodImageCdnUrl(fileName);
    
    return { url, error: null };
  } catch (error) {
    console.error('Failed to upload food image:', error);
    return { url: '', error: error as Error };
  }
}

/**
 * Preload image for faster display
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get srcset for responsive images
 */
export function getFoodImageSrcSet(fileName: string): string {
  const widths = [200, 400, 800];
  return widths
    .map(w => `${getFoodImageCdnUrl(fileName, { width: w, format: 'webp', quality: 85 })} ${w}w`)
    .join(', ');
}
