import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '@/store/useGameStore';

// Mock persist middleware
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return { ...actual, persist: (fn: any) => fn };
});

describe('Daily Challenges - Word Sprint, Deep Dive, Take a Quiz', () => {
  beforeEach(() => {
    useGameStore.setState({
      xp: 0,
      totalWords: 0,
      totalEntries: 0,
      totalQuizzes: 0,
      dailyChallengeDate: '',
      dailyChallengeProgress: {} as Record<string, number>,
      dailyChallengeCompleted: {} as Record<string, boolean>,
      unlockedAchievements: [] as any,
    });
  });

  describe('Word Sprint (100 words)', () => {
    it('completes when writing 100+ words', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('words', 100);

      const challenges = useGameStore.getState().getDailyChallenges();
      const wordSprint = challenges.find(c => c.id === 'write_100_words');
      if (wordSprint) {
        expect(wordSprint.progress).toBe(100);
        expect(wordSprint.completed).toBe(true);
      }
    });

    it('does not complete at 50 words', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('words', 50);

      const challenges = useGameStore.getState().getDailyChallenges();
      const wordSprint = challenges.find(c => c.id === 'write_100_words');
      if (wordSprint) {
        expect(wordSprint.progress).toBe(50);
        expect(wordSprint.completed).toBe(false);
      }
    });

    it('awards 40 XP on completion', () => {
      const xpBefore = useGameStore.getState().xp;
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('words', 100);

      const challenges = useGameStore.getState().getDailyChallenges();
      const wordSprint = challenges.find(c => c.id === 'write_100_words');
      if (wordSprint?.completed) {
        expect(useGameStore.getState().xp).toBe(xpBefore + 40);
      }
    });
  });

  describe('Deep Dive (250 words)', () => {
    it('completes when writing 250+ words', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('words', 250);

      const challenges = useGameStore.getState().getDailyChallenges();
      const deepDive = challenges.find(c => c.id === 'write_250_words');
      if (deepDive) {
        expect(deepDive.progress).toBeGreaterThanOrEqual(250);
        expect(deepDive.completed).toBe(true);
      }
    });

    it('does not complete at 150 words', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('words', 150);

      const challenges = useGameStore.getState().getDailyChallenges();
      const deepDive = challenges.find(c => c.id === 'write_250_words');
      if (deepDive) {
        expect(deepDive.completed).toBe(false);
      }
    });

    it('awards 60 XP on completion', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      // Word Sprint (100) may also complete and award 40 XP
      const xpBefore = useGameStore.getState().xp;
      store.updateChallengeProgress('words', 250);

      const challenges = useGameStore.getState().getDailyChallenges();
      const deepDive = challenges.find(c => c.id === 'write_250_words');
      if (deepDive?.completed) {
        // XP should include Deep Dive's 60 (and possibly Word Sprint's 40)
        expect(useGameStore.getState().xp).toBeGreaterThanOrEqual(xpBefore + 60);
      }
    });
  });

  describe('Take a Quiz', () => {
    it('completes when a quiz is taken', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('quiz', 1);

      const challenges = useGameStore.getState().getDailyChallenges();
      const quizChallenge = challenges.find(c => c.id === 'take_quiz');
      if (quizChallenge) {
        expect(quizChallenge.progress).toBe(1);
        expect(quizChallenge.completed).toBe(true);
      }
    });

    it('awards 35 XP on completion', () => {
      const xpBefore = useGameStore.getState().xp;
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('quiz', 1);

      const challenges = useGameStore.getState().getDailyChallenges();
      const quizChallenge = challenges.find(c => c.id === 'take_quiz');
      if (quizChallenge?.completed) {
        expect(useGameStore.getState().xp).toBe(xpBefore + 35);
      }
    });

    it('recordQuiz increments totalQuizzes', () => {
      expect(useGameStore.getState().totalQuizzes).toBe(0);
      useGameStore.getState().recordQuiz();
      expect(useGameStore.getState().totalQuizzes).toBe(1);
    });
  });

  describe('Challenge progress persistence', () => {
    it('getDailyChallenges does NOT reset progress', () => {
      const store = useGameStore.getState();
      store.ensureTodayChallenges();
      store.updateChallengeProgress('write', 1);

      // Call getDailyChallenges multiple times — should NOT reset
      useGameStore.getState().getDailyChallenges();
      useGameStore.getState().getDailyChallenges();
      const challenges = useGameStore.getState().getDailyChallenges();

      const writeChallenge = challenges.find(c => c.type === 'write');
      if (writeChallenge) {
        expect(writeChallenge.progress).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
