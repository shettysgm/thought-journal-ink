import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useEntries } from '@/store/useEntries';

function computeStreak(entries: { createdAt: string }[]): { current: number; best: number } {
  if (entries.length === 0) return { current: 0, best: 0 };

  const days = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const today = new Date();
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  let current = 0;
  const check = new Date(today);

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

export default function StreakTracker() {
  const { entries, loadEntries } = useEntries();
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    setStreak(computeStreak(entries));
  }, [entries]);

  const progress = Math.min(streak.current / 21, 1);

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Current Streak */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-2">
          <Flame className="w-5 h-5 text-destructive" />
        </div>
        <p className="stat-number text-2xl text-card-foreground">{streak.current}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Day Streak</p>
      </div>

      {/* Best Streak */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <span className="text-lg">🏆</span>
        </div>
        <p className="stat-number text-2xl text-card-foreground">{streak.best}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Best Streak</p>
      </div>

      {/* 21-day goal */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft text-center">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <span className="text-lg">🎯</span>
        </div>
        <p className="stat-number text-2xl text-card-foreground">{Math.round(progress * 100)}%</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">21-Day Goal</p>
      </div>
    </div>
  );
}
