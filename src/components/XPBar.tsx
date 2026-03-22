import { useGameStore } from '@/store/useGameStore';
import { Zap } from 'lucide-react';

export default function XPBar() {
  const { getLevelInfo, xp } = useGameStore();
  const info = getLevelInfo();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level {info.level}</p>
            <p className="text-sm font-semibold text-card-foreground">{info.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="stat-number text-lg text-primary">{xp.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total XP</p>
        </div>
      </div>

      {/* XP Progress bar */}
      {info.next && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(info.progress * 100, 100)}%`,
                background: 'var(--gradient-primary)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{info.xpInLevel} / {info.xpForNext} XP</span>
            <span>Level {info.next.level} — {info.next.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
