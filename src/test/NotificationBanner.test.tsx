import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotificationBanner from '@/components/NotificationBanner';

// Mock useSettings
let mockReminderTime: string | null = null;
const mockUpdateSettings = vi.fn();

vi.mock('@/store/useSettings', () => ({
  useSettings: () => ({
    reminderTime: mockReminderTime,
    reminderAutoScheduled: false,
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

describe('NotificationBanner', () => {
  it('renders when no reminder is set', () => {
    mockReminderTime = null;
    render(<NotificationBanner />);
    expect(screen.getByText('Stay on track')).toBeInTheDocument();
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('does not render when reminder is already set', () => {
    mockReminderTime = '09:00';
    const { container } = render(<NotificationBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('can be dismissed', async () => {
    mockReminderTime = null;
    const user = userEvent.setup();
    render(<NotificationBanner />);
    
    const dismissBtn = screen.getByLabelText('Dismiss');
    await user.click(dismissBtn);
    
    expect(screen.queryByText('Stay on track')).not.toBeInTheDocument();
  });

  it('calls updateSettings when Enable is clicked', async () => {
    mockReminderTime = null;
    mockUpdateSettings.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NotificationBanner />);
    
    await user.click(screen.getByText('Enable'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ reminderTime: '09:00' });
  });
});
