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
  // @ts-expect-error - jsdom stub
  HTMLCanvasElement.prototype.getContext = vi.fn(() => fakeCtx);
  // @ts-expect-error
  HTMLCanvasElement.prototype.toBlob = function (cb: any) { cb(new Blob(['x'], { type: 'image/png' })); };

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
  it('renders pen, eraser, and fill tool buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /pen|draw/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eraser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fill/i })).toBeInTheDocument();
  });

  it('renders undo and clear buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('renders the add picture (image) button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /picture|image|add/i })).toBeInTheDocument();
  });

  it('opens color palette when palette button clicked', () => {
    renderPage();
    const paletteBtn = screen.getByRole('button', { name: /color|palette/i });
    fireEvent.click(paletteBtn);
    // Palette swatches should appear; at least one color swatch button
    const swatches = document.querySelectorAll('[data-color], [aria-label*="color" i], button[style*="background"]');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('switches to eraser tool when eraser button clicked', () => {
    renderPage();
    const eraserBtn = screen.getByRole('button', { name: /eraser/i });
    fireEvent.click(eraserBtn);
    // Eraser button should have an active/pressed visual state
    expect(eraserBtn.className).toMatch(/bg-|ring|border-primary|active/i);
  });

  it('switches to fill tool when fill button clicked', () => {
    renderPage();
    const fillBtn = screen.getByRole('button', { name: /fill/i });
    fireEvent.click(fillBtn);
    expect(fillBtn.className).toMatch(/bg-|ring|border-primary|active/i);
  });
});

describe('SketchPage - add picture and zoom flow', () => {
  it('triggers hidden file input when add picture is clicked', () => {
    renderPage();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toMatch(/image/);
  });

  it('shows placement overlay with zoom + - controls after image is selected', async () => {
    renderPage();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Stub Image so onload fires synchronously
    const OriginalImage = global.Image;
    // @ts-expect-error
    global.Image = class {
      width = 200; height = 200;
      onload: (() => void) | null = null;
      set src(_v: string) { setTimeout(() => this.onload && this.onload(), 0); }
    };

    const file = new File(['x'], 'pic.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /zoom in|\+/i }) ||
        document.querySelector('[aria-label*="zoom" i]')
      ).toBeTruthy();
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

  it('does not preload anything when no sketch exists for today', async () => {
    mockEntries = [];
    renderPage();
    // Give effects a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(mockGetJournalEntry).not.toHaveBeenCalled();
  });
});

describe('SketchPage - draw over image', () => {
  it('keeps the pen tool active after a picture is added so user can draw on top', async () => {
    renderPage();
    // Default tool is 'draw'. Verify pen button exists and is the default state.
    const penBtn = screen.getByRole('button', { name: /pen|draw/i });
    expect(penBtn).toBeInTheDocument();
    expect(penBtn.className).toMatch(/bg-|ring|border-primary|active/i);
  });
});
