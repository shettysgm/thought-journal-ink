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

const ENCOURAGEMENTS: [number, string][] = [
  [0, "Start your 21-day habit journey! ✨"],
  [1, "Day 1 — every habit starts here!"],
  [2, "2 days in — you're showing up! 💪"],
  [3, "3 days strong! Keep the momentum!"],
  [5, "Almost a week — building a habit! 🔑"],
  [7, "One full week! 1/3 of the way there! 🌟"],
  [10, "10 days! You're rewiring your brain! 🧠"],
  [14, "Two weeks! The habit is taking root! 🌱"],
  [17, "17 days — the finish line is in sight! 🔥"],
  [20, "Tomorrow you hit 21! Don't stop now! 🏁"],
  [21, "🏆 21 days! You've built a habit! 🎉"],
  [30, "30 days! Journaling is part of who you are 💎"],
];

function getEncouragement(streak: number): string {
  let msg = ENCOURAGEMENTS[0][1];
  for (const [threshold, text] of ENCOURAGEMENTS) {
    if (streak >= threshold) msg = text;
    else break;
  }
  return msg;
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
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-rose-100 shadow-sm">
          <Flame className={`w-6 h-6 text-orange-300 ${
            streak.current > 0 ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : 'opacity-80'
          }`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">
            {streak.current} / 21 days
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
