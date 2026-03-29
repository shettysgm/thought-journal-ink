import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleStreakReminder, cancelStreakReminder } from '@/lib/notifications';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));

const mockSchedule = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn().mockResolvedValue(undefined);
const mockCheckPermissions = vi.fn().mockResolvedValue({ display: 'granted' });
const mockRequestPermissions = vi.fn().mockResolvedValue({ display: 'granted' });

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: (...args: any[]) => mockSchedule(...args),
    cancel: (...args: any[]) => mockCancel(...args),
    checkPermissions: () => mockCheckPermissions(),
    requestPermissions: () => mockRequestPermissions(),
  },
}));

describe('Stay on Track - Daily Reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false on non-native platform (web)', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const result = await scheduleStreakReminder(9, 0);
    expect(result).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('schedules a daily reminder on native platform', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const result = await scheduleStreakReminder(20, 30);
    expect(result).toBe(true);
    expect(mockCancel).toHaveBeenCalled(); // cancels existing first
    expect(mockSchedule).toHaveBeenCalledWith({
      notifications: [
        expect.objectContaining({
          id: 21,
          title: "Don't break your streak! 🔥",
          body: "Take a moment to journal today and keep your 21-day habit alive.",
          schedule: expect.objectContaining({
            on: { hour: 20, minute: 30 },
            repeats: true,
          }),
        }),
      ],
    });
  });

  it('requests permission if not granted', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce({ display: 'granted' });

    const result = await scheduleStreakReminder(9, 0);
    expect(result).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('returns false when permission denied', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce({ display: 'denied' });

    const result = await scheduleStreakReminder(9, 0);
    expect(result).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('cancels existing reminder before scheduling new one', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    await scheduleStreakReminder(8, 0);
    expect(mockCancel).toHaveBeenCalledBefore(mockSchedule);
  });

  it('cancelStreakReminder cancels notification ID 21', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    await cancelStreakReminder();
    expect(mockCancel).toHaveBeenCalledWith({
      notifications: [{ id: 21 }],
    });
  });

  it('cancelStreakReminder is a no-op on web', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    await cancelStreakReminder();
    expect(mockCancel).not.toHaveBeenCalled();
  });
});
