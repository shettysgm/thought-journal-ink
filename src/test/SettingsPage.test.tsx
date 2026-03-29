import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '@/pages/SettingsPage';

// Mock useSettings
const mockUpdateSettings = vi.fn();
const mockLoadSettings = vi.fn();

vi.mock('@/store/useSettings', () => ({
  useSettings: () => ({
    encryptionEnabled: false,
    autoDetectDistortions: true,
    syncStatsEnabled: false,
    aiAnalysisEnabled: true,
    appLockEnabled: false,
    reminderTime: null,
    loading: false,
    loadSettings: mockLoadSettings,
    updateSettings: mockUpdateSettings,
    setPassphrase: vi.fn(),
    setAppLock: vi.fn(),
    removeAppLock: vi.fn(),
  }),
}));

// Mock useEntries
vi.mock('@/store/useEntries', () => ({
  useEntries: () => ({
    entries: [],
    loadEntries: vi.fn(),
  }),
}));

// Mock useDistortions
vi.mock('@/store/useDistortions', () => ({
  useDistortions: () => ({
    distortions: [],
    loadDistortions: vi.fn(),
    importDistortions: vi.fn(),
  }),
}));

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  scheduleStreakReminder: vi.fn().mockResolvedValue(true),
  cancelStreakReminder: vi.fn().mockResolvedValue(undefined),
}));

// Mock exportJournals
vi.mock('@/lib/exportJournals', () => ({
  exportJournalsToFile: vi.fn().mockResolvedValue(undefined),
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockUpdateSettings.mockReset();
    mockLoadSettings.mockReset();
  });

  it('renders the Settings heading', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Privacy & Security section', () => {
    renderSettings();
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
  });

  it('renders encryption toggle', () => {
    renderSettings();
    expect(screen.getByText('Encrypt journal entries')).toBeInTheDocument();
  });

  it('renders App Lock toggle', () => {
    renderSettings();
    expect(screen.getByText('App Lock')).toBeInTheDocument();
  });

  it('renders Daily Reminder section', () => {
    renderSettings();
    expect(screen.getByText('Daily Reminder')).toBeInTheDocument();
  });

  it('renders Data Management section', () => {
    renderSettings();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });
});
