import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StreakTracker from '@/components/StreakTracker';

// Mock useEntries
const mockLoadEntries = vi.fn();
let mockEntries: { createdAt: string }[] = [];

vi.mock('@/store/useEntries', () => ({
  useEntries: () => ({
    entries: mockEntries,
    loadEntries: mockLoadEntries,
  }),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('StreakTracker', () => {
  beforeEach(() => {
    mockEntries = [];
    mockLoadEntries.mockReset();
  });

  it('renders streak, best, and 21-day labels', () => {
    render(<StreakTracker />);
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('21-Day')).toBeInTheDocument();
  });

  it('shows 0 streak when no entries exist', () => {
    render(<StreakTracker />);
    // Find the streak value (first "0" next to "Streak" label)
    const streakValues = screen.getAllByText('0');
    expect(streakValues.length).toBeGreaterThanOrEqual(1);
  });

  it('computes a 2-day streak from consecutive entries', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    mockEntries = [
      { createdAt: today.toISOString() },
      { createdAt: yesterday.toISOString() },
    ];

    render(<StreakTracker />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows 0% progress when streak is 0', () => {
    render(<StreakTracker />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calculates 21-day progress percentage', () => {
    const today = new Date();
    mockEntries = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      mockEntries.push({ createdAt: d.toISOString() });
    }

    render(<StreakTracker />);
    expect(screen.getByText('33%')).toBeInTheDocument(); // 7/21 ≈ 33%
  });

  it('calls loadEntries on mount', () => {
    render(<StreakTracker />);
    expect(mockLoadEntries).toHaveBeenCalled();
  });
});
