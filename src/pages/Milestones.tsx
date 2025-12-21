import { useState } from 'react';
import { ArrowLeft, Share2, Flame, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBadges } from '@/hooks/useBadges';
import { useNotifications } from '@/hooks/useNotifications';
import { BADGES, Badge, BADGE_COLORS, getBadgesByCategory } from '@/lib/badges';
import { StreakShareSheet } from '@/components/badges/StreakShareSheet';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';

const BadgeIcon = ({ badge, unlocked }: { badge: Badge & { unlocked: boolean }; unlocked: boolean }) => {
  const colors = BADGE_COLORS[badge.category];
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${
          unlocked 
            ? `bg-gradient-to-b ${colors.gradient}` 
            : 'bg-gray-200'
        }`}
      >
        <span className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {badge.icon}
        </span>
        {badge.category === 'streak' && (
          <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            unlocked ? 'bg-orange-600 text-white' : 'bg-gray-400 text-white'
          }`}>
            {badge.requirement}
          </div>
        )}
      </div>
      <p className={`text-xs font-medium mt-2 text-center ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {badge.name}
      </p>
      <p className="text-[10px] text-muted-foreground text-center line-clamp-2 max-w-[80px]">
        {badge.description}
      </p>
    </div>
  );
};

const Milestones = () => {
  const navigate = useNavigate();
  const { getAllBadgesWithStatus, badgeCount, totalBadges } = useBadges();
  const { streak } = useNotifications();
  const [showStreakShare, setShowStreakShare] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activeTab, setActiveTab] = useState<'streak' | 'badges'>('streak');

  const allBadges = getAllBadgesWithStatus();
  
  const streakBadges = allBadges.filter(b => b.category === 'streak');
  const mealBadges = allBadges.filter(b => b.category === 'meals');
  const goalBadges = allBadges.filter(b => b.category === 'goals');
  const socialBadges = allBadges.filter(b => b.category === 'social');
  const waterBadges = allBadges.filter(b => b.category === 'water');
  const specialBadges = allBadges.filter(b => b.category === 'special');

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Milestones</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStreakShare(true)}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 overflow-auto pb-24">
        {/* Tab switcher */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
              activeTab === 'streak' 
                ? 'bg-orange-100 border-2 border-orange-300' 
                : 'bg-card border-2 border-transparent'
            }`}
          >
            <div className="relative">
              <Flame className={`w-8 h-8 ${activeTab === 'streak' ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className={`absolute -top-1 -right-2 text-xs font-bold px-1.5 rounded-full ${
                activeTab === 'streak' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {streak?.current_streak || 0}
              </span>
            </div>
            <span className={`text-sm font-medium ${activeTab === 'streak' ? 'text-orange-600' : 'text-muted-foreground'}`}>
              Day streak
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
              activeTab === 'badges' 
                ? 'bg-purple-100 border-2 border-purple-300' 
                : 'bg-card border-2 border-transparent'
            }`}
          >
            <div className="relative">
              <Award className={`w-8 h-8 ${activeTab === 'badges' ? 'text-purple-500' : 'text-muted-foreground'}`} />
              <span className={`absolute -top-1 -right-2 text-xs font-bold px-1.5 rounded-full ${
                activeTab === 'badges' ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {badgeCount}
              </span>
            </div>
            <span className={`text-sm font-medium ${activeTab === 'badges' ? 'text-purple-600' : 'text-muted-foreground'}`}>
              Badges earned
            </span>
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card rounded-2xl p-4 border">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">{streak?.current_streak || 0} days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">longest streak</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">{badgeCount}/{totalBadges} Badge</span>
            </div>
          </div>
        </div>

        {/* Badges grid by category */}
        <div className="space-y-8">
          {/* Streak Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {streakBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>

          {/* Meal Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {mealBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>

          {/* Goal Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {goalBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>

          {/* Social Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {socialBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>

          {/* Water Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {waterBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>

          {/* Special Badges */}
          <div>
            <div className="grid grid-cols-3 gap-4">
              {specialBadges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => badge.unlocked && setSelectedBadge(badge)}
                  className="transition-transform active:scale-95"
                >
                  <BadgeIcon badge={badge} unlocked={badge.unlocked} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Share Sheet */}
      <StreakShareSheet 
        isOpen={showStreakShare} 
        onClose={() => setShowStreakShare(false)} 
      />

      {/* Badge Celebration when tapping earned badge */}
      {selectedBadge && (
        <BadgeCelebration
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          onViewAll={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default Milestones;
