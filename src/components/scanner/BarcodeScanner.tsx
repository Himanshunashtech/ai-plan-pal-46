import { useState, useEffect, useCallback } from 'react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { lookupBarcode, BarcodeProduct } from '@/lib/api/barcode';
import { Button } from '@/components/ui/button';
import { X, Loader2, Barcode, Flame, Wheat, Beef, Droplets, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveFoodEntry } from '@/lib/api/food-analysis';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onClose: () => void;
}

const BarcodeScanner = ({ onClose }: BarcodeScannerProps) => {
  const { videoRef, isScanning, error, startScanning, stopScanning, scanFrame } = useBarcodeScanner();
  const { user } = useAuth();
  const [isLooking, setIsLooking] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [servings, setServings] = useState(1);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  // Continuous scanning loop
  useEffect(() => {
    if (!isScanning || isLooking || product) return;

    let mounted = true;
    const scan = async () => {
      if (!mounted) return;
      const result = await scanFrame();
      if (result && mounted) {
        setScannedCode(result.rawValue);
        handleBarcodeScan(result.rawValue);
      } else if (mounted) {
        requestAnimationFrame(scan);
      }
    };
    requestAnimationFrame(scan);
    return () => { mounted = false; };
  }, [isScanning, isLooking, product, scanFrame]);

  const handleBarcodeScan = async (code: string) => {
    setIsLooking(true);
    try {
      const result = await lookupBarcode(code);
      setProduct(result);
    } catch (err) {
      console.error('Lookup error:', err);
      toast({ title: 'Not Found', description: 'Product not in database. Try scanning again.', variant: 'destructive' });
      setScannedCode(null);
    } finally {
      setIsLooking(false);
    }
  };

  const handleSave = async () => {
    if (!product || !user) return;

    try {
      const nutrition = {
        calories: product.nutrition.calories * servings,
        carbs: product.nutrition.carbs * servings,
        protein: product.nutrition.protein * servings,
        fats: product.nutrition.fats * servings
      };

      await saveFoodEntry(user.id, {
        foodName: product.name,
        mealType: 'snack',
        items: [{ name: product.name, calories: nutrition.calories, position: { x: 50, y: 50 } }],
        totalNutrition: nutrition,
        healthScore: product.nutriscore ? 10 - 'abcde'.indexOf(product.nutriscore) * 2 : 5,
        servingSize: product.servingSize
      }, product.image || undefined);

      toast({ title: 'Logged!', description: `${product.name} - ${nutrition.calories} calories` });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save food entry', variant: 'destructive' });
    }
  };

  const handleRescan = () => {
    setProduct(null);
    setScannedCode(null);
    setServings(1);
  };

  const adjustedNutrition = product ? {
    calories: Math.round(product.nutrition.calories * servings),
    carbs: Math.round(product.nutrition.carbs * servings),
    protein: Math.round(product.nutrition.protein * servings),
    fats: Math.round(product.nutrition.fats * servings)
  } : null;

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
        <div className="flex items-center gap-2 text-white">
          <Barcode className="w-5 h-5" />
          <span className="font-medium">Barcode Scanner</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanning Frame */}
        {!product && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-white/60 rounded-xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
              
              {/* Scan line animation */}
              {isScanning && !isLooking && (
                <div className="absolute left-2 right-2 h-0.5 bg-primary animate-pulse" style={{ top: '50%' }} />
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center px-8">
              <Barcode className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLooking && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">Looking up product...</p>
              <p className="text-white/60 text-sm">{scannedCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Result Sheet */}
      {product && adjustedNutrition && (
        <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl safe-area-bottom animate-slide-up">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3" />
          
          <div className="px-6 pt-4 pb-6">
            {/* Product Info */}
            <div className="flex items-start gap-4 mb-4">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase">{product.brand}</p>
                <h2 className="text-lg font-bold text-foreground leading-tight">{product.name}</h2>
                <p className="text-sm text-muted-foreground">{product.servingSize}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-6 text-center font-semibold">{servings}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setServings(servings + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Nutri-Score */}
            {product.nutriscore && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Nutri-Score:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-white uppercase ${
                  product.nutriscore === 'a' ? 'bg-green-500' :
                  product.nutriscore === 'b' ? 'bg-lime-500' :
                  product.nutriscore === 'c' ? 'bg-yellow-500' :
                  product.nutriscore === 'd' ? 'bg-orange-500' : 'bg-red-500'
                }`}>
                  {product.nutriscore}
                </span>
              </div>
            )}

            {/* Nutrition Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500 mb-1" />
                <p className="text-lg font-bold">{adjustedNutrition.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-xl">
                <Wheat className="w-5 h-5 text-amber-600 mb-1" />
                <p className="text-lg font-bold">{adjustedNutrition.carbs}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-xl">
                <Beef className="w-5 h-5 text-red-500 mb-1" />
                <p className="text-lg font-bold">{adjustedNutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="flex flex-col items-center p-2 bg-secondary/50 rounded-xl">
                <Droplets className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-lg font-bold">{adjustedNutrition.fats}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleRescan}>
                Scan Again
              </Button>
              <Button className="flex-1 h-12 rounded-xl" onClick={handleSave}>
                Log Food
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!product && !error && (
        <div className="absolute bottom-8 left-0 right-0 text-center safe-area-bottom">
          <p className="text-white/80 text-sm">Point camera at barcode</p>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
