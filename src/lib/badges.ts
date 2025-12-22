export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'meals' | 'water' | 'goals' | 'social' | 'special';
  icon: string;
  requirement: number;
  unlocked?: boolean;
  earnedAt?: string;
}

export const BADGES: Badge[] = [
  // Streak badges
  { id: 'rookie', name: 'Rookie', description: '3 day streak', category: 'streak', icon: '🔥', requirement: 3 },
  { id: 'getting_serious', name: 'Getting Serious', description: '10 day streak', category: 'streak', icon: '🔥', requirement: 10 },
  { id: 'locked_in', name: 'Locked In', description: '50 day streak', category: 'streak', icon: '🔥', requirement: 50 },
  { id: 'triple_threat', name: 'Triple Threat', description: '100 day streak', category: 'streak', icon: '🔥', requirement: 100 },
  { id: 'no_days_off', name: 'No Days Off', description: '365 day streak', category: 'streak', icon: '🔥', requirement: 365 },
  { id: 'immortal', name: 'Immortal', description: '1000 day streak', category: 'streak', icon: '🔥', requirement: 1000 },

  // Meal logging badges
  { id: 'forking_around', name: 'Forking Around', description: 'Logged 5 meals', category: 'meals', icon: '🍴', requirement: 5 },
  { id: 'mission_nutrition', name: 'Mission: Nutrition', description: 'Logged 50 meals', category: 'meals', icon: '🥗', requirement: 50 },
  { id: 'the_logfather', name: 'The Logfather', description: 'Logged 500 meals', category: 'meals', icon: '👨‍🍳', requirement: 500 },

  // Calorie goal badges
  { id: 'one_hit_wonder', name: 'One Hit Wonder', description: 'Hit daily calorie goal once', category: 'goals', icon: '🎯', requirement: 1 },
  { id: 'loyalty_iii', name: 'Loyalty III', description: 'Hit calorie goal 7 days', category: 'goals', icon: '🏆', requirement: 7 },
  { id: 'bullseye', name: 'Bullseye', description: 'Hit calorie goal 30 days', category: 'goals', icon: '🎯', requirement: 30 },
  { id: 'macro_master', name: 'Macro Master', description: 'Hit all macro goals in a day', category: 'goals', icon: '💪', requirement: 1 },
  { id: 'protein_pro', name: 'Protein Pro', description: 'Hit protein goal 7 days', category: 'goals', icon: '🥩', requirement: 7 },
  { id: 'balanced_diet', name: 'Balanced Diet', description: 'Hit all goals 7 days', category: 'goals', icon: '⚖️', requirement: 7 },

  // Social badges
  { id: 'helping_hand', name: 'Helping Hand', description: 'Invited 1 friend', category: 'social', icon: '🤝', requirement: 1 },
  { id: 'peer_pressurer', name: 'Peer Pressurer', description: 'Invited 3 friends', category: 'social', icon: '👥', requirement: 3 },
  { id: 'cult_leader', name: 'Cult Leader', description: 'Invited 10 friends', category: 'social', icon: '👑', requirement: 10 },

  // Water badges
  { id: 'hydrated', name: 'Hydrated', description: 'Log water intake once', category: 'water', icon: '💧', requirement: 1 },
  { id: 'sippin', name: "Sippin'", description: 'Log water 3 days in a row', category: 'water', icon: '💧', requirement: 3 },
  { id: 'aquaholic', name: 'Aquaholic', description: 'Log water 10 days in a row', category: 'water', icon: '💧', requirement: 10 },

  // Special badges
  { id: 'clean_sweep', name: 'Clean Sweep', description: 'Log 3 meals in a day', category: 'special', icon: '🧹', requirement: 3 },
  { id: 'sweat_equity', name: 'Sweat Equity', description: 'Log 5 workouts', category: 'special', icon: '💪', requirement: 5 },
  { id: 'speed_logger', name: 'Speed Logger', description: 'Save 10 meals', category: 'special', icon: '⚡', requirement: 10 },
  { id: 'green_machine', name: 'Green Machine', description: 'Eat leafy greens 5 days', category: 'special', icon: '🥬', requirement: 5 },
  { id: 'nut_case', name: 'Nut Case', description: 'Eat nuts 4 days in a row', category: 'special', icon: '🥜', requirement: 4 },
  { id: 'berry_suspicious', name: 'Berry Suspicious', description: 'Eat berries 3 days in a row', category: 'special', icon: '🫐', requirement: 3 },
  { id: 'time_traveler', name: 'Time Traveler', description: 'Log something on all days', category: 'special', icon: '🦉', requirement: 7 },
  { id: 'gremlin', name: 'Gremlin', description: 'Log something after midnight', category: 'special', icon: '👾', requirement: 1 },
  { id: 'health_nut', name: 'Health Nut', description: 'Get a 10 health score avg', category: 'special', icon: '❤️', requirement: 10 },
];

export const getBadgeById = (id: string): Badge | undefined => {
  return BADGES.find(badge => badge.id === id);
};

export const getBadgesByCategory = (category: Badge['category']): Badge[] => {
  return BADGES.filter(badge => badge.category === category);
};

export const BADGE_COLORS = {
  streak: {
    gradient: 'from-orange-400 to-amber-500',
    bg: 'bg-gradient-to-b from-orange-400 to-amber-500',
    text: 'text-orange-500',
    light: 'bg-orange-100',
  },
  meals: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-gradient-to-b from-purple-400 to-purple-600',
    text: 'text-purple-500',
    light: 'bg-purple-100',
  },
  water: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-gradient-to-b from-blue-400 to-blue-600',
    text: 'text-blue-500',
    light: 'bg-blue-100',
  },
  goals: {
    gradient: 'from-green-400 to-green-600',
    bg: 'bg-gradient-to-b from-green-400 to-green-600',
    text: 'text-green-500',
    light: 'bg-green-100',
  },
  social: {
    gradient: 'from-pink-400 to-pink-600',
    bg: 'bg-gradient-to-b from-pink-400 to-pink-600',
    text: 'text-pink-500',
    light: 'bg-pink-100',
  },
  special: {
    gradient: 'from-gray-400 to-gray-600',
    bg: 'bg-gradient-to-b from-gray-400 to-gray-600',
    text: 'text-gray-500',
    light: 'bg-gray-100',
  },
};
