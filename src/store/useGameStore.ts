import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackEvent } from '@/lib/analytics';

// === LEVEL SYSTEM ===
const LEVELS = [
  { level: 1, title: 'Novice Thinker', xpRequired: 0 },
  { level: 2, title: 'Thought Explorer', xpRequired: 100 },
  { level: 3, title: 'Pattern Spotter', xpRequired: 300 },
  { level: 4, title: 'Mindful Writer', xpRequired: 600 },
  { level: 5, title: 'Clarity Seeker', xpRequired: 1000 },
  { level: 6, title: 'Insight Hunter', xpRequired: 1500 },
  { level: 7, title: 'Thought Architect', xpRequired: 2200 },
  { level: 8, title: 'Mind Strategist', xpRequired: 3000 },
  { level: 9, title: 'Cognitive Champion', xpRequired: 4000 },
  { level: 10, title: 'Mind Master', xpRequired: 5500 },
];

// === ACHIEVEMENTS ===
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: string; // human-readable
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_entry', title: 'First Steps', description: 'Write your first journal entry', icon: '✏️', condition: 'entries >= 1' },
  { id: 'streak_3', title: 'Getting Started', description: 'Reach a 3-day streak', icon: '🔥', condition: 'streak >= 3' },
  { id: 'streak_7', title: 'Week Warrior', description: 'Reach a 7-day streak', icon: '⚡', condition: 'streak >= 7' },
  { id: 'streak_14', title: 'Fortnight Force', description: 'Reach a 14-day streak', icon: '💪', condition: 'streak >= 14' },
  { id: 'streak_21', title: 'Habit Formed', description: 'Complete 21-day habit journey', icon: '🏆', condition: 'streak >= 21' },
  { id: 'entries_5', title: 'Dedicated', description: 'Write 5 journal entries', icon: '📝', condition: 'entries >= 5' },
  { id: 'entries_10', title: 'Consistent', description: 'Write 10 journal entries', icon: '📚', condition: 'entries >= 10' },
  { id: 'entries_25', title: 'Prolific', description: 'Write 25 journal entries', icon: '🎯', condition: 'entries >= 25' },
  { id: 'entries_50', title: 'Veteran', description: 'Write 50 journal entries', icon: '⭐', condition: 'entries >= 50' },
  { id: 'quiz_first', title: 'Quiz Taker', description: 'Complete your first CBT quiz', icon: '🧠', condition: 'quizzes >= 1' },
  { id: 'quiz_5', title: 'Knowledge Seeker', description: 'Complete 5 CBT quizzes', icon: '🎓', condition: 'quizzes >= 5' },
  { id: 'words_1000', title: 'Wordsmith', description: 'Write 1,000 total words', icon: '✨', condition: 'words >= 1000' },
  { id: 'words_5000', title: 'Author', description: 'Write 5,000 total words', icon: '📖', condition: 'words >= 5000' },
  { id: 'level_5', title: 'Rising Star', description: 'Reach Level 5', icon: '🌟', condition: 'level >= 5' },
  { id: 'level_10', title: 'Legendary', description: 'Reach Level 10', icon: '👑', condition: 'level >= 10' },
];

// === DAILY CHALLENGES ===
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'write' | 'words' | 'prompt' | 'quiz';
  target: number;
  progress: number;
  completed: boolean;
}

const CHALLENGE_POOL: Omit<DailyChallenge, 'progress' | 'completed'>[] = [
  { id: 'write_entry', title: 'Daily Journal', description: 'Write a journal entry today', xpReward: 25, type: 'write', target: 1 },
  { id: 'write_100_words', title: 'Word Sprint', description: 'Write at least 100 words', xpReward: 40, type: 'words', target: 100 },
  { id: 'write_250_words', title: 'Deep Dive', description: 'Write at least 250 words', xpReward: 60, type: 'words', target: 250 },
  { id: 'use_prompt', title: 'Prompt Explorer', description: 'Use the daily prompt', xpReward: 30, type: 'prompt', target: 1 },
  { id: 'take_quiz', title: 'Take a Quiz', description: 'Complete a CBT quiz', xpReward: 35, type: 'quiz', target: 1 },
];

function getDailyChallenges(dateStr: string): Omit<DailyChallenge, 'progress' | 'completed'>[] {
  // Deterministic selection based on date
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const ha = ((hash + a.id.length) * 31) % 100;
    const hb = ((hash + b.id.length) * 31) % 100;
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const xpInLevel = xp - current.xpRequired;
  const xpForNext = next ? next.xpRequired - current.xpRequired : 0;
  const progress = next ? xpInLevel / xpForNext : 1;
  return { ...current, next, xpInLevel, xpForNext, progress };
}

interface GameState {
  xp: number;
  totalWords: number;
  totalEntries: number;
  totalQuizzes: number;
  unlockedAchievements: Record<string, string>; // id -> unlockedAt
  dailyChallengeDate: string;
  dailyChallengeProgress: Record<string, number>;
  dailyChallengeCompleted: Record<string, boolean>;

  // Computed
  getLevelInfo: () => ReturnType<typeof getLevelInfo>;
  getAchievements: () => Achievement[];
  getDailyChallenges: () => DailyChallenge[];
  ensureTodayChallenges: () => void;

  // Actions
  addXP: (amount: number) => void;
  recordEntry: (wordCount: number) => void;
  recordQuiz: () => void;
  recordPromptUsed: () => void;
  checkAchievements: (streak: number) => string[];
  updateChallengeProgress: (type: DailyChallenge['type'], amount: number) => void;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      xp: 0,
      totalWords: 0,
      totalEntries: 0,
      totalQuizzes: 0,
      unlockedAchievements: {},
      dailyChallengeDate: '',
      dailyChallengeProgress: {},
      dailyChallengeCompleted: {},

      getLevelInfo: () => getLevelInfo(get().xp),

      getAchievements: () => {
        const unlocked = get().unlockedAchievements;
        return ACHIEVEMENT_DEFS.map((a) => ({
          ...a,
          unlockedAt: unlocked[a.id],
        }));
      },

      getDailyChallenges: () => {
        const today = todayStr();
        const state = get();
        const progress = state.dailyChallengeDate === today ? state.dailyChallengeProgress : {};
        const completed = state.dailyChallengeDate === today ? state.dailyChallengeCompleted : {};
        const challenges = getDailyChallenges(today);
        return challenges.map((c) => ({
          ...c,
          progress: progress[c.id] || 0,
          completed: completed[c.id] || false,
        }));
      },

      ensureTodayChallenges: () => {
        const today = todayStr();
        if (get().dailyChallengeDate !== today) {
          set({
            dailyChallengeDate: today,
            dailyChallengeProgress: {},
            dailyChallengeCompleted: {},
          });
        }
      },

      addXP: (amount) => set((s) => ({ xp: s.xp + amount })),

      recordEntry: (wordCount) => {
        const state = get();
        const prevLevel = getLevelInfo(state.xp).level;
        const newWords = state.totalWords + wordCount;
        const newEntries = state.totalEntries + 1;
        const baseXP = 20; // per entry
        const wordXP = Math.floor(wordCount / 10); // 1 XP per 10 words
        const newXp = state.xp + baseXP + wordXP;
        set({
          totalWords: newWords,
          totalEntries: newEntries,
          xp: newXp,
        });
        get().updateChallengeProgress('write', 1);
        get().updateChallengeProgress('words', wordCount);
        trackEvent('journal_entry_saved', {
          word_count: wordCount,
          total_entries: newEntries,
        });
        const newLevel = getLevelInfo(newXp).level;
        if (newLevel > prevLevel) {
          trackEvent('level_up', { level: newLevel });
        }
      },

      recordQuiz: () => {
        const state = get();
        const prevLevel = getLevelInfo(state.xp).level;
        const newXp = state.xp + 30;
        set({
          totalQuizzes: state.totalQuizzes + 1,
          xp: newXp,
        });
        get().updateChallengeProgress('quiz', 1);
        trackEvent('quiz_completed', { total_quizzes: state.totalQuizzes + 1 });
        const newLevel = getLevelInfo(newXp).level;
        if (newLevel > prevLevel) {
          trackEvent('level_up', { level: newLevel });
        }
      },

      recordPromptUsed: () => {
        set((s) => ({ xp: s.xp + 10 }));
        get().updateChallengeProgress('prompt', 1);
        trackEvent('prompt_used', {});
      },

      checkAchievements: (streak) => {
        const state = get();
        const level = getLevelInfo(state.xp).level;
        const newlyUnlocked: string[] = [];
        const checks: Record<string, boolean> = {
          first_entry: state.totalEntries >= 1,
          streak_3: streak >= 3,
          streak_7: streak >= 7,
          streak_14: streak >= 14,
          streak_21: streak >= 21,
          entries_5: state.totalEntries >= 5,
          entries_10: state.totalEntries >= 10,
          entries_25: state.totalEntries >= 25,
          entries_50: state.totalEntries >= 50,
          quiz_first: state.totalQuizzes >= 1,
          quiz_5: state.totalQuizzes >= 5,
          words_1000: state.totalWords >= 1000,
          words_5000: state.totalWords >= 5000,
          level_5: level >= 5,
          level_10: level >= 10,
        };

        const unlocked = { ...state.unlockedAchievements };
        for (const [id, met] of Object.entries(checks)) {
          if (met && !unlocked[id]) {
            unlocked[id] = new Date().toISOString();
            newlyUnlocked.push(id);
          }
        }
        if (newlyUnlocked.length > 0) {
          set({ unlockedAchievements: unlocked });
        }
        return newlyUnlocked;
      },

      updateChallengeProgress: (type, amount) => {
        const today = todayStr();
        get().ensureTodayChallenges();

        const challenges = getDailyChallenges(today);
        const progress = { ...get().dailyChallengeProgress };
        const completed = { ...get().dailyChallengeCompleted };
        let xpToAdd = 0;

        for (const c of challenges) {
          if (c.type === type && !completed[c.id]) {
            progress[c.id] = (progress[c.id] || 0) + amount;
            console.log(`[Challenge] ${c.id}: ${progress[c.id]}/${c.target}`);
            if (progress[c.id] >= c.target) {
              completed[c.id] = true;
              xpToAdd += c.xpReward;
              console.log(`[Challenge] ${c.id} COMPLETED! +${c.xpReward}XP`);
            }
          }
        }
        set((s) => ({
          dailyChallengeProgress: progress,
          dailyChallengeCompleted: completed,
          xp: s.xp + xpToAdd,
        }));
      },
    }),
    { name: 'journal-game-store' }
  )
);
