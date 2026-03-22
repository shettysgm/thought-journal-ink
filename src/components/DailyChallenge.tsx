import { useGameStore } from '@/store/useGameStore';
import { Check } from 'lucide-react';

export default function DailyChallenges() {
  const { getDailyChallenges } = useGameStore();
  const challenges = getDailyChallenges();
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-card-foreground">Today's Challenges</p>
        <span className="text-[11px] text-muted-foreground">{completedCount}/{challenges.length}</span>
      </div>

      <div className="space-y-2">
        {challenges.map((c) => {
          const progress = Math.min(c.progress / c.target, 1);
          return (
            <div key={c.id} className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  c.completed ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {c.completed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-[8px] font-bold">{Math.round(progress * 100)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium leading-tight ${c.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
                  {c.title}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-accent-strong shrink-0">+{c.xpReward}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
