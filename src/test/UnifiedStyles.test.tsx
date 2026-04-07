import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import JournalPage from '@/pages/JournalPage';
import SettingsPage from '@/pages/SettingsPage';
import BreathePage from '@/pages/BreathePage';
import QuizPage from '@/pages/QuizPage';

// --- Mocks ---

vi.mock('@/components/MobileIntroOverlay', () => ({ default: () => null }));
vi.mock('@/components/StreakReminder', () => ({ default: () => null }));
vi.mock('@/components/DailyPrompt', () => ({ default: () => <div data-testid="daily-prompt" /> }));
vi.mock('@/components/HeroStats', () => ({ default: () => null }));
vi.mock('@/components/DailyChallenge', () => ({ default: () => null }));
vi.mock('@/components/NotificationBanner', () => ({ default: () => null }));
vi.mock('@/components/GroundingExercise', () => ({ default: () => null }));

vi.mock('@/store/useSettings', () => ({
  useSettings: () => ({
    encryptionEnabled: false,
    autoDetectDistortions: true,
    syncStatsEnabled: false,
    aiAnalysisEnabled: true,
    appLockEnabled: false,
    reminderTime: null,
    loading: false,
    loadSettings: vi.fn(),
    updateSettings: vi.fn(),
    setPassphrase: vi.fn(),
    setAppLock: vi.fn(),
    removeAppLock: vi.fn(),
  }),
}));

vi.mock('@/store/useEntries', () => ({
  useEntries: () => ({
    entries: [],
    loadEntries: vi.fn(),
  }),
}));

vi.mock('@/store/useDistortions', () => ({
  useDistortions: () => ({
    distortions: [],
    loadDistortions: vi.fn().mockResolvedValue(undefined),
    importDistortions: vi.fn(),
    generateQuizQuestions: vi.fn(() => [
      {
        id: 'q1',
        phrase: 'Test phrase',
        correctAnswer: 'Labeling',
        options: ['Labeling', 'Mind Reading'],
        explanation: 'Test',
      },
    ]),
  }),
}));

vi.mock('@/store/useGameStore', () => ({
  useGameStore: Object.assign(
    () => ({}),
    { getState: () => ({ recordQuiz: vi.fn() }) }
  ),
}));

vi.mock('@/lib/notifications', () => ({
  scheduleStreakReminder: vi.fn(),
  cancelStreakReminder: vi.fn(),
}));

vi.mock('@/lib/exportJournals', () => ({
  exportJournalsToFile: vi.fn(),
}));

function wrap(ui: React.ReactNode, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe('Unified page headers', () => {
  it('Home has header with title and subtitle', () => {
    wrap(<Home />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Journal Inc');
    expect(h1.closest('header')).toBeInTheDocument();
    expect(screen.getByText('Your daily companion')).toBeInTheDocument();
  });

  it('Journal has header with title and subtitle', () => {
    wrap(<JournalPage />, '/journal');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Journal');
    expect(h1.closest('header')).toBeInTheDocument();
    expect(screen.getByText('Pick a template to start')).toBeInTheDocument();
  });

  it('Settings has header with title and subtitle', () => {
    wrap(<SettingsPage />, '/settings');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Settings');
    expect(h1.closest('header')).toBeInTheDocument();
    expect(screen.getByText('Manage your privacy and preferences')).toBeInTheDocument();
  });

  it('Breathe has header with title and subtitle', () => {
    wrap(<BreathePage />, '/breathe');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Calm Toolkit');
    expect(h1.closest('header')).toBeInTheDocument();
    expect(screen.getByText('Breathing & grounding exercises')).toBeInTheDocument();
  });

  it('Quiz has header with title and subtitle', () => {
    wrap(<QuizPage />, '/quiz');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('CBT Quiz');
    expect(h1.closest('header')).toBeInTheDocument();
  });
});

describe('Unified card styles', () => {
  it('Journal template cards use bordered style', () => {
    wrap(<JournalPage />, '/journal');
    const card = screen.getByText('Daily Reflection').closest('div[class*="border-border"]');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain('rounded-2xl');
  });

  it('Journal cards have arrow icons', () => {
    wrap(<JournalPage />, '/journal');
    // Each template card should have an arrow SVG
    const arrows = document.querySelectorAll('svg.lucide-arrow-right');
    expect(arrows.length).toBe(6); // 6 templates
  });

  it('Journal cards have large icons (w-16 container)', () => {
    wrap(<JournalPage />, '/journal');
    const iconContainers = document.querySelectorAll('.w-16.h-16');
    expect(iconContainers.length).toBe(6);
  });

  it('Journal card titles use uppercase primary text', () => {
    wrap(<JournalPage />, '/journal');
    const title = screen.getByText('Daily Reflection');
    expect(title.className).toContain('uppercase');
    expect(title.className).toContain('text-primary');
  });

  it('Settings cards use bordered style instead of shadows', () => {
    wrap(<SettingsPage />, '/settings');
    const privacyCard = screen.getByText('Privacy & Security').closest('[class*="border-border"]');
    expect(privacyCard).toBeInTheDocument();
    expect(privacyCard?.className).toContain('rounded-2xl');
    expect(privacyCard?.className).not.toContain('shadow-medium');
  });

  it('Settings labels use text-sm sizing', () => {
    wrap(<SettingsPage />, '/settings');
    const label = screen.getByText('Encrypt journal entries');
    expect(label.className).toContain('text-sm');
  });
});

describe('Quiz text sizing', () => {
  it('quiz question phrase uses text-sm', async () => {
    wrap(<QuizPage />, '/quiz');
    const phrase = await screen.findByText(/Test phrase/);
    expect(phrase.className).toContain('text-sm');
  });
});
