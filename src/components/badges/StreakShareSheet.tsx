import { useState } from 'react';
import { Share2, X, Link2, MessageCircle, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useBadges, EarnedBadge } from '@/hooks/useBadges';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StreakShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreakShareSheet({ isOpen, onClose }: StreakShareSheetProps) {
  const { streak } = useNotifications();
  const { earnedBadges } = useBadges();

  if (!isOpen) return null;

  const handleShare = async (platform: string) => {
    const shareText = `🔥 I'm on a ${streak?.current_streak || 0} day streak on Cal AI! Keep logging to stay healthy.`;
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
        toast.info('Take a screenshot to share on Instagram!');
        break;
      case 'messages':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'My Cal AI Streak',
              text: shareText,
              url: shareUrl,
            });
          } catch {
            // User cancelled
          }
        } else {
          window.open(`sms:?body=${encodeURIComponent(shareText + '\n' + shareUrl)}`);
        }
        break;
      case 'other':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'My Cal AI Streak',
              text: shareText,
              url: shareUrl,
            });
          } catch {
            // User cancelled
          }
        }
        break;
    }
  };

  const startDate = streak?.last_log_date 
    ? format(new Date(), 'MMM d, yyyy')
    : format(new Date(), 'MMM d, yyyy');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Orange gradient header */}
        <div className="bg-gradient-to-b from-orange-400 via-orange-300 to-amber-200 px-6 pt-4 pb-8">
          {/* Handle bar */}
          <div className="w-12 h-1.5 bg-white/50 rounded-full mx-auto mb-8" />
          
          {/* Flame icon with streak */}
          <div className="flex flex-col items-center">
            {/* Sparkles */}
            <div className="relative">
              <span className="absolute -top-2 -left-8 text-yellow-300 text-xl">✦</span>
              <span className="absolute -top-4 left-4 text-yellow-300/60 text-sm">✦</span>
              <span className="absolute -top-2 right-0 text-yellow-300 text-lg">✦</span>
              
              {/* Flame SVG */}
              <svg 
                viewBox="0 0 100 120" 
                className="w-32 h-40"
              >
                <defs>
                  <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#fde047" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 10 C30 40 15 60 15 80 C15 100 30 115 50 115 C70 115 85 100 85 80 C85 60 70 40 50 10 Z"
                  fill="url(#flameGradient)"
                />
                {/* Inner flame */}
                <path
                  d="M50 50 C40 70 35 80 35 90 C35 100 42 105 50 105 C58 105 65 100 65 90 C65 80 60 70 50 50 Z"
                  fill="#fef3c7"
                  opacity="0.8"
                />
              </svg>
              
              {/* Streak number */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <span className="text-4xl font-bold text-orange-100/90">{streak?.current_streak || 0}</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-orange-600 mt-2">DAY STREAK</h2>
            <p className="text-orange-500/80 mt-1">Started on {startDate}</p>
          </div>
        </div>
        
        {/* Content area */}
        <div className="bg-amber-50 px-6 py-6">
          {/* Badges earned */}
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <h3 className="text-center font-semibold text-gray-700 mb-3">My Badges Earned</h3>
            <div className="flex justify-center gap-2 flex-wrap">
              {earnedBadges.length > 0 ? (
                earnedBadges.slice(0, 5).map((badge) => (
                  <div 
                    key={badge.id}
                    className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"
                    title={badge.name}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No badges yet</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Share options */}
        <div className="bg-gray-100 px-6 py-4 border-t">
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
              <span className="text-xs text-gray-600">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
