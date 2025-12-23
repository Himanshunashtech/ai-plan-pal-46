import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** Use CDN transformations for Supabase storage URLs */
  useCdnTransform?: boolean;
  /** Fallback element when no image */
  fallback?: React.ReactNode;
  /** Eager loading for above-the-fold images */
  priority?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Check if URL is from Supabase storage
 */
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/');
}

/**
 * Extract file path from Supabase storage URL
 */
function getStoragePath(url: string): { bucket: string; path: string } | null {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (match) {
    return { bucket: match[1], path: match[2] };
  }
  return null;
}

/**
 * Generate srcset for Supabase storage images
 */
function generateSrcSet(url: string): string {
  const storage = getStoragePath(url);
  if (!storage) return '';

  const widths = [200, 400, 800];
  return widths
    .map(w => {
      const transformUrl = `${SUPABASE_URL}/storage/v1/render/image/public/${storage.bucket}/${storage.path}?width=${w}&format=webp&quality=85`;
      return `${transformUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Generate thumbnail URL for Supabase storage images
 */
function getThumbnailUrl(url: string, size: number): string {
  const storage = getStoragePath(url);
  if (!storage) return url;
  
  return `${SUPABASE_URL}/storage/v1/render/image/public/${storage.bucket}/${storage.path}?width=${size}&height=${size}&resize=cover&format=webp&quality=80`;
}

/**
 * Optimized image component with:
 * - Lazy loading (native browser)
 * - Responsive srcset for Supabase images
 * - WebP format via CDN transforms
 * - Blur placeholder while loading
 * - Error fallback
 */
export function OptimizedImage({
  src,
  alt,
  className,
  sizes = '(max-width: 640px) 100vw, 50vw',
  useCdnTransform = true,
  fallback,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if already loaded (cached)
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  if (!src || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  const isSupabase = isSupabaseStorageUrl(src);
  const srcSet = useCdnTransform && isSupabase ? generateSrcSet(src) : undefined;
  
  // Use optimized URL for non-srcset browsers
  const optimizedSrc = useCdnTransform && isSupabase 
    ? getThumbnailUrl(src, 400) 
    : src;

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
    />
  );
}

/**
 * Food image thumbnail optimized for lists
 */
export function FoodThumbnail({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      sizes="56px"
      fallback={fallback}
    />
  );
}

/**
 * Food image for detail views
 */
export function FoodDetailImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) return null;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      sizes="(max-width: 640px) 100vw, 400px"
      priority={priority}
    />
  );
}
