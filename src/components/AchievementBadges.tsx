import { useGameStore } from '@/store/useGameStore';
import { useState } from 'react';
import {
  Pencil, Flame, Zap, Shield, Trophy, NotebookPen, BookOpen,
  Target, Star, Brain, GraduationCap, Sparkles, BookMarked, Sun, Crown,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  pencil: Pencil,
  flame: Flame,
  zap: Zap,
  shield: Shield,
  trophy: Trophy,
  'notebook-pen': NotebookPen,
  'book-open': BookOpen,
  target: Target,
  star: Star,
  brain: Brain,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
  'book-marked': BookMarked,
  sun: Sun,
  crown: Crown,
};

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
        {display.map((a) => {
          const Icon = ICON_MAP[a.icon] || Star;
          const isUnlocked = !!a.unlockedAt;
          return (
            <div
              key={a.id}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-xl transition-opacity ${
                isUnlocked ? '' : 'opacity-25 grayscale'
              }`}
              title={a.description}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isUnlocked ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Icon className={`w-4 h-4 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2} />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center line-clamp-1">
                {a.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
