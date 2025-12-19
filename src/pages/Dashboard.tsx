import { Home, BarChart3, Scan, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NutritionRing from '@/components/ui/NutritionRing';

const Dashboard = () => {
  const location = useLocation();
  const days = ['S', 'S', 'M', 'T', 'W', 'T', 'F'];
  const dates = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-lg">Cal AI</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1">
            <span className="text-accent">🔥</span>
            <span className="font-semibold">0</span>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          {days.map((day, i) => (
            <div key={i} className={`flex flex-col items-center ${i === 5 ? '' : ''}`}>
              <span className="text-xs text-muted-foreground mb-1">{day}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === 5 ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}>
                {dates[i]}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-soft mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">1000</p>
              <p className="text-muted-foreground">Calories left</p>
            </div>
            <NutritionRing value={1000} max={2000} color="calories" size={80} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={100} max={150} color="protein" size={50} />
            <p className="font-bold mt-2">100g</p>
            <p className="text-xs text-muted-foreground">Protein left</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={99} max={200} color="carbs" size={50} />
            <p className="font-bold mt-2">99g</p>
            <p className="text-xs text-muted-foreground">Carbs left</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-soft text-center">
            <NutritionRing value={25} max={60} color="fats" size={50} />
            <p className="font-bold mt-2">25g</p>
            <p className="text-xs text-muted-foreground">Fat left</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Recently logged</h3>
          <div className="bg-card rounded-2xl p-6 shadow-soft text-center">
            <p className="text-muted-foreground">You haven't uploaded any food</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking today's meals by taking a quick picture.
            </p>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
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

export default Dashboard;
