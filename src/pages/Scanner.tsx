import { useState } from 'react';
import { Home, BarChart3, Scan, User, Camera, Barcode, Image, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import FoodScanner from '@/components/scanner/FoodScanner';
import { FoodAnalysisResult, saveFoodEntry, uploadFoodImage } from '@/lib/api/food-analysis';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Scanner = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('scan');
  const [showCamera, setShowCamera] = useState(true);

  const tabs = [
    { id: 'scan', icon: Camera, label: 'Scan Food' },
    { id: 'barcode', icon: Barcode, label: 'Barcode' },
    { id: 'label', icon: Image, label: 'Food Label' },
    { id: 'library', icon: BookOpen, label: 'Library' },
  ];

  const handleFoodLogged = async (result: FoodAnalysisResult, imageBase64: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in to save food entries', variant: 'destructive' });
      return;
    }

    try {
      // Upload image to storage
      const imageUrl = await uploadFoodImage(user.id, imageBase64);
      
      // Save food entry to database
      await saveFoodEntry(user.id, result, imageUrl);
      
      toast({ title: 'Success!', description: `${result.foodName} logged - ${result.totalNutrition.calories} calories` });
    } catch (error) {
      console.error('Error saving food:', error);
      toast({ title: 'Error', description: 'Failed to save food entry', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col safe-area-top safe-area-bottom">
      {showCamera && (
        <FoodScanner
          onClose={() => setShowCamera(false)}
          onFoodLogged={handleFoodLogged}
        />
      )}

      {!showCamera && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-48">
            <div className="text-center text-white/60">
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <p>Tap the button below to scan food</p>
              <button 
                onClick={() => setShowCamera(true)}
                className="mt-6 px-6 py-3 bg-white text-black rounded-full font-medium"
              >
                Open Camera
              </button>
            </div>
          </div>

          <div className="absolute bottom-32 left-0 right-0 px-6">
            <div className="bg-white rounded-full p-1 flex justify-around">
              {tabs.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activeTab === id ? 'bg-secondary' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {activeTab === id && <span className="text-sm font-medium">{label}</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
    </div>
  );
};

export default Scanner;
