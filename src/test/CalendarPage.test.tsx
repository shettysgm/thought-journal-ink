import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarPage from '@/pages/CalendarPage';

// Mock store state
const mockStore: any = {
  entries: [],
  loading: false,
  loadEntries: vi.fn().mockResolvedValue(undefined),
  deleteEntry: vi.fn().mockResolvedValue(undefined),
  updateEntry: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store/useEntries', () => {
  const fn: any = vi.fn(() => mockStore);
  fn.getState = () => mockStore;
  return { useEntries: fn };
});

vi.mock('@/lib/idb', () => ({
  getAllEntries: vi.fn().mockResolvedValue([]),
  saveEntry: vi.fn().mockResolvedValue(undefined),
  deleteEntryFromIDB: vi.fn().mockResolvedValue(undefined),
  getEntry: vi.fn().mockResolvedValue(null),
  getJournalEntry: vi.fn().mockResolvedValue(null),
  getAllDistortions: vi.fn().mockResolvedValue([]),
  saveDistortionMeta: vi.fn().mockResolvedValue(undefined),
  getDistortionsByDateRange: vi.fn().mockResolvedValue([]),
  getDistortionsByType: vi.fn().mockResolvedValue([]),
  saveBannerBlobs: vi.fn().mockResolvedValue(undefined),
  getBannerBlobs: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/pendingSave', () => ({
  awaitPendingSave: vi.fn().mockResolvedValue(undefined),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const baseEntry = {
  id: 'entry-1',
  createdAt: new Date().toISOString(),
  text: 'Today was a good day',
  tags: ['unified'],
  hasAudio: false,
  hasDrawing: false,
};

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/calendar']}>
      <CalendarPage />
    </MemoryRouter>
  );
}

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStore.entries = [];
    mockStore.loading = false;
  });

  it('renders empty state when no entries', () => {
    renderCalendar();
    expect(screen.getByText('No Entries Yet')).toBeInTheDocument();
  });

  it('renders entry text in a card', async () => {
    mockStore.entries = [baseEntry];
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Today was a good day')).toBeInTheDocument();
    });
  });

  it('renders text content inside entry card', async () => {
    mockStore.entries = [baseEntry];
    renderCalendar();
    await waitFor(() => {
      const textEl = screen.getByText('Today was a good day');
      // Text should be inside a card structure
      expect(textEl.closest('[class*="rounded"]')).toBeInTheDocument();
    });
  });

  it('shows welcome notice on first visit', () => {
    mockStore.entries = [baseEntry];
    renderCalendar();
    expect(screen.getByText(/Deleting or reinstalling the app/)).toBeInTheDocument();
  });

  it('hides welcome notice after dismissal', () => {
    localStorage.setItem('calendar_welcome_dismissed', 'true');
    mockStore.entries = [baseEntry];
    renderCalendar();
    expect(screen.queryByText(/Deleting or reinstalling the app/)).not.toBeInTheDocument();
  });

  it('renders template header when entry has templateId', async () => {
    mockStore.entries = [{
      ...baseEntry,
      templateId: 'gratitude',
      headerColor: 'hsl(160 50% 94%)',
      headerPattern: 'dots',
    }];
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Gratitude')).toBeInTheDocument();
    });
  });

  it('entry card is clickable', async () => {
    mockStore.entries = [baseEntry];
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Today was a good day')).toBeInTheDocument();
    });
    const card = screen.getByText('Today was a good day').closest('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();
  });

  it('truncates long entries with Show more button', async () => {
    mockStore.entries = [{ ...baseEntry, text: 'A'.repeat(350) }];
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockStore.loading = true;
    renderCalendar();
    expect(screen.getByText('Loading entries...')).toBeInTheDocument();
  });
});
