import { useGameStore } from '@/store/useGameStore';
import { Zap } from 'lucide-react';

export default function XPBar() {
  const { getLevelInfo, xp } = useGameStore();
  const info = getLevelInfo();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3.5 shadow-soft">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Zap className="w-[18px] h-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-[13px] font-semibold text-card-foreground">
            Lv.{info.level} <span className="font-normal text-muted-foreground">· {info.title}</span>
          </p>
          <p className="stat-number text-[13px] text-primary">{xp} XP</p>
        </div>
        {info.next && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(info.progress * 100, 100)}%`,
                background: 'var(--gradient-primary)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
