import { useEntries } from '@/store/useEntries';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function StreakReminder() {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const hasJournaledToday = entries.some((e) => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  // Calculate current streak (excluding today)
  const streakDays = (() => {
    if (entries.length === 0) return 0;
    const days = new Set(
      entries.map((e) => {
        const d = new Date(e.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const check = new Date();
    check.setDate(check.getDate() - 1);
    let count = 0;
    while (days.has(toKey(check))) {
      count++;
      check.setDate(check.getDate() - 1);
    }
    return count;
  })();

  if (dismissed || hasJournaledToday || streakDays === 0) return null;

  const messages = [
    { min: 1, text: `You have a ${streakDays}-day streak — don't let it slip!` },
    { min: 7, text: `${streakDays} days strong! One entry keeps the streak alive 🔥` },
    { min: 14, text: `${streakDays} days! You're so close to 21 — write today! 🏁` },
    { min: 20, text: `${streakDays} days! ONE more day to build the habit! 🏆` },
  ];

  let message = messages[0].text;
  for (const m of messages) {
    if (streakDays >= m.min) message = m.text;
  }

  return (
    <div className="relative bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <button
          onClick={() => navigate('/unified')}
          className="text-xs font-semibold text-primary mt-1 hover:underline"
        >
          Write now →
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md hover:bg-muted text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
