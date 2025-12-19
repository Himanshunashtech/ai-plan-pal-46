import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-top safe-area-bottom">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-elevated">
            <Flame className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-accent-foreground">AI</span>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Cal AI
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Smart Calorie Tracking
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default Splash;
