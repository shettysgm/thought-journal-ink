import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';

describe('Settings page has bottom navigation', () => {
  it('shows BottomNav on /settings route', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <MobileLayout>
          <div>Settings Content</div>
        </MobileLayout>
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Breathe')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('hides BottomNav on /privacy route', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <MobileLayout>
          <div>Privacy Content</div>
        </MobileLayout>
      </MemoryRouter>
    );
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('shows BottomNav on all main routes', () => {
    const routes = ['/', '/text', '/journal', '/quiz', '/settings'];
    for (const route of routes) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[route]}>
          <MobileLayout>
            <div>Page</div>
          </MobileLayout>
        </MemoryRouter>
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      unmount();
    }
  });
});
