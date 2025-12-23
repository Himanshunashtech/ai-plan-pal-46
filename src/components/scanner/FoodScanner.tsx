import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '@/hooks/useCamera';
import { analyzeFoodAsync, FoodAnalysisResult, RateLimitError } from '@/lib/api/food-analysis';
import { Button } from '@/components/ui/button';
import { X, Camera, Zap, Loader2, Crown } from 'lucide-react';
import FoodLabels from './FoodLabels';
import FoodResultSheet from './FoodResultSheet';
import { toast } from 'sonner';

interface FoodScannerProps {
  onClose: () => void;
  onFoodLogged: (result: FoodAnalysisResult, imageUrl: string) => void;
}

const FoodScanner = ({ onClose, onFoodLogged }: FoodScannerProps) => {
  const navigate = useNavigate();
  const { videoRef, isStreaming, error, startCamera, stopCamera, capturePhoto } = useCamera();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    setIsAnalyzing(true);
    setAnalyzeStatus('Optimizing image...');
    setRateLimitReached(false);

    const photo = await capturePhoto();
    if (!photo) {
      setIsAnalyzing(false);
      return;
    }

    setCapturedImage(photo);
    setAnalyzeStatus('Queuing analysis...');

    try {
      // Use async job queue for better reliability
      const result = await analyzeFoodAsync(photo, (status) => {
        setAnalyzeStatus(status);
      });
      setAnalysisResult(result);
      setShowResult(true);
    } catch (err: any) {
      console.error('Analysis error:', err);
      
      // Check if it's a rate limit error
      if (err.limitReached) {
        setRateLimitReached(true);
        setRateLimitInfo({ used: err.scansUsed, limit: err.scansLimit });
        toast.error('Daily scan limit reached', {
          description: 'Upgrade to Premium for unlimited scans!'
        });
      } else {
        setAnalyzeStatus('Analysis failed. Please try again.');
        toast.error('Analysis failed', {
          description: err.message || 'Please try again'
        });
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
    calories: number; carbs: number; protein: number; fats: number;
    fiber: number; sugar: number; sodium: number;
  }) => {
    if (analysisResult && capturedImage) {
      // Create updated result with adjusted nutrition
      const updatedResult: FoodAnalysisResult = {
        ...analysisResult,
        totalNutrition: adjustedNutrition
      };
      onFoodLogged(updatedResult, capturedImage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4 safe-area-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">🍎 Calo</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {capturedImage ? (
          <div className="absolute inset-0">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
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

        {/* Scanning Frame */}
        {!capturedImage && isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 border-2 border-white/60 rounded-3xl">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-center px-8">{error}</p>
          </div>
        )}

        {/* Rate Limit Overlay */}
        {rateLimitReached && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="bg-card rounded-3xl p-6 mx-6 text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Daily Limit Reached</h3>
              <p className="text-muted-foreground mb-4">
                You've used all {rateLimitInfo?.limit} free scans for today. Upgrade to Premium for unlimited scans!
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
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">{analyzeStatus || 'Analyzing food...'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 safe-area-bottom">
        <div className="flex items-center justify-center gap-6 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/40 text-white"
          >
            <Zap className="w-5 h-5" />
          </Button>

          {capturedImage ? (
            <Button
              onClick={handleRetake}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-black" />
            </Button>
          ) : (
            <Button
              onClick={handleCapture}
              disabled={!isStreaming || isAnalyzing}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center hover:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </Button>
          )}

          <div className="w-12 h-12" />
        </div>
      </div>

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
