import { useState } from 'react';
import { Home, BarChart3, Scan, User, Camera, Barcode, Image, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FoodScanner from '@/components/scanner/FoodScanner';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import FoodLibrary from '@/components/scanner/FoodLibrary';
import { FoodAnalysisResult, saveFoodEntry, uploadFoodImage } from '@/lib/api/food-analysis';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { getBadgeById } from '@/lib/badges';
import { toast } from '@/hooks/use-toast';


import { useAppDispatch } from '@/store/hooks';
import { addFoodEntryOptimistic, rollbackFoodEntry } from '@/store/slices/statsSlice';
import { preprocessImage } from '@/lib/image-preprocessing';

type ScanMode = 'food' | 'barcode' | 'label' | 'library' | null;

const Scanner = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { earnBadge, hasBadge } = useBadges();
  const { t } = useTranslation();
  const [activeMode, setActiveMode] = useState<ScanMode>('food');
  const [earnedBadgeId, setEarnedBadgeId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const tabs = [
    { id: 'food' as const, icon: Camera, label: t('scan_food') },
    { id: 'barcode' as const, icon: Barcode, label: t('barcode') },
    { id: 'label' as const, icon: Image, label: t('food_label') },
    { id: 'library' as const, icon: BookOpen, label: t('library') },
  ];

  const handleFoodLogged = async (result: FoodAnalysisResult, imageBase64: string) => {
    if (!user) {
      toast({ title: t('error'), description: t('login_to_save'), variant: 'destructive' });
      return;
    }

    // 0. Compress Image (Optimize for storage and speed)
    // This reduces image size to ~50-100KB WebP
    let optimizedImage = imageBase64;
    try {
      optimizedImage = await preprocessImage(imageBase64);
    } catch (err) {
      console.error('Image compression failed, using original', err);
    }

    // 1. Optimistic Update (Instant Feedback)
    dispatch(addFoodEntryOptimistic({
      food: { name: result.foodName, ...result.totalNutrition }, // Simplified entry for immediate display
      calories: result.totalNutrition.calories,
      protein: result.totalNutrition.protein,
      carbs: result.totalNutrition.carbs,
      fats: result.totalNutrition.fats,
      imageUrl: optimizedImage
    }));
    toast({ title: 'Success!', description: `${result.foodName} logged - ${result.totalNutrition.calories} calories` });

    try {
      // 2. Network Request
      // Upload the OPTIMIZED image
      const imageUrl = await uploadFoodImage(user.id, optimizedImage);
      const { earnedBadgeIds } = await saveFoodEntry(user.id, result, imageUrl);

      // Check and award badges (meal + streak)
      for (const badgeId of earnedBadgeIds) {
        if (!hasBadge(badgeId)) {
          const awarded = await earnBadge(badgeId);
          if (awarded) {
            setEarnedBadgeId(badgeId);
            break; // Show one badge celebration at a time
          }
        }
      }
    } catch (error) {
      console.error('Error saving food:', error);
      toast({ title: 'Error', description: 'Failed to save food entry', variant: 'destructive' });

      // 3. Rollback on Failure
      dispatch(rollbackFoodEntry({
        calories: result.totalNutrition.calories,
        protein: result.totalNutrition.protein,
        carbs: result.totalNutrition.carbs,
        fats: result.totalNutrition.fats
      }));
    }
  };

  const handleTabChange = (id: ScanMode) => {
    setActiveMode(id);
  };

  return (
    <>
      <div className="min-h-screen bg-black flex flex-col relative">
        {/* Render active scanner */}
        {activeMode === 'food' && (
          <FoodScanner
            onClose={() => navigate('/dashboard')}
            onFoodLogged={handleFoodLogged}
            onSheetOpenChange={setIsSheetOpen}
          />
        )}

        {activeMode === 'barcode' && (
          <BarcodeScanner
            onClose={() => navigate('/dashboard')}
          />
        )}

        {activeMode === 'library' && (
          <FoodLibrary onClose={() => navigate('/dashboard')} />
        )}

        {/* Placeholder screen for label */}
        {activeMode === 'label' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="text-center text-white/60">
              <Image className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">{t('food_label')}</p>
              <p className="text-sm">{t('label_scanner_desc')}</p>
            </div>
          </div>
        )}

        {/* No active mode - show mode selector */}
        {activeMode === null && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-48">
            <div className="text-center text-white/60">
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <p>{t('select_mode')}</p>
            </div>
          </div>
        )}



        {/* Bottom Navigation - Hide when camera scanners are active */}
        {activeMode !== 'library' && !isSheetOpen && (
          <div className="absolute bottom-32 left-0 right-0 px-6 z-[60]">
            <div className="bg-white rounded-full p-1 flex justify-around shadow-lg">
              {tabs.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items - center gap - 2 px - 4 py - 2 rounded - full transition - all ${activeMode === id
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground'
                    } `}
                >
                  <Icon className="w-4 h-4" />
                  {activeMode === id && (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Badge Celebration */}
      {earnedBadgeId && getBadgeById(earnedBadgeId) && (
        <BadgeCelebration
          badge={getBadgeById(earnedBadgeId)!}
          onClose={() => setEarnedBadgeId(null)}
          onViewAll={() => {
            setEarnedBadgeId(null);
            navigate('/milestones');
          }}
        />
      )}
    </>
  );
};

export default Scanner;
