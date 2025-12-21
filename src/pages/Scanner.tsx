import { useState } from 'react';
import { Home, BarChart3, Scan, User, Camera, Barcode, Image, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FoodScanner from '@/components/scanner/FoodScanner';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import FoodLibrary from '@/components/scanner/FoodLibrary';
import { FoodAnalysisResult, saveFoodEntry, uploadFoodImage } from '@/lib/api/food-analysis';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useBadges';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { getBadgeById } from '@/lib/badges';
import { toast } from '@/hooks/use-toast';

type ScanMode = 'food' | 'barcode' | 'label' | 'library' | null;

const Scanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { earnBadge, hasBadge } = useBadges();
  const [activeMode, setActiveMode] = useState<ScanMode>('food');
  const [earnedBadgeId, setEarnedBadgeId] = useState<string | null>(null);

  const tabs = [
    { id: 'food' as const, icon: Camera, label: 'Scan Food' },
    { id: 'barcode' as const, icon: Barcode, label: 'Barcode' },
    { id: 'label' as const, icon: Image, label: 'Food Label' },
    { id: 'library' as const, icon: BookOpen, label: 'Library' },
  ];

  const handleFoodLogged = async (result: FoodAnalysisResult, imageBase64: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in to save food entries', variant: 'destructive' });
      return;
    }

    try {
      const imageUrl = await uploadFoodImage(user.id, imageBase64);
      const { earnedBadgeId: badgeId } = await saveFoodEntry(user.id, result, imageUrl);
      toast({ title: 'Success!', description: `${result.foodName} logged - ${result.totalNutrition.calories} calories` });

      // Check and award meal badges
      if (badgeId && !hasBadge(badgeId)) {
        const awarded = await earnBadge(badgeId);
        if (awarded) {
          setEarnedBadgeId(badgeId);
        }
      }
    } catch (error) {
      console.error('Error saving food:', error);
      toast({ title: 'Error', description: 'Failed to save food entry', variant: 'destructive' });
    }
  };

  const handleTabChange = (id: ScanMode) => {
    setActiveMode(id);
  };

  return (
    <>
    <div className="min-h-screen bg-black flex flex-col safe-area-top safe-area-bottom">
      {/* Render active scanner */}
      {activeMode === 'food' && (
        <FoodScanner
          onClose={() => setActiveMode(null)}
          onFoodLogged={handleFoodLogged}
        />
      )}

      {activeMode === 'barcode' && (
        <BarcodeScanner
          onClose={() => setActiveMode(null)}
        />
      )}

      {activeMode === 'library' && (
        <FoodLibrary onClose={() => setActiveMode(null)} />
      )}

      {/* Placeholder screen for label */}
      {activeMode === 'label' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center text-white/60">
            <Image className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Food Label Scanner</p>
            <p className="text-sm">Scan nutrition labels for accurate data</p>
          </div>
        </div>
      )}

      {/* No active mode - show mode selector */}
      {activeMode === null && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-48">
          <div className="text-center text-white/60">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <p>Select a scanning mode below</p>
          </div>
        </div>
      )}

      {/* Mode Tabs - Only show when no active scanner */}
      {(activeMode === null || activeMode === 'label') && (
        <div className="absolute bottom-32 left-0 right-0 px-6">
          <div className="bg-white rounded-full p-1 flex justify-around">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  activeMode === id ? 'bg-secondary' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {activeMode === id && <span className="text-sm font-medium">{label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation - Hide when camera scanners are active */}
      {(activeMode === null || activeMode === 'label') && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
          <div className="flex justify-around py-3">
            {[
              { icon: Home, path: '/dashboard', label: 'Home' },
              { icon: BarChart3, path: '/progress', label: 'Analytics' },
              { icon: Scan, path: '/scanner', label: 'Scan' },
              { icon: User, path: '/profile', label: 'Settings' },
            ].map(({ icon: Icon, path, label }) => (
              <Link key={path} to={path} className={`flex flex-col items-center gap-1 px-4 ${
                location.pathname === path ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
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
