import { Home, BarChart3, Scan, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Progress = () => {
  const location = useLocation();
  const tabs = ['90 Days', '6 Months', '1 Year', 'All time'];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Goal Progress</h1>
          <span className="text-sm text-success font-medium">80% Goal achieved</span>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab, i) => (
            <button key={tab} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6">
          <div className="h-48 flex items-end justify-between gap-1">
            {[65, 64, 66, 68, 70, 69, 67].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-success/20 rounded-t" style={{ height: `${(val - 60) * 10}px` }}>
                  <div className="w-full h-full bg-success rounded-t" />
                </div>
                <span className="text-xs text-muted-foreground mt-2">
                  {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-success text-sm mb-8">
          Great job! Consistency is key, and you're mastering it!
        </p>

        <div>
          <h3 className="font-semibold mb-4">Nutritions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <p className="text-sm text-muted-foreground">Total calories</p>
              <p className="text-2xl font-bold">12780</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-soft">
              <p className="text-sm text-muted-foreground">Daily avg.</p>
              <p className="text-2xl font-bold">1952</p>
            </div>
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

export default Progress;
