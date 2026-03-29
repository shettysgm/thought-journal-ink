import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '@/store/useGameStore';

// Mock persist middleware to use plain store
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return {
    ...actual,
    persist: (fn: any) => fn,
  };
});

describe('useGameStore - Daily Challenges', () => {
  beforeEach(() => {
    // Reset store state
    const store = useGameStore.getState();
    useGameStore.setState({
      xp: 0,
      totalWords: 0,
      totalEntries: 0,
      totalQuizzes: 0,
      dailyChallengeDate: '',
      dailyChallengeProgress: {},
      dailyChallengeCompleted: {},
      unlockedAchievements: [],
    });
  });

  it('adds XP correctly', () => {
    useGameStore.getState().addXP(50);
    expect(useGameStore.getState().xp).toBe(50);
  });

  it('records entry with word count', () => {
    useGameStore.getState().recordEntry(100);
    expect(useGameStore.getState().totalEntries).toBe(1);
    expect(useGameStore.getState().totalWords).toBe(100);
  });

  it('records quiz completion', () => {
    useGameStore.getState().recordQuiz();
    expect(useGameStore.getState().totalQuizzes).toBe(1);
  });

  it('tracks challenge progress without resetting during reads', () => {
    const store = useGameStore.getState();
    // Ensure today's challenges are initialized
    store.ensureTodayChallenges();
    
    // Update progress
    store.updateChallengeProgress('write', 1);
    
    // Read challenges — should NOT reset progress
    const challenges = useGameStore.getState().getDailyChallenges();
    const writeChallenge = challenges.find(c => c.type === 'write');
    
    if (writeChallenge) {
      expect(writeChallenge.progress).toBeGreaterThanOrEqual(1);
    }
  });

  it('getLevelInfo returns valid level data', () => {
    useGameStore.getState().addXP(250);
    const info = useGameStore.getState().getLevelInfo();
    expect(info.current).toBeGreaterThanOrEqual(1);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });
});
