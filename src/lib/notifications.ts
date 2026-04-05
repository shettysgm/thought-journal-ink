import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIFICATION_ID = 21; // 21-day habit theme

/** Allow notifications to display as banners even when app is in foreground */
export function enableForegroundNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('[Notifications] Received in foreground:', notification.title);
  });
}

/** Returns true only if notification was actually scheduled on native */
export async function scheduleStreakReminder(hour: number, minute: number): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== 'granted') {
        console.warn('[Notifications] Permission denied');
        return false;
      }
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
    console.log('[Notifications] Scheduled daily reminder at', hour, ':', minute);
    return true;
  } catch (e) {
    console.warn('[Notifications] Failed to schedule:', e);
    return false;
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
