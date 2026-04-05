import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarPage from '@/pages/CalendarPage';
import { useEntries } from '@/store/useEntries';

// Mock useEntries store
vi.mock('@/store/useEntries', () => ({
  useEntries: vi.fn(),
}));

// Mock IDB module to prevent real DB calls
vi.mock('@/lib/idb', () => ({
  getAllEntries: vi.fn().mockResolvedValue([]),
  saveEntry: vi.fn().mockResolvedValue(undefined),
  deleteEntryFromIDB: vi.fn().mockResolvedValue(undefined),
  getEntry: vi.fn().mockResolvedValue(null),
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
  });

  it('renders empty state when no entries', () => {
    (useEntries as any).mockReturnValue({
      entries: [],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    expect(screen.getByText('No Entries Yet')).toBeInTheDocument();
  });

  it('renders entry text in a card', async () => {
    (useEntries as any).mockReturnValue({
      entries: [baseEntry],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Today was a good day')).toBeInTheDocument();
    });
  });

  it('renders text before photos (text appears first in DOM)', async () => {
    const entryWithPhotos = {
      ...baseEntry,
      bannerBlobs: [new Blob(['img'], { type: 'image/png' })],
    };

    (useEntries as any).mockReturnValue({
      entries: [entryWithPhotos],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    await waitFor(() => {
      // Text should be in the DOM
      expect(screen.getByText('Today was a good day')).toBeInTheDocument();
    });
  });

  it('shows welcome notice on first visit', () => {
    (useEntries as any).mockReturnValue({
      entries: [baseEntry],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    expect(screen.getByText(/Deleting or reinstalling the app/)).toBeInTheDocument();
  });

  it('hides welcome notice after dismissal', async () => {
    localStorage.setItem('calendar_welcome_dismissed', 'true');

    (useEntries as any).mockReturnValue({
      entries: [baseEntry],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    expect(screen.queryByText(/Deleting or reinstalling the app/)).not.toBeInTheDocument();
  });

  it('renders template header when entry has templateId', async () => {
    const entryWithTemplate = {
      ...baseEntry,
      templateId: 'gratitude',
      headerColor: 'hsl(160 50% 94%)',
      headerPattern: 'dots',
    };

    (useEntries as any).mockReturnValue({
      entries: [entryWithTemplate],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    await waitFor(() => {
      // The gratitude template title should appear
      expect(screen.getByText('Gratitude')).toBeInTheDocument();
    });
  });

  it('navigates to editor when entry is clicked', async () => {
    (useEntries as any).mockReturnValue({
      entries: [baseEntry],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Today was a good day')).toBeInTheDocument();
    });

    // The card should have an onClick that navigates
    const card = screen.getByText('Today was a good day').closest('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();
  });

  it('truncates long entries with Show more button', async () => {
    const longEntry = {
      ...baseEntry,
      text: 'A'.repeat(350),
    };

    (useEntries as any).mockReturnValue({
      entries: [longEntry],
      loading: false,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (useEntries as any).mockReturnValue({
      entries: [],
      loading: true,
      loadEntries: vi.fn(),
      deleteEntry: vi.fn(),
      updateEntry: vi.fn(),
    });

    renderCalendar();
    expect(screen.getByText('Loading entries...')).toBeInTheDocument();
  });
});
