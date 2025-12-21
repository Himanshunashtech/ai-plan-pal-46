import { useState, useEffect } from 'react';
import { X, Share2, Award, Link2, MessageCircle, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, BADGE_COLORS } from '@/lib/badges';
import { toast } from 'sonner';

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
    <div className="relative w-48 h-56 mx-auto animate-scale-in">
      {/* Shield shape */}
      <svg viewBox="0 0 200 240" className="w-full h-full">
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
        </defs>
        {/* Outer border */}
        <path
          d="M100 10 L180 50 L180 140 C180 180 140 220 100 230 C60 220 20 180 20 140 L20 50 Z"
          fill="url(#shieldBorder)"
        />
        {/* Inner shield */}
        <path
          d="M100 20 L170 55 L170 140 C170 175 135 210 100 220 C65 210 30 175 30 140 L30 55 Z"
          fill="url(#shieldGradient)"
        />
      </svg>
      
      {/* Badge number */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
          <span className="text-white text-xl font-bold">1</span>
        </div>
      </div>
      
      {/* Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4">
        <span className="text-6xl filter drop-shadow-lg">{badge.icon}</span>
      </div>
      
      {/* Apple logo placeholder */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <span className="text-2xl opacity-70">🍎</span>
      </div>
    </div>
  );
};

export function BadgeCelebration({ badge, onClose, onViewAll }: BadgeCelebrationProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    // Auto-close after 10 seconds if user doesn't interact
    const timer = setTimeout(() => {
      // Don't auto-close, let user dismiss
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async (platform: string) => {
    const shareText = `🎉 I just earned the "${badge.name}" badge on Cal AI! ${badge.description}`;
    const shareUrl = window.location.origin;

    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          toast.success('Link copied to clipboard!');
        } catch {
          toast.error('Failed to copy link');
        }
        break;
      case 'instagram':
        // Instagram doesn't have direct share API, suggest screenshot
        toast.info('Take a screenshot to share on Instagram!');
        break;
      case 'messages':
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${badge.name} Badge`,
              text: shareText,
              url: shareUrl,
            });
          } catch {
            // User cancelled or error
          }
        } else {
          window.open(`sms:?body=${encodeURIComponent(shareText + '\n' + shareUrl)}`);
        }
        break;
      case 'other':
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${badge.name} Badge`,
              text: shareText,
              url: shareUrl,
            });
          } catch {
            // User cancelled or error
          }
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />
      
      {/* Confetti */}
      <Confetti />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-12 left-6 z-10 p-3 rounded-full bg-gray-500/50 text-white"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-md">
        {/* Badge Shield */}
        <BadgeShield badge={badge} />

        {/* Text content */}
        <div className="text-center mt-6 mb-8">
          <p className="text-gray-500 text-lg mb-2">Badge Unlocked</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{badge.name}</h1>
          <p className="text-gray-500 text-lg">{badge.description}</p>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <Button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="w-full h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-medium"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Your Badge
          </Button>

          {showShareOptions && (
            <div className="bg-white rounded-2xl p-4 shadow-lg animate-fade-in">
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleShare('instagram')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">Instagram</span>
                </button>
                <button
                  onClick={() => handleShare('messages')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">Messages</span>
                </button>
                <button
                  onClick={() => handleShare('other')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center">
                    <Share2 className="w-7 h-7 text-gray-700" />
                  </div>
                  <span className="text-xs text-gray-600">Other</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center">
                    <Link2 className="w-7 h-7 text-gray-700" />
                  </div>
                  <span className="text-xs text-gray-600">Copy</span>
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={onViewAll}
            variant="outline"
            className="w-full h-14 rounded-full border-2 border-gray-300 text-gray-700 text-lg font-medium"
          >
            <Award className="w-5 h-5 mr-2" />
            View All Badges
          </Button>
        </div>

        {/* Turn off celebrations */}
        <button
          onClick={onClose}
          className="mt-6 text-gray-400 text-sm"
        >
          Turn Off Badge Celebrations
        </button>
      </div>

      {/* Add confetti animation keyframes */}
      <style>{`
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
      `}</style>
    </div>
  );
}
