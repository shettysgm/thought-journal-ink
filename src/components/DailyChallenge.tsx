import { useGameStore } from '@/store/useGameStore';
import { Check } from 'lucide-react';

export default function DailyChallenges() {
  const { getDailyChallenges } = useGameStore();
  const challenges = getDailyChallenges();

  return (
    <div className="space-y-2.5">
      {challenges.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-1">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              c.completed ? 'bg-success text-success-foreground' : 'border-2 border-muted-foreground/30'
            }`}
          >
            {c.completed && <Check className="w-3 h-3" />}
          </div>
          <p className={`text-[13px] flex-1 ${c.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
            {c.title}
          </p>
          <span className="text-[11px] font-medium text-accent-strong">+{c.xpReward}</span>
        </div>
      ))}
    </div>
  );
}
