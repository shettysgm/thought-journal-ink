import { useGameStore } from '@/store/useGameStore';
import { useState } from 'react';

export default function AchievementBadges() {
  const { getAchievements } = useGameStore();
  const achievements = getAchievements();
  const [showAll, setShowAll] = useState(false);

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const display = showAll ? achievements : achievements.slice(0, 8);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-card-foreground">
          Badges <span className="text-muted-foreground font-normal">{unlocked.length}/{achievements.length}</span>
        </p>
        {achievements.length > 8 && (
          <button onClick={() => setShowAll(!showAll)} className="text-[11px] text-primary font-medium">
            {showAll ? 'Less' : 'All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {display.map((a) => (
          <div
            key={a.id}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-opacity ${
              a.unlockedAt ? '' : 'opacity-25 grayscale'
            }`}
            title={a.description}
          >
            <span className="text-2xl leading-none">{a.icon}</span>
            <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center line-clamp-1">
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
