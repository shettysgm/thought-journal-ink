import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock IDB operations
const mockSaveJournalEntry = vi.fn().mockResolvedValue(undefined);
const mockGetJournalEntry = vi.fn().mockResolvedValue(null);
const mockGetAllJournalEntries = vi.fn().mockResolvedValue([]);
const mockDeleteJournalEntry = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  saveJournalEntry: (...args: any[]) => mockSaveJournalEntry(...args),
  getJournalEntry: (...args: any[]) => mockGetJournalEntry(...args),
  getAllJournalEntries: () => mockGetAllJournalEntries(),
  deleteJournalEntry: (...args: any[]) => mockDeleteJournalEntry(...args),
  getSettings: vi.fn().mockResolvedValue({
    encryptionEnabled: false,
    autoDetectDistortions: false,
    aiAnalysisEnabled: false,
    appLockEnabled: false,
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/autoBackup', () => ({
  scheduleAutoBackup: vi.fn(),
  restoreFromAutoBackup: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/crypto', () => ({
  encryptText: vi.fn((text: string) => Promise.resolve(`enc:${text}`)),
  decryptText: vi.fn((text: string) => Promise.resolve(text.replace('enc:', ''))),
  hashPassphrase: vi.fn().mockResolvedValue('hash'),
}));

// Mock useGameStore to prevent side effects
vi.mock('@/store/useGameStore', () => ({
  useGameStore: Object.assign(
    () => ({}),
    { getState: () => ({ recordEntry: vi.fn(), updateChallengeProgress: vi.fn() }) }
  ),
}));

// Mock hybridDetection
vi.mock('@/lib/hybridDetection', () => ({
  analyzeEntryWithContext: vi.fn().mockResolvedValue({ hits: [], reframes: [] }),
}));

// Mock useDistortions
vi.mock('@/store/useDistortions', () => ({
  useDistortions: Object.assign(
    () => ({}),
    { getState: () => ({ addDistortion: vi.fn() }) }
  ),
}));

import { useEntries } from '@/store/useEntries';

describe('Text Journaling - Entry CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllJournalEntries.mockResolvedValue([]);
    // Reset store state
    useEntries.setState({ entries: [], loading: false, error: null });
  });

  it('creates a new entry and adds it to state', async () => {
    const id = await useEntries.getState().createEntry({
      text: 'My first journal entry',
      tags: ['unified'],
    });

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
    expect(mockSaveJournalEntry).toHaveBeenCalledTimes(1);
    
    const savedEntry = mockSaveJournalEntry.mock.calls[0][0];
    expect(savedEntry.text).toBe('My first journal entry');
    expect(savedEntry.tags).toContain('unified');

    // Entry should be in state
    const entries = useEntries.getState().entries;
    expect(entries.length).toBe(1);
    expect(entries[0].text).toBe('My first journal entry');
  });

  it('updates an existing entry', async () => {
    const existingEntry = {
      id: 'test-123',
      createdAt: new Date().toISOString(),
      text: 'Original text',
      tags: ['unified'],
    };
    mockGetJournalEntry.mockResolvedValueOnce(existingEntry);
    useEntries.setState({ entries: [existingEntry] });

    await useEntries.getState().updateEntry('test-123', { text: 'Updated text' });

    expect(mockSaveJournalEntry).toHaveBeenCalled();
    const saved = mockSaveJournalEntry.mock.calls[0][0];
    expect(saved.text).toBe('Updated text');
  });

  it('appends to an existing entry with timestamp divider', async () => {
    const existingEntry = {
      id: 'test-456',
      createdAt: new Date().toISOString(),
      text: 'Morning thoughts',
      tags: ['unified'],
    };
    mockGetJournalEntry.mockResolvedValueOnce(existingEntry);
    useEntries.setState({ entries: [existingEntry] });

    await useEntries.getState().appendToEntry('test-456', {
      text: 'Evening reflections',
    });

    expect(mockSaveJournalEntry).toHaveBeenCalled();
    const saved = mockSaveJournalEntry.mock.calls[0][0];
    expect(saved.text).toContain('Morning thoughts');
    expect(saved.text).toContain('Evening reflections');
    expect(saved.text).toContain('Added');
  });

  it('loads entries from IDB', async () => {
    mockGetAllJournalEntries.mockResolvedValueOnce([
      { id: 'e1', createdAt: '2026-03-29T10:00:00Z', text: 'Entry one' },
      { id: 'e2', createdAt: '2026-03-28T10:00:00Z', text: 'Entry two' },
    ]);

    await useEntries.getState().loadEntries();

    const entries = useEntries.getState().entries;
    expect(entries.length).toBe(2);
    // Should be sorted newest first
    expect(entries[0].id).toBe('e1');
  });

  it('deletes an entry', async () => {
    const entry = { id: 'del-1', createdAt: new Date().toISOString(), text: 'To delete' };
    useEntries.setState({ entries: [entry] });

    await useEntries.getState().deleteEntry('del-1');
    expect(mockDeleteJournalEntry).toHaveBeenCalledWith('del-1');
    expect(useEntries.getState().entries.length).toBe(0);
  });

  it('findTodaysEntries returns only today entries', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    useEntries.setState({
      entries: [
        { id: 'today-1', createdAt: today, text: 'Today' },
        { id: 'yesterday-1', createdAt: yesterday, text: 'Yesterday' },
      ],
    });

    const todaysEntries = useEntries.getState().findTodaysEntries();
    expect(todaysEntries.length).toBe(1);
    expect(todaysEntries[0].id).toBe('today-1');
  });

  it('handles empty text gracefully', async () => {
    const id = await useEntries.getState().createEntry({
      text: '',
      tags: ['unified'],
    });
    expect(id).toBeTruthy();
    expect(mockSaveJournalEntry).toHaveBeenCalled();
  });
});
