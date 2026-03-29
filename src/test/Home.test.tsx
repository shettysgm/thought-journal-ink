import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';

// Mock all child components to isolate Home layout tests
vi.mock('@/components/MobileIntroOverlay', () => ({ default: () => null }));
vi.mock('@/components/StreakReminder', () => ({ default: () => <div data-testid="streak-reminder" /> }));
vi.mock('@/components/DailyPrompt', () => ({ default: () => <div data-testid="daily-prompt" /> }));
vi.mock('@/components/HeroStats', () => ({ default: () => <div data-testid="hero-stats" /> }));
vi.mock('@/components/DailyChallenge', () => ({ default: () => <div data-testid="daily-challenges" /> }));
vi.mock('@/components/NotificationBanner', () => ({ default: () => <div data-testid="notification-banner" /> }));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home Page', () => {
  it('renders the app title', () => {
    renderHome();
    expect(screen.getByText('Journal Inc')).toBeInTheDocument();
  });

  it('renders the CTA button', () => {
    renderHome();
    expect(screen.getByText('Write or record')).toBeInTheDocument();
  });

  it('has a link to settings', () => {
    renderHome();
    const settingsLink = document.querySelector('a[href="/settings"]');
    expect(settingsLink).toBeTruthy();
  });

  it('renders all key sections', () => {
    renderHome();
    expect(screen.getByTestId('daily-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('hero-stats')).toBeInTheDocument();
    expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
    expect(screen.getByTestId('daily-challenges')).toBeInTheDocument();
  });

  it('has a link to /unified for writing', () => {
    renderHome();
    const writeLink = screen.getByText('Write or record').closest('a') 
      || screen.getByText('Write or record').closest('button')?.closest('a');
    expect(writeLink).toHaveAttribute('href', '/unified');
  });
});
