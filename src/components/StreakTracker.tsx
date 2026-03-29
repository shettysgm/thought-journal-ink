import { useEffect, useState, useRef } from 'react';
import { Zap, Trophy, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
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
    .map((k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d); })
    .sort((a, b) => a.getTime() - b.getTime());
  let best = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000;
    if (Math.round(diff) === 1) { run++; best = Math.max(best, run); } else { run = 1; }
  }
  return best;
}

export default function StreakTracker() {
  const { entries, loadEntries } = useEntries();
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { setStreak(computeStreak(entries)); }, [entries]);

  const progress = Math.min(streak.current / 21, 1);

  const stats = [
    { value: streak.current, label: 'Streak', icon: Zap, color: 'text-destructive', bg: 'bg-destructive/8' },
    { value: streak.best, label: 'Best', icon: Trophy, color: 'text-accent-strong', bg: 'bg-accent/8' },
    { value: `${Math.round(progress * 100)}%`, label: '21-Day', icon: Target, color: 'text-primary', bg: 'bg-primary/8' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-2xl bg-card border border-border p-3 shadow-soft text-center">
            <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1.5`} strokeWidth={2} />
            <p className="stat-number text-xl text-card-foreground leading-none">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
