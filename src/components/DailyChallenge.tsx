import { useGameStore } from '@/store/useGameStore';
import { Check, PenLine, Type, Lightbulb, HelpCircle } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  write: PenLine,
  words: Type,
  prompt: Lightbulb,
  quiz: HelpCircle,
};

export default function DailyChallenges() {
  const { getDailyChallenges } = useGameStore();
  const challenges = getDailyChallenges();

  return (
    <div className="space-y-2.5">
      {challenges.map((c) => {
        const TypeIcon = TYPE_ICONS[c.type] || Pencil;
        return (
          <div key={c.id} className="flex items-center gap-3 px-1">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                c.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {c.completed ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : (
                <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
              )}
            </div>
            <p className={`text-[13px] flex-1 ${c.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
              {c.title}
            </p>
            <span className="text-[11px] font-medium text-accent-strong">+{c.xpReward}</span>
          </div>
        );
      })}
    </div>
  );
}
