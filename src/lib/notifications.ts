import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIFICATION_ID = 21; // 21-day habit theme

export async function scheduleStreakReminder(hour: number, minute: number) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== 'granted') return;
    }

    // Cancel existing reminder first
    await cancelStreakReminder();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: "Don't break your streak! 🔥",
          body: "Take a moment to journal today and keep your 21-day habit alive.",
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
          sound: undefined,
          smallIcon: 'ic_notification',
          largeIcon: 'ic_notification',
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
  }
}

export async function cancelStreakReminder() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch (e) {
    console.warn('Failed to cancel notification:', e);
  }
}
