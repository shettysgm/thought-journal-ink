import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

function renderWithRouter(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders all four navigation items', () => {
    renderWithRouter();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Breathe')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('highlights the active tab based on current route', () => {
    renderWithRouter('/quiz');
    const quizLink = screen.getByText('Quiz').closest('a');
    expect(quizLink).toHaveClass('text-primary');

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('text-muted-foreground');
  });

  it('links to correct paths', () => {
    renderWithRouter();
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Breathe').closest('a')).toHaveAttribute('href', '/breathe');
    expect(screen.getByText('Journal').closest('a')).toHaveAttribute('href', '/journal');
    expect(screen.getByText('Quiz').closest('a')).toHaveAttribute('href', '/quiz');
  });

  it('shows Home as active on root path', () => {
    renderWithRouter('/');
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('text-primary');
  });
});
