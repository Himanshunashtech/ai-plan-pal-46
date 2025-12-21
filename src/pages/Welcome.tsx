import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import welcomeHero from '@/assets/welcome-hero.jpeg';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Language Selector */}
      <div className="flex justify-end px-6 pt-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card">
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm font-medium text-foreground">EN</span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="relative w-full max-w-[280px] mx-auto mb-12">
          {/* Phone Frame */}
          <div className="relative bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
            <div className="rounded-[2rem] overflow-hidden">
              <img 
                src={welcomeHero} 
                alt="App Preview" 
                className="w-full aspect-[9/16] object-cover"
              />
            </div>
            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-foreground rounded-full" />
          </div>
        </div>

        {/* Tagline */}
        <h1 className="text-3xl font-bold text-foreground text-center leading-tight">
          Calorie tracking<br />made easy
        </h1>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-8 space-y-4 animate-slide-up">
        <Button 
          size="lg" 
          className="w-full h-14 text-lg rounded-2xl"
          onClick={() => navigate('/onboarding')}
        >
          Get Started
        </Button>
        
        <p className="text-center text-muted-foreground">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/auth')}
            className="text-foreground font-semibold underline underline-offset-2"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Welcome;