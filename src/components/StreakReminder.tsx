import { useEntries } from '@/store/useEntries';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { X } from 'lucide-react';

export default function StreakReminder() {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const hasJournaledToday = entries.some((e) => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  const streakDays = (() => {
    if (entries.length === 0) return 0;
    const days = new Set(entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const check = new Date();
    check.setDate(check.getDate() - 1);
    let count = 0;
    while (days.has(toKey(check))) { count++; check.setDate(check.getDate() - 1); }
    return count;
  })();

  if (dismissed || hasJournaledToday || streakDays === 0) return null;

  const msg = streakDays >= 20
    ? `${streakDays} days! One more to form the habit`
    : streakDays >= 7
    ? `${streakDays}-day streak at risk`
    : `${streakDays}-day streak — write to keep it`;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-destructive/5 border border-destructive/10 px-4 py-3">
      <div className="flex-1">
        <p className="text-[12px] font-medium text-foreground">{msg}</p>
        <button onClick={() => navigate('/unified')} className="text-[11px] font-semibold text-primary mt-0.5">
          Write now →
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 text-muted-foreground" aria-label="Dismiss">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
