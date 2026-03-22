import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useEntries } from '@/store/useEntries';
import { useGameStore } from '@/store/useGameStore';
import iconStreak from '@/assets/icon-streak.png';
import iconGoal from '@/assets/icon-goal.png';
import iconBest from '@/assets/icon-best.png';

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
  while (days.has(toKey(check))) { current++; check.setDate(check.getDate() - 1); }
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

export default function HeroStats() {
  const { entries, loadEntries } = useEntries();
  const { getLevelInfo, xp, totalEntries: trackedEntries, checkAchievements } = useGameStore();
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => {
    const s = computeStreak(entries);
    setStreak(s);
    checkAchievements(s.current);
  }, [entries, checkAchievements]);

  useEffect(() => {
    if (entries.length > 0 && trackedEntries === 0) {
      const { recordEntry } = useGameStore.getState();
      for (const entry of entries) {
        const wordCount = (entry.text || '').split(/\s+/).filter(Boolean).length;
        recordEntry(wordCount);
      }
    }
  }, [entries, trackedEntries]);

  const info = getLevelInfo();
  const goalProgress = Math.min(streak.current / 21, 1);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-5">
      {/* Level row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ArrowUp className="w-5 h-5 text-primary" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-card-foreground">Level {info.level}</p>
            <p className="text-xs text-muted-foreground">{xp} XP</p>
          </div>
          {info.next && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${info.progress * 100}%`, background: 'var(--gradient-primary)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Three stats with custom icons */}
      <div className="flex items-center justify-around text-center">
        <div className="flex flex-col items-center">
          <img src={iconStreak} alt="Streak" className="w-10 h-10 object-contain mb-1" />
          <p className="stat-number text-xl text-card-foreground leading-none">{streak.current}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Streak</p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex flex-col items-center">
          <img src={iconGoal} alt="21-Day Goal" className="w-10 h-10 object-contain mb-1" />
          <p className="stat-number text-xl text-card-foreground leading-none">{Math.round(goalProgress * 100)}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">21-Day</p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex flex-col items-center">
          <img src={iconBest} alt="Best Streak" className="w-10 h-10 object-contain mb-1" />
          <p className="stat-number text-xl text-card-foreground leading-none">{streak.best}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Best</p>
        </div>
      </div>
    </div>
  );
}
