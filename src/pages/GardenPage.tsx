import { useEffect, useState } from 'react';
import { Droplets, Sun, TreePine, Sprout } from 'lucide-react';
import { useEntries } from '@/store/useEntries';
import { useGameStore } from '@/store/useGameStore';

import plantStage1 from '@/assets/plant-stage-1.png';
import plantStage2 from '@/assets/plant-stage-2.png';
import plantStage3 from '@/assets/plant-stage-3.png';
import plantStage4 from '@/assets/plant-stage-4.png';
import plantStage5 from '@/assets/plant-stage-5.png';

const STAGES = [
  { img: plantStage1, name: 'Seed', minLevel: 0 },
  { img: plantStage2, name: 'Sprout', minLevel: 1 },
  { img: plantStage3, name: 'Sapling', minLevel: 2 },
  { img: plantStage4, name: 'Young Tree', minLevel: 3 },
  { img: plantStage5, name: 'Full Bloom', minLevel: 5 },
];

function computeStreak(entries: { createdAt: string }[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let current = 0;
  const check = new Date();
  if (!days.has(toKey(check))) {
    check.setDate(check.getDate() - 1);
    if (!days.has(toKey(check))) return 0;
  }
  while (days.has(toKey(check))) { current++; check.setDate(check.getDate() - 1); }
  return current;
}

function countReframes(entries: { reframes?: any[] }[]): number {
  return entries.reduce((sum, e) => sum + (e.reframes?.length || 0), 0);
}

export default function GardenPage() {
  const { entries, loadEntries } = useEntries();
  const { getLevelInfo, xp } = useGameStore();
  const [streak, setStreak] = useState(0);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { setStreak(computeStreak(entries)); }, [entries]);

  const totalEntries = entries.length;
  const totalReframes = countReframes(entries);
  const info = getLevelInfo();

  // Determine plant stage based on combined growth score
  const growthScore = totalEntries + totalReframes * 2 + streak * 3;
  const stageIndex = growthScore >= 50 ? 4 : growthScore >= 25 ? 3 : growthScore >= 10 ? 2 : growthScore >= 3 ? 1 : 0;
  const stage = STAGES[stageIndex];
  const nextStage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
  const thresholds = [0, 3, 10, 25, 50];
  const currentThreshold = thresholds[stageIndex];
  const nextThreshold = thresholds[Math.min(stageIndex + 1, thresholds.length - 1)];
  const stageProgress = stageIndex === 4 ? 1 : (growthScore - currentThreshold) / (nextThreshold - currentThreshold);

  const stats = [
    { icon: Droplets, label: 'Entries', value: totalEntries, sublabel: 'Water 💧', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Sun, label: 'Reframes', value: totalReframes, sublabel: 'Sunlight ☀️', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: TreePine, label: 'Streak', value: streak, sublabel: 'Growth 🌳', color: 'text-green-600', bg: 'bg-green-600/10' },
  ];

  return (
    <div
      className="min-h-[100svh] bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))'
      }}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Mind Garden</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sprout className="w-4 h-4 text-primary" />
            <span>Level {info.level} · {xp} XP</span>
          </div>
        </div>

        {/* Plant display */}
        <div className="rounded-2xl bg-card border border-border p-6 shadow-soft flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={stage.img}
              alt={stage.name}
              className="w-48 h-48 object-contain drop-shadow-lg transition-all duration-700"
              width={512}
              height={512}
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold text-card-foreground">{stage.name}</p>
            <p className="text-xs text-muted-foreground">
              {stageIndex < 4
                ? `${Math.round(stageProgress * 100)}% to ${nextStage.name}`
                : 'Fully grown! 🎉'}
            </p>
          </div>
          {stageIndex < 4 && (
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round(stageProgress * 100)}%`,
                  background: 'linear-gradient(90deg, hsl(142 71% 45%), hsl(142 71% 55%))'
                }}
              />
            </div>
          )}
        </div>

        {/* Growth stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-3 shadow-soft text-center">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${s.color}`} strokeWidth={2} />
                </div>
                <p className="stat-number text-xl text-card-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{s.sublabel}</p>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-card-foreground">How your garden grows</p>
          <div className="space-y-2.5">
            {[
              { emoji: '💧', text: 'Every journal entry waters your plant' },
              { emoji: '☀️', text: 'AI reframes give it sunlight' },
              { emoji: '🌳', text: 'Streaks accelerate growth' },
            ].map((item) => (
              <div key={item.emoji} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth milestones */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-card-foreground">Growth stages</p>
          <div className="space-y-2">
            {STAGES.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-3 py-1.5 ${i <= stageIndex ? 'opacity-100' : 'opacity-40'}`}>
                <img src={s.img} alt={s.name} className="w-8 h-8 object-contain" width={512} height={512} loading="lazy" />
                <div className="flex-1">
                  <p className={`text-xs font-medium ${i <= stageIndex ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {s.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {thresholds[i]} growth points
                  </p>
                </div>
                {i <= stageIndex && <span className="text-xs">✅</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
