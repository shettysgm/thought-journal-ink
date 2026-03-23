import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/store/useSettings';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

export default function NotificationBanner() {
  const { reminderTime, reminderAutoScheduled, updateSettings } = useSettings();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already has a reminder set, or was dismissed this session
  if (reminderTime || dismissed) return null;

  const handleEnable = async () => {
    const defaultTime = '09:00';
    try {
      await updateSettings({ reminderTime: defaultTime });

      if (Capacitor.isNativePlatform()) {
        const { scheduleStreakReminder } = await import('@/lib/notifications');
        await scheduleStreakReminder(9, 0);
      }

      toast({
        title: 'Reminder Set ✅',
        description: "You'll get a daily nudge at 9:00 AM. Change it in Settings.",
      });
    } catch {
      toast({
        title: 'Could not enable reminder',
        description: 'Try again from Settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <Bell className="w-5 h-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Stay on track</p>
        <p className="text-xs text-muted-foreground">Get a daily reminder to journal</p>
      </div>
      <Button size="sm" className="shrink-0 text-xs h-8" onClick={handleEnable}>
        Enable
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
