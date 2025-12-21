import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import alleAiLogo from '@/assets/alle-ai-logo.png';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center safe-area-top safe-area-bottom">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center">
            <img src={alleAiLogo} alt="Alle AI Logo" className="w-16 h-16 object-contain" />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Alle AI
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
