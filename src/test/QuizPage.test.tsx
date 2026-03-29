import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QuizPage from '@/pages/QuizPage';

const mockQuestions = [
  {
    id: 'q1',
    phrase: 'I always mess things up',
    correctAnswer: 'All-or-Nothing Thinking',
    options: ['All-or-Nothing Thinking', 'Mind Reading', 'Catastrophizing', 'Labeling'],
    explanation: 'Using "always" is absolute thinking.',
  },
  {
    id: 'q2',
    phrase: 'She probably thinks I am stupid',
    correctAnswer: 'Mind Reading',
    options: ['Catastrophizing', 'Mind Reading', 'Labeling', 'Fortune Telling'],
    explanation: 'Assuming what others think without evidence.',
  },
];

// Mock useDistortions
vi.mock('@/store/useDistortions', () => ({
  useDistortions: () => ({
    loadDistortions: vi.fn().mockResolvedValue(undefined),
    generateQuizQuestions: vi.fn(() => mockQuestions),
  }),
}));

// Mock useGameStore
vi.mock('@/store/useGameStore', () => ({
  useGameStore: Object.assign(
    () => ({}),
    { getState: () => ({ recordQuiz: vi.fn() }) }
  ),
}));

function renderQuiz() {
  return render(
    <MemoryRouter>
      <QuizPage />
    </MemoryRouter>
  );
}

describe('QuizPage', () => {
  it('renders quiz title', () => {
    renderQuiz();
    expect(screen.getByText('CBT Quiz')).toBeInTheDocument();
  });

  it('shows the first question after loading', async () => {
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText(/I always mess things up/i)).toBeInTheDocument();
    });
  });

  it('displays answer options', async () => {
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText('All-or-Nothing Thinking')).toBeInTheDocument();
    });
    expect(screen.getByText('Mind Reading')).toBeInTheDocument();
    expect(screen.getByText('Catastrophizing')).toBeInTheDocument();
  });

  it('allows selecting an answer', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText('All-or-Nothing Thinking')).toBeInTheDocument();
    });
    const option = screen.getByText('All-or-Nothing Thinking');
    await user.click(option);
    expect(option.closest('button') || option.closest('[role="option"]')).toBeTruthy();
  });
});
