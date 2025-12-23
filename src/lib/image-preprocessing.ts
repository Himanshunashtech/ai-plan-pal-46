/**
 * Image preprocessing utilities for optimizing AI inference
 * - Resize to max 512px
 * - Convert to WebP format
 * - Strip metadata
 * Reduces inference time by 30-50%
 */

const MAX_DIMENSION = 512;
const WEBP_QUALITY = 0.85;

/**
 * Check if WebP is supported by the browser
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

/**
 * Load an image from a data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Preprocess image for AI analysis:
 * 1. Resize to max 512px (maintains aspect ratio)
 * 2. Convert to WebP (with JPEG fallback)
 * 3. Strip all metadata
 * 
 * @param imageDataUrl - The original image as a data URL
 * @returns Optimized image as a data URL
 */
export async function preprocessImage(imageDataUrl: string): Promise<string> {
  try {
    const img = await loadImage(imageDataUrl);
    
    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      MAX_DIMENSION
    );

    // Create canvas with new dimensions (strips metadata automatically)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use high-quality image smoothing for downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to WebP if supported, otherwise JPEG
    const format = supportsWebP() ? 'image/webp' : 'image/jpeg';
    const quality = supportsWebP() ? WEBP_QUALITY : 0.85;
    
    return canvas.toDataURL(format, quality);
  } catch (error) {
    console.error('Image preprocessing failed, using original:', error);
    return imageDataUrl;
  }
}

/**
 * Get the size of a base64 data URL in bytes
 */
export function getBase64Size(dataUrl: string): number {
  // Remove data URL prefix and calculate base64 size
  const base64 = dataUrl.split(',')[1] || dataUrl;
  return Math.round((base64.length * 3) / 4);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
