import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SketchPage from '@/pages/SketchPage';

// --- Mocks ---------------------------------------------------------------

vi.mock('@/lib/deviceDetection', () => ({
  isPhone: () => false,
}));

const mockCreateEntry = vi.fn().mockResolvedValue('new-entry-id');
const mockLoadEntries = vi.fn();
let mockEntries: any[] = [];

vi.mock('@/store/useEntries', () => ({
  useEntries: () => ({
    createEntry: mockCreateEntry,
    entries: mockEntries,
    loadEntries: mockLoadEntries,
  }),
}));

const mockSaveJournalEntry = vi.fn().mockResolvedValue(undefined);
const mockGetJournalEntry = vi.fn().mockResolvedValue(null);
vi.mock('@/lib/idb', () => ({
  saveJournalEntry: (...args: any[]) => mockSaveJournalEntry(...args),
  getJournalEntry: (...args: any[]) => mockGetJournalEntry(...args),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// --- Canvas + URL stubs (jsdom doesn't implement these) ------------------

beforeEach(() => {
  mockEntries = [];
  mockCreateEntry.mockClear();
  mockLoadEntries.mockClear();
  mockSaveJournalEntry.mockClear();
  mockGetJournalEntry.mockClear();
  mockToast.mockClear();

  const fakeCtx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    set lineCap(_v: any) {}, set lineJoin(_v: any) {}, set lineWidth(_v: any) {},
    set globalCompositeOperation(_v: any) {}, set strokeStyle(_v: any) {}, set fillStyle(_v: any) {}, set font(_v: any) {},
  };
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => fakeCtx);
  (HTMLCanvasElement.prototype as any).toBlob = function (cb: any) { cb(new Blob(['x'], { type: 'image/png' })); };

  if (!(global as any).URL.createObjectURL) {
    (global as any).URL.createObjectURL = vi.fn(() => 'blob:fake');
  }
  if (!(global as any).URL.revokeObjectURL) {
    (global as any).URL.revokeObjectURL = vi.fn();
  }
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sketch']}>
      <SketchPage />
    </MemoryRouter>
  );
}

// --- Tests --------------------------------------------------------------

describe('SketchPage - tools and controls', () => {
  it('renders eraser and fill tool buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /eraser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fill area with color/i })).toBeInTheDocument();
  });

  it('renders color picker and add picture buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /pick color/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add picture/i })).toBeInTheDocument();
  });

  it('renders undo and clear buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('renders all four stroke size buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /stroke size 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stroke size 4/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stroke size 8/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stroke size 14/i })).toBeInTheDocument();
  });

  it('renders Plain and Lined paper toggle', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /^plain$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^lined$/i })).toBeInTheDocument();
  });

  it('toggles paper style when Lined is clicked', () => {
    renderPage();
    const linedBtn = screen.getByRole('button', { name: /^lined$/i });
    fireEvent.click(linedBtn);
    expect(linedBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens color palette when picker is clicked', () => {
    renderPage();
    const picker = screen.getByRole('button', { name: 'Pick color' });
    fireEvent.click(picker);
    // Palette swatches use background-color inline styles
    const swatches = document.querySelectorAll('button[style*="background"]');
    // picker itself + at least 6 brand colors
    expect(swatches.length).toBeGreaterThanOrEqual(7);
  });

  it('activates eraser tool when eraser button clicked', () => {
    renderPage();
    const eraserBtn = screen.getByRole('button', { name: /eraser/i });
    fireEvent.click(eraserBtn);
    // After click, eraser gets primary border/background styling
    expect(eraserBtn.className).toMatch(/border-primary|bg-primary|primary/);
  });

  it('activates fill tool when fill button clicked', () => {
    renderPage();
    const fillBtn = screen.getByRole('button', { name: /fill area with color/i });
    fireEvent.click(fillBtn);
    expect(fillBtn.className).toMatch(/border-primary|bg-primary|primary/);
  });
});

describe('SketchPage - add picture (image) flow', () => {
  it('exposes a hidden file input that accepts images', () => {
    renderPage();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toMatch(/image/);
  });

  it('shows placement controls (zoom in / zoom out / confirm) after image is selected', async () => {
    renderPage();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const OriginalImage = global.Image;
    (global as any).Image = class {
      width = 200; height = 200;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) { setTimeout(() => this.onload && this.onload(), 0); }
    };

    const file = new File(['x'], 'pic.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await waitFor(() => {
      // Look for zoom or place/confirm controls in the placement overlay
      const zoomControls = document.querySelectorAll(
        '[aria-label*="zoom" i], [aria-label*="place" i], [aria-label*="cancel" i]'
      );
      expect(zoomControls.length).toBeGreaterThan(0);
    });

    global.Image = OriginalImage;
  });
});

describe('SketchPage - one sketch per day', () => {
  it('preloads existing sketch for today as base layer', async () => {
    const today = new Date().toISOString();
    mockEntries = [
      { id: 'today-sketch', templateId: 'sketch', createdAt: today, text: '' },
    ];
    mockGetJournalEntry.mockResolvedValueOnce({
      id: 'today-sketch',
      drawingBlob: new Blob(['x'], { type: 'image/png' }),
    });

    renderPage();

    await waitFor(() => {
      expect(mockGetJournalEntry).toHaveBeenCalledWith('today-sketch');
    });
  });

  it('does not preload when no sketch exists for today', async () => {
    mockEntries = [];
    renderPage();
    await new Promise((r) => setTimeout(r, 20));
    expect(mockGetJournalEntry).not.toHaveBeenCalled();
  });

  it('does not preload an old (non-today) sketch', async () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    mockEntries = [
      { id: 'old-sketch', templateId: 'sketch', createdAt: lastWeek, text: '' },
    ];
    renderPage();
    await new Promise((r) => setTimeout(r, 20));
    expect(mockGetJournalEntry).not.toHaveBeenCalled();
  });
});

describe('SketchPage - draw over image', () => {
  it('keeps drawing tools available so user can draw over a placed image', () => {
    renderPage();
    // Eraser, fill, and stroke sizes remain present and clickable
    expect(screen.getByRole('button', { name: /eraser/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /fill area with color/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /stroke size 4/i })).not.toBeDisabled();
  });
});
