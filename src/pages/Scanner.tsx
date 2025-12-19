import { useState } from 'react';
import { Home, BarChart3, Scan, User, Camera, Barcode, Image, BookOpen, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Scanner = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('scan');

  const tabs = [
    { id: 'scan', icon: Camera, label: 'Scan Food' },
    { id: 'barcode', icon: Barcode, label: 'Barcode' },
    { id: 'label', icon: Image, label: 'Food Label' },
    { id: 'library', icon: BookOpen, label: 'Library' },
  ];

  return (
    <div className="min-h-screen bg-foreground flex flex-col safe-area-top safe-area-bottom">
      <div className="flex items-center justify-between px-4 py-4">
        <Button variant="ghost" size="icon" className="text-primary-foreground">
          <span className="sr-only">Close</span>×
        </Button>
        <div className="flex items-center gap-2 text-primary-foreground">
          <span className="text-lg">🔥</span>
          <span className="font-bold">Cal AI</span>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground">?</Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-48">
        <div className="w-72 h-72 border-2 border-dashed border-primary-foreground/30 rounded-3xl flex items-center justify-center">
          <div className="text-center text-primary-foreground/60">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <p>Point camera at food</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-32 left-0 right-0 px-6">
        <div className="bg-card rounded-full p-1 flex justify-around">
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

      <div className="absolute bottom-44 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <Zap className="w-6 h-6" />
          </Button>
          <button className="w-16 h-16 rounded-full bg-primary-foreground flex items-center justify-center shadow-elevated">
            <div className="w-14 h-14 rounded-full border-2 border-foreground" />
          </button>
          <div className="w-10" />
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

export default Scanner;
