import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '@/hooks/useCamera';
import { analyzeFoodAsync, FoodAnalysisResult } from '@/lib/api/food-analysis';
import { Button } from '@/components/ui/button';
import { X, Camera, Zap, Loader2, Crown, AlertCircle } from 'lucide-react';
import FoodLabels from './FoodLabels';
import FoodResultSheet from './FoodResultSheet';
import { toast } from 'sonner';
import AISparkleOverlay from './AISparkleOverlay';
import { useTranslation } from 'react-i18next';

interface FoodScannerProps {
  onClose: () => void;
  onFoodLogged: (result: FoodAnalysisResult, imageUrl: string) => void;
  onSheetOpenChange?: (isOpen: boolean) => void;
}

const FoodScanner = ({ onClose, onFoodLogged, onSheetOpenChange }: FoodScannerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { videoRef, isStreaming, error, startCamera, stopCamera, capturePhoto } =
    useCamera();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<FoodAnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] =
    useState<{ used: number; limit: number } | null>(null);
  const [noFoodDetected, setNoFoodDetected] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    onSheetOpenChange?.(showResult);
  }, [showResult, onSheetOpenChange]);

  const handleCapture = async () => {
    setIsAnalyzing(true);
    setAnalyzeStatus('Optimizing image...');
    setRateLimitReached(false);
    setNoFoodDetected(false);

    const photo = await capturePhoto();
    if (!photo) {
      setIsAnalyzing(false);
      return;
    }

    const toggleTorch = async () => {
      if (!videoRef.current) return;

      const stream = videoRef.current.srcObject as MediaStream | null;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track) return;

      // Check torch support
      // @ts-ignore
      const capabilities = track.getCapabilities?.() as any;
      if (!capabilities?.torch) {
        toast.error('Flash not supported on this device');
        return;
      }

      try {
        await track.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(prev => !prev);
      } catch (err) {
        console.error('Torch error', err);
      }
    };


    setCapturedImage(photo);
    setAnalyzeStatus('Queuing analysis...');

    try {
      const result = await analyzeFoodAsync(photo, (status) =>
        setAnalyzeStatus(status)
      );
      setAnalysisResult(result);
      setShowResult(true);
    } catch (err: any) {
      if (err.limitReached) {
        setRateLimitReached(true);
        setRateLimitInfo({ used: err.scansUsed, limit: err.scansLimit });
        toast.error('Daily scan limit reached');
      } else if (err.noFood || err.message?.includes('No food detected')) {
        setNoFoodDetected(true);
        toast.error(t('no_food_detected'));
      } else {
        toast.error('Analysis failed');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/subscription');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setShowResult(false);
    startCamera();
  };

  const handleDone = (adjustedNutrition: {
    foodName?: string;
    calories: number;
    carbs: number;
    protein: number;
    fats: number;
    fiber: number;
    sugar: number;
    sodium: number;
  }) => {
    if (analysisResult && capturedImage) {
      onFoodLogged(
        {
          ...analysisResult,
          foodName: adjustedNutrition.foodName || analysisResult.foodName,
          totalNutrition: adjustedNutrition
        },
        capturedImage
      );
    }
    onClose();
  };

  const toggleTorch = async () => {
    if (!videoRef.current) return;

    const stream = videoRef.current.srcObject as MediaStream | null;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    // Check torch support
    // @ts-ignore
    const capabilities = track.getCapabilities?.() as any;
    if (!capabilities?.torch) {
      toast.error('Flash not supported on this device');
      return;
    }

    try {
      await track.applyConstraints({
        // @ts-ignore
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(prev => !prev);
    } catch (err) {
      console.error('Torch error', err);
    }
  };

  useEffect(() => {
    return () => {
      if (!videoRef.current) return;

      const stream = videoRef.current.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];

      if (track) {
        track.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: false }],
        });
      }
    };
  }, []);


  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-8 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 text-white "
        >
          <X className="w-5 h-5" />
        </Button>


        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {capturedImage ? (
          <div className="absolute inset-0">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            {analysisResult && <FoodLabels items={analysisResult.items} />}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Scan Frame */}
        {!capturedImage && isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 border-2 border-white/60 rounded-3xl mb-20" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* Rate Limit */}
        {rateLimitReached && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
            <div className="bg-card rounded-3xl p-6 mx-6 text-center max-w-sm">
              <Crown className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
              <p className="text-muted-foreground mb-4">
                {rateLimitInfo?.limit} free scans used today
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setRateLimitReached(false);
                    setCapturedImage(null);
                    startCamera();
                  }}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                  onClick={handleUpgrade}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No Food Detected */}
        {noFoodDetected && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
            <div className="bg-card rounded-3xl p-6 mx-6 text-center max-w-sm">
              <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">{t('no_food_detected')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('scan_real_food')}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  setNoFoodDetected(false);
                  setCapturedImage(null);
                  startCamera();
                }}
              >
                {t('try_again')}
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isAnalyzing && <AISparkleOverlay />}
      </div>

      {/* ✅ Bottom Controls — HIDDEN when result is open */}
      {!showResult && (
        <div className="absolute bottom-0 left-0 right-0 pb-8 pb-safe">
          <div className="flex items-center justify-center gap-6 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-full ${torchOn ? 'bg-yellow-400/80' : 'bg-black/40'
                } text-white`}
              onClick={toggleTorch}
            >
              <Zap className="w-5 h-5" />
            </Button>


            <Button
              onClick={capturedImage ? handleRetake : handleCapture}
              disabled={!isStreaming || isAnalyzing}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-black" />
            </Button>

            <div className="w-12 h-12" />
          </div>
        </div>
      )}

      {/* Result Sheet */}
      {showResult && analysisResult && capturedImage && (
        <FoodResultSheet
          result={analysisResult}
          imageUrl={capturedImage}
          onClose={() => setShowResult(false)}
          onDone={handleDone}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
};

export default FoodScanner;
