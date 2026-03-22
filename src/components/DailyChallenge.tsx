import { useGameStore } from '@/store/useGameStore';
import { Target, Check } from 'lucide-react';

export default function DailyChallenges() {
  const { getDailyChallenges } = useGameStore();
  const challenges = getDailyChallenges();

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Daily Challenges</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{challenges.length} done
        </span>
      </div>

      <div className="space-y-2">
        {challenges.map((c) => {
          const progress = Math.min(c.progress / c.target, 1);
          return (
            <div
              key={c.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                ${c.completed
                  ? 'bg-success/5 border-success/20'
                  : 'bg-muted/30 border-border/50'
                }
              `}
            >
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors
                  ${c.completed
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {c.completed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{Math.round(progress * 100)}%</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-semibold ${c.completed ? 'text-success line-through' : 'text-card-foreground'}`}>
                    {c.title}
                  </p>
                  <span className="text-[10px] font-bold text-accent-strong">+{c.xpReward} XP</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{c.description}</p>
                {!c.completed && (
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
