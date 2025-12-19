import { useState, useRef, useCallback, useEffect } from 'react';

interface BarcodeResult {
  rawValue: string;
  format: string;
}

export const useBarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const animationRef = useRef<number>();

  const startScanning = useCallback(async () => {
    try {
      setError(null);

      // Check for BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setError('Barcode scanning is not supported in this browser. Please use Chrome on Android or Safari on iOS.');
        return;
      }

      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Camera access denied or barcode detection not supported.');
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const scanFrame = useCallback(async (): Promise<BarcodeResult | null> => {
    if (!videoRef.current || !detectorRef.current || !isScanning) return null;

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        return {
          rawValue: barcodes[0].rawValue,
          format: barcodes[0].format
        };
      }
    } catch (err) {
      console.error('Detection error:', err);
    }
    return null;
  }, [isScanning]);

  return {
    videoRef,
    isScanning,
    error,
    startScanning,
    stopScanning,
    scanFrame
  };
};
