import { useRef, useState, useEffect } from 'react';
import { X, Share2, Award, Link2, MessageCircle, Instagram, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, BADGE_COLORS } from '@/lib/badges';
import { toast } from 'sonner';
import { captureAndShareImage } from '@/lib/shareUtils';
import { useTranslation } from 'react-i18next';

interface BadgeCelebrationProps {
  badge: Badge;
  onClose: () => void;
  onViewAll?: () => void;
}

// Confetti particle component
const Confetti = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[confetti_3s_ease-out_forwards]"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div
            className="bg-white rounded-sm opacity-80"
            style={{
              width: p.size,
              height: p.size / 2,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Badge shield component
const BadgeShield = ({ badge }: { badge: Badge }) => {
  const colors = BADGE_COLORS[badge.category];

  return (
    <div className="relative w-48 h-56 mx-auto perspective-1000">
      <div className="w-full h-full relative preserve-3d animate-badge-3d">
        {/* Shadow layer for 3D depth */}
        <div className="absolute inset-0 translate-z-[-10px] blur-md opacity-20">
          <svg viewBox="0 0 200 240" className="w-full h-full fill-black">
            <path d="M100 10 L180 50 L180 140 C180 180 140 220 100 230 C60 220 20 180 20 140 L20 50 Z" />
          </svg>
        </div>

        {/* Shield shape */}
        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Metallic Border Gradient */}
            <linearGradient id="metallicBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#9ca3af" />
              <stop offset="50%" stopColor="#f3f4f6" />
              <stop offset="75%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>

            {/* Shine highlight */}
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer metallic border */}
          <path
            d="M100 10 L180 50 L180 140 C180 180 140 220 100 230 C60 220 20 180 20 140 L20 50 Z"
            fill="url(#metallicBorder)"
            className="animate-pulse-subtle"
          />

          {/* Inner shield */}
          <path
            d="M100 22 L168 56 L168 140 C168 172 134 206 100 216 C66 206 32 172 32 140 L32 56 Z"
            fill="url(#shieldGradient)"
          />

          {/* Animated Shine Overlay */}
          <path
            d="M100 22 L168 56 L168 140 C168 172 134 206 100 216 C66 206 32 172 32 140 L32 56 Z"
            fill="url(#shineGradient)"
            className="animate-shine"
          />
        </svg>

        {/* Badge content layers for 3D depth */}
        <div className="absolute inset-0 translate-z-[15px]">
          {/* Badge number */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center shadow-lg border-2 border-white/20">
              <span className="text-white text-xl font-bold">1</span>
            </div>
          </div>

          {/* Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4">
            <span className="text-6xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">{badge.icon}</span>
          </div>

          {/* Apple logo branded tag inside shield */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-30">
            <Apple className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export function BadgeCelebration({ badge, onClose, onViewAll }: BadgeCelebrationProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const { t } = useTranslation();
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vibrate for 2 seconds when the celebration appears
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(500);
    }

    // Auto-close after 10 seconds if user doesn't interact
    const timer = setTimeout(() => {
      // Don't auto-close, let user dismiss
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async (platform: string) => {
    const shareText = t('share_badge_text', { badgeName: badge.name, badgeDescription: badge.description });
    const shareUrl = window.location.origin;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success(t('link_copied'));
      } catch {
        toast.error(t('copy_failed'));
      }
      return;
    }

    if (shareRef.current) {
      toast.loading(t('preparing_image'), { id: 'share-loading' });
      const success = await captureAndShareImage(
        shareRef.current,
        `${badge.name.replace(/\s+/g, '_')}_Badge`,
        shareText
      );
      toast.dismiss('share-loading');
      if (success) {
        setShowShareOptions(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />

      {/* Confetti */}
      <Confetti />



      <div className="relative z-10 flex flex-col items-center w-full max-w-md ">
        {/* Close Button - Positioned relative to the container for easy reachability */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shareable Area */}
        <div ref={shareRef} className="flex flex-col items-center px-6 py-8 w-full bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 rounded-3xl">
          {/* Badge Shield */}
          <BadgeShield badge={badge} />

          {/* Text content */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-lg mb-2">{t('badge_unlocked')}</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{badge.name}</h1>
            <p className="text-gray-500 text-lg">{badge.description}</p>
          </div>

          {/* Brand Tag for sharing */}
          <div className="mt-10 pt-4 border-t border-black/5 w-full flex items-center justify-center gap-2 opacity-40">
            <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
              <Apple className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold tracking-tighter uppercase text-gray-900">Calo AI</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <Button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="w-full h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-medium"
          >
            <Share2 className="w-5 h-5 mr-2" />
            {t('share_your_badge')}
          </Button>

          {showShareOptions && (
            <div className=" rounded-2xl p-4 shadow-lg animate-fade-in border border-orange-400/30">
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleShare('instagram')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-white">Instagram</span>
                </button>
                <button
                  onClick={() => handleShare('messages')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-white">Messages</span>
                </button>
                <button
                  onClick={() => handleShare('other')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-white">Other</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                    <Link2 className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-white">Copy</span>
                </button>
              </div>
            </div>
          )}


        </div>

        {/* Turn off celebrations */}
        {/* <button
          onClick={onClose}
          className="mt-6 text-gray-400 text-sm"
        >
          {t('turn_off_celebrations')}
        </button> */}
      </div>

      {/* Add confetti and 3D animations */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-[-10px] { transform: translateZ(-10px); }
        .translate-z-[15px] { transform: translateZ(15px); }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes badge-3d {
          0% { transform: rotateY(-15deg) rotateX(5deg); }
          50% { transform: rotateY(15deg) rotateX(-5deg); }
          100% { transform: rotateY(-15deg) rotateX(5deg); }
        }

        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        @keyframes flicker {
          0%, 100% { 
            transform: scaleY(1) translateY(0);
            opacity: 0.8;
          }
          50% { 
            transform: scaleY(1.2) translateY(-5px);
            opacity: 1;
          }
        }

        @keyframes flame-dance {
          0%, 100% { 
            d: path('M50,10 Q30,40 15,60 Q10,70 15,80 Q20,90 25,85 Q30,80 35,85 Q40,90 45,85 Q50,80 55,85 Q60,90 65,85 Q70,80 75,85 Q80,90 85,80 Q90,70 85,60 Q70,40 50,10');
          }
          50% { 
            d: path('M50,10 Q35,45 20,65 Q15,75 20,85 Q25,95 30,90 Q35,85 40,90 Q45,95 50,90 Q55,95 60,90 Q65,85 70,90 Q75,95 80,85 Q85,75 80,65 Q65,45 50,10');
          }
        }

        @keyframes fire {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-20px) translateX(10px);
            opacity: 0.3;
          }
        }

        @keyframes glow {
          0%, 100% { 
            background-position: 0% 50%;
          }
          50% { 
            background-position: 100% 50%;
          }
        }

        .animate-badge-3d {
          animation: badge-3d 6s ease-in-out infinite;
        }

        .animate-shine {
          animation: shine 3s linear infinite;
          transform-box: fill-box;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 4s ease-in-out infinite;
        }

        .animate-fire {
          animation: fire 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-flame-dance {
          animation: flame-dance 2s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
