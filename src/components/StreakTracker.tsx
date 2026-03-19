import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useEntries } from '@/store/useEntries';

function computeStreak(entries: { createdAt: string }[]): { current: number; best: number } {
  if (entries.length === 0) return { current: 0, best: 0 };

  // Get unique days (local timezone)
  const days = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const today = new Date();
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  // Walk backwards from today
  let current = 0;
  const check = new Date(today);

  // Allow today to be missing (streak still counts if yesterday exists)
  if (!days.has(toKey(check))) {
    check.setDate(check.getDate() - 1);
    if (!days.has(toKey(check))) return { current: 0, best: getBest(days) };
  }

  while (days.has(toKey(check))) {
    current++;
    check.setDate(check.getDate() - 1);
  }

  return { current, best: Math.max(current, getBest(days)) };
}

function getBest(days: Set<string>): number {
  if (days.size === 0) return 0;
  // Convert to sorted dates
  const sorted = Array.from(days)
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

const ENCOURAGEMENTS = [
  "Start your streak today! ✨",
  "Great start! Keep it up!",
  "You're building a habit! 💪",
  "3 days strong!",
  "Consistency is key! 🔑",
  "Almost a week! 🌟",
  "You're on fire! 🎉",
  "One full week! Amazing! 🏆",
];

function getEncouragement(streak: number): string {
  if (streak === 0) return ENCOURAGEMENTS[0];
  if (streak >= 7) return ENCOURAGEMENTS[7];
  return ENCOURAGEMENTS[Math.min(streak, ENCOURAGEMENTS.length - 1)];
}

export default function StreakTracker() {
  const { entries, loadEntries } = useEntries();
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    setStreak(computeStreak(entries));
  }, [entries]);

  return (
    <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          streak.current > 0 ? 'bg-therapeutic-warmth/20' : 'bg-muted'
        }`}>
          <Flame className={`w-5 h-5 ${
            streak.current > 0 ? 'text-therapeutic-warmth' : 'text-muted-foreground'
          }`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            {streak.current} day{streak.current !== 1 ? 's' : ''} streak
          </p>
          <p className="text-xs text-muted-foreground">{getEncouragement(streak.current)}</p>
        </div>
      </div>
      {streak.best > 0 && (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-sm font-bold text-card-foreground">{streak.best} 🏆</p>
        </div>
      )}
    </div>
  );
}
