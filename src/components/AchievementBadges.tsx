import { useGameStore } from '@/store/useGameStore';
import { Trophy } from 'lucide-react';
import { useState } from 'react';

export default function AchievementBadges() {
  const { getAchievements } = useGameStore();
  const achievements = getAchievements();
  const [showAll, setShowAll] = useState(false);

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);
  const display = showAll ? achievements : achievements.slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent-strong" />
          <h3 className="text-sm font-semibold text-card-foreground">
            Achievements
          </h3>
          <span className="text-xs text-muted-foreground">
            {unlocked.length}/{achievements.length}
          </span>
        </div>
        {achievements.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showAll ? 'Show less' : 'View all'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {display.map((a) => (
          <div
            key={a.id}
            className={`
              relative flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all duration-200
              ${a.unlockedAt
                ? 'bg-accent/10 border border-accent/20'
                : 'bg-muted/50 border border-transparent opacity-40 grayscale'
              }
            `}
            title={`${a.title}: ${a.description}`}
          >
            <span className="text-xl leading-none">{a.icon}</span>
            <span className="text-[9px] font-medium text-card-foreground leading-tight line-clamp-2">
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
