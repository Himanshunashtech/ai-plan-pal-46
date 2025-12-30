import { useState, useMemo } from 'react';
import { ArrowLeft, Share2, Flame, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBadges } from '@/hooks/useBadges';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge, BADGE_COLORS } from '@/lib/badges';
import { StreakShareSheet } from '@/components/badges/StreakShareSheet';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { MilestonesSkeleton } from '@/components/skeletons';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/* ----------------------------------
 * Badge Icon
 * ---------------------------------- */
const BadgeIcon = ({
  badge,
  unlocked,
}: {
  badge: Badge & { unlocked: boolean };
  unlocked: boolean;
}) => {
  const colors = BADGE_COLORS[badge.category];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${unlocked
          ? `bg-gradient-to-b ${colors.gradient}`
          : 'bg-gray-200'
          }`}
      >
        <span className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {badge.icon}
        </span>

        {badge.category === 'streak' && (
          <div
            className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold ${unlocked
              ? 'bg-orange-600 text-white'
              : 'bg-gray-400 text-white'
              }`}
          >
            {badge.requirement}
          </div>
        )}
      </div>

      <p
        className={`text-xs font-medium mt-2 text-center ${unlocked ? 'text-foreground' : 'text-muted-foreground'
          }`}
      >
        {unlocked ? badge.name : '???'}
      </p>

      <p className="text-[10px] text-muted-foreground text-center line-clamp-2 max-w-[80px]">
        {unlocked ? badge.description : '???'}
      </p>
    </div>
  );
};

/* ----------------------------------
 * Milestones Screen
 * ---------------------------------- */
const Milestones = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const badges = useBadges();
  const notifications = useNotifications();

  const {
    getAllBadgesWithStatus,
    badgeCount,
    totalBadges,
    loading: badgesLoading,
  } = badges;

  const { streak, loading: streakLoading } = notifications;

  const [showStreakShare, setShowStreakShare] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activeTab, setActiveTab] = useState<'streak' | 'badges'>('streak');

  /* ----------------------------------
   * Memoized Badges
   * ---------------------------------- */
  const allBadges = useMemo(
    () => getAllBadgesWithStatus(),
    [getAllBadgesWithStatus]
  );

  const categories = useMemo(() => {
    return [
      { id: 'streak', title: t('streak_badges'), data: allBadges.filter(b => b.category === 'streak') },
      { id: 'meals', title: t('meal_logging'), data: allBadges.filter(b => b.category === 'meals') },
      { id: 'goals', title: t('calorie_goals'), data: allBadges.filter(b => b.category === 'goals') },
      { id: 'social', title: t('social'), data: allBadges.filter(b => b.category === 'social') },
      { id: 'water', title: t('hydration'), data: allBadges.filter(b => b.category === 'water') },
      { id: 'special', title: t('special'), data: allBadges.filter(b => b.category === 'special') },
    ];
  }, [allBadges, t]);

  /* ----------------------------------
   * Page UI
   * ---------------------------------- */
  const isSyncing = badgesLoading || streakLoading;

  /* ----------------------------------
   * New User Detection
   * ---------------------------------- */
  const isNewUser =
    badgeCount === 0 && (streak?.current_streak ?? 0) === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-semibold">{t('milestones')}</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await Promise.all([
                    badges.refetch(),
                    notifications.refetch(),
                  ]);
                  toast.success(t('sync_success'));
                }}
                disabled={isSyncing}
              >
                <Award className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStreakShare(true)}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-auto pb-24">
        {badges.error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs">
            <p className="font-semibold">Sync Error:</p>
            <p>{badges.error}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${activeTab === 'streak'
              ? 'bg-orange-100 border-2 border-orange-300'
              : 'bg-card border-2 border-transparent'
              }`}
          >
            <div className="relative">
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="absolute -top-1 -right-2 text-xs font-bold px-1.5 rounded-full bg-orange-500 text-white">
                {streak?.current_streak ?? 0}
              </span>
            </div>
            <span className="text-sm font-medium text-orange-600">
              {t('day_streak')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${activeTab === 'badges'
              ? 'bg-purple-100 border-2 border-purple-300'
              : 'bg-card border-2 border-transparent'
              }`}
          >
            <div className="relative">
              <Award className="w-8 h-8 text-purple-500" />
              <span className="absolute -top-1 -right-2 text-xs font-bold px-1.5 rounded-full bg-purple-500 text-white">
                {badgeCount}
              </span>
            </div>
            <span className="text-sm font-medium text-purple-600">
              {t('badges_earned')}
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div
            className={`rounded-2xl p-4 border transition-all ${activeTab === 'streak' ? 'bg-orange-50 border-orange-200' : 'bg-card'}`}
            onClick={() => setActiveTab('streak')}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">{streak?.current_streak ?? 0} {t('days')}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">{t('current_streak_label')}</p>
          </div>

          <div
            className={`rounded-2xl p-4 border transition-all ${activeTab === 'badges' ? 'bg-purple-50 border-purple-200' : 'bg-card'}`}
            onClick={() => setActiveTab('badges')}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold">{badgeCount}/{totalBadges}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">{t('badges_earned_label')}</p>
          </div>
        </div>

        {/* EMPTY STATE - Show subtle hint if new user */}
        {isNewUser && (
          <div className="bg-secondary/30 rounded-2xl p-6 text-center mb-8 border border-dashed border-border/60">
            <Flame className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold mb-1">
              {t('start_journey')}
            </h2>
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto mb-4">
              {t('start_journey_desc')}
            </p>
            <Button size="sm" onClick={() => navigate('/scanner')}>
              {t('log_first_meal')}
            </Button>
          </div>
        )}

        {/* BADGES GRID - Always Visible */}
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">
                  {category.title}
                </h2>
                <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                  {category.data.filter(b => b.unlocked).length} / {category.data.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-y-10 gap-x-4">
                {category.data.map(badge => (
                  <button
                    key={badge.id}
                    onClick={() => badge.unlocked && setSelectedBadge(badge)}
                    className="transition-transform active:scale-95 text-left"
                  >
                    <BadgeIcon
                      badge={badge}
                      unlocked={badge.unlocked}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sheets */}
      <StreakShareSheet
        isOpen={showStreakShare}
        onClose={() => setShowStreakShare(false)}
      />

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
