import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Sun, TreePine, Sprout, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEntries } from '@/store/useEntries';
import { useGameStore } from '@/store/useGameStore';

import plantStage1 from '@/assets/plant-stage-1.png';
import plantStage2 from '@/assets/plant-stage-2.png';
import plantStage3 from '@/assets/plant-stage-3.png';
import plantStage4 from '@/assets/plant-stage-4.png';
import plantStage5 from '@/assets/plant-stage-5.png';
import plantCactus from '@/assets/plant-cactus.png';
import plantSunflower from '@/assets/plant-sunflower.png';
import plantLavender from '@/assets/plant-lavender.png';
import plantBonsai from '@/assets/plant-bonsai.png';

// ── Main plant growth stages ──
const STAGES = [
  { img: plantStage1, name: 'Seed', emoji: '🌰' },
  { img: plantStage2, name: 'Sprout', emoji: '🌱' },
  { img: plantStage3, name: 'Sapling', emoji: '🌿' },
  { img: plantStage4, name: 'Young Tree', emoji: '🌳' },
  { img: plantStage5, name: 'Full Bloom', emoji: '🌸' },
];
const THRESHOLDS = [0, 3, 10, 25, 50];

// ── Unlockable plant species ──
const SPECIES = [
  { id: 'main', name: 'Growth Tree', img: plantStage5, unlockAt: 0, emoji: '🌳' },
  { id: 'cactus', name: 'Desert Bloom', img: plantCactus, unlockAt: 5, emoji: '🌵' },
  { id: 'sunflower', name: 'Sunflower', img: plantSunflower, unlockAt: 15, emoji: '🌻' },
  { id: 'lavender', name: 'Lavender', img: plantLavender, unlockAt: 30, emoji: '💜' },
  { id: 'bonsai', name: 'Cherry Bonsai', img: plantBonsai, unlockAt: 50, emoji: '🌸' },
];

// ── Weather helpers ──
function getWeather(streak: number, reframes: number, todayEntries: number): 'sunny' | 'cloudy' | 'rainy' | 'rainbow' {
  if (streak >= 7 && reframes >= 5) return 'rainbow';
  if (reframes >= 3) return 'sunny';
  if (todayEntries > 0) return 'rainy'; // watering = rain
  return 'cloudy';
}

function getSeason(entries: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (entries >= 40) return 'summer';
  if (entries >= 20) return 'spring';
  if (entries >= 10) return 'autumn';
  return 'winter';
}

const SEASON_BG: Record<string, string> = {
  spring: 'from-green-50 via-emerald-50 to-sky-50',
  summer: 'from-amber-50 via-yellow-50 to-orange-50',
  autumn: 'from-orange-50 via-amber-50 to-red-50',
  winter: 'from-slate-100 via-blue-50 to-indigo-50',
};

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  rainbow: '🌈',
};

// ── Sparkle component ──
function Sparkle({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-yellow-300"
      style={{ filter: 'blur(0.5px)', boxShadow: '0 0 6px 2px rgba(250,204,21,0.5)' }}
      initial={{ opacity: 0, scale: 0, x: Math.random() * 120 - 60, y: Math.random() * 120 - 60 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        y: [0, -20, -40],
      }}
      transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 2 + Math.random() * 2 }}
    />
  );
}

// ── Water droplet animation ──
function WaterDrop({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl"
      initial={{ y: -40, opacity: 1 }}
      animate={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      💧
    </motion.div>
  );
}

// ── Rain particles ──
function RainParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-3 bg-blue-300/40 rounded-full"
          style={{ left: `${8 + i * 8}%` }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: '100%', opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.2 + Math.random() * 0.5, delay: i * 0.15, repeat: Infinity, repeatDelay: 1 }}
        />
      ))}
    </div>
  );
}

// ── Floating sun rays ──
function SunRays() {
  return (
    <motion.div
      className="absolute -top-4 -right-4 text-4xl"
      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      ☀️
    </motion.div>
  );
}

// ── Streak helpers ──
function computeStreak(entries: { createdAt: string }[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map(e => { const d = new Date(e.createdAt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let current = 0;
  const check = new Date();
  if (!days.has(toKey(check))) { check.setDate(check.getDate() - 1); if (!days.has(toKey(check))) return 0; }
  while (days.has(toKey(check))) { current++; check.setDate(check.getDate() - 1); }
  return current;
}

function countReframes(entries: { reframes?: any[] }[]): number {
  return entries.reduce((sum, e) => sum + (e.reframes?.length || 0), 0);
}

function countTodayEntries(entries: { createdAt: string }[]): number {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  return entries.filter(e => { const d = new Date(e.createdAt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key; }).length;
}

// ══════════════════════════════════════════
// GARDEN PAGE
// ══════════════════════════════════════════
export default function GardenPage() {
  const { entries, loadEntries } = useEntries();
  const { getLevelInfo, xp } = useGameStore();
  const [streak, setStreak] = useState(0);
  const [waterDrops, setWaterDrops] = useState<number[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevStageRef = useRef(0);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { setStreak(computeStreak(entries)); }, [entries]);

  const totalEntries = entries.length;
  const totalReframes = countReframes(entries);
  const todayEntries = countTodayEntries(entries);
  const info = getLevelInfo();

  // Growth score & stage
  const growthScore = totalEntries + totalReframes * 2 + streak * 3;
  const stageIndex = growthScore >= 50 ? 4 : growthScore >= 25 ? 3 : growthScore >= 10 ? 2 : growthScore >= 3 ? 1 : 0;
  const stage = STAGES[stageIndex];
  const nextStage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
  const currentThreshold = THRESHOLDS[stageIndex];
  const nextThreshold = THRESHOLDS[Math.min(stageIndex + 1, THRESHOLDS.length - 1)];
  const stageProgress = stageIndex === 4 ? 1 : Math.min((growthScore - currentThreshold) / (nextThreshold - currentThreshold), 1);

  // Weather & season
  const weather = getWeather(streak, totalReframes, todayEntries);
  const season = getSeason(totalEntries);

  // Level-up confetti
  useEffect(() => {
    if (stageIndex > prevStageRef.current && prevStageRef.current > 0) {
      setShowLevelUp(true);
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 40, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: ['#22c55e', '#fbbf24', '#ec4899'] });
        confetti({ particleCount: 40, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: ['#22c55e', '#fbbf24', '#ec4899'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    prevStageRef.current = stageIndex;
  }, [stageIndex]);

  // Water tap handler
  const handleWater = useCallback(() => {
    const id = Date.now();
    setWaterDrops(prev => [...prev, id]);
  }, []);

  const removeDrop = useCallback((id: number) => {
    setWaterDrops(prev => prev.filter(d => d !== id));
  }, []);

  const stats = [
    { icon: Droplets, label: 'Water', value: totalEntries, sublabel: `${todayEntries} today`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Sun, label: 'Sunlight', value: totalReframes, sublabel: 'reframes', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: TreePine, label: 'Growth', value: `${streak}d`, sublabel: 'streak', color: 'text-green-600', bg: 'bg-green-600/10' },
  ];

  return (
    <div
      className="min-h-[100svh] bg-white dark:bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <header className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Mind Garden</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Grow with every entry</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{WEATHER_ICONS[weather]}</span>
            <span className="capitalize">{season}</span>
            <span>·</span>
            <Sprout className="w-3.5 h-3.5 text-primary" />
            <span>Lv {info.level}</span>
          </div>
        </div>

        {/* ── Main plant display with weather ── */}
        <motion.div
          className={`relative rounded-3xl border border-border p-6 shadow-soft overflow-hidden bg-gradient-to-b ${SEASON_BG[season]}`}
          layout
        >
          {/* Weather effects */}
          {weather === 'rainy' && <RainParticles />}
          {weather === 'sunny' && <SunRays />}
          {weather === 'rainbow' && (
            <motion.div
              className="absolute top-2 right-2 text-2xl"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌈
            </motion.div>
          )}

          {/* Level up banner */}
          <AnimatePresence>
            {showLevelUp && (
              <motion.div
                className="absolute top-3 left-0 right-0 text-center z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  🎉 Level Up! → {stage.name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plant with tap-to-water */}
          <div className="flex flex-col items-center gap-3 relative" onClick={handleWater}>
            {/* Sparkles around plant */}
            <div className="relative">
              {growthScore > 0 && Array.from({ length: 4 }).map((_, i) => (
                <Sparkle key={i} delay={i * 0.8} />
              ))}

              {/* Water drops */}
              <AnimatePresence>
                {waterDrops.map(id => (
                  <WaterDrop key={id} onDone={() => removeDrop(id)} />
                ))}
              </AnimatePresence>

              {/* The plant */}
              <motion.img
                src={stage.img}
                alt={stage.name}
                className="w-44 h-44 object-contain drop-shadow-lg cursor-pointer select-none"
                width={512}
                height={512}
                animate={{
                  rotate: [0, 1.5, -1.5, 0],
                  scale: waterDrops.length > 0 ? [1, 1.08, 1] : 1,
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  scale: { duration: 0.4 },
                }}
                whileTap={{ scale: 0.95 }}
                key={stageIndex} // re-mount on stage change for entrance animation
                initial={{ scale: 0.5, opacity: 0 }}
              />
            </div>

            <p className="text-[10px] text-muted-foreground/60 mt-1">Tap to water 💧</p>
          </div>

          {/* Stage name + progress */}
          <div className="text-center mt-2 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{stage.emoji}</span>
              <p className="text-sm font-semibold text-foreground">{stage.name}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {stageIndex < 4
                ? `${Math.round(stageProgress * 100)}% to ${nextStage.name}`
                : '✨ Fully grown!'}
            </p>
            {stageIndex < 4 && (
              <div className="w-full h-2.5 rounded-full bg-white/60 overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(stageProgress * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                className="rounded-2xl bg-card border border-border p-3 shadow-soft text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${s.color}`} strokeWidth={2} />
                </div>
                <p className="stat-number text-xl text-card-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{s.sublabel}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Garden collection ── */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-4">
          <p className="text-sm font-semibold text-card-foreground">🌿 Your Garden</p>
          <div className="grid grid-cols-3 gap-3">
            {SPECIES.map((sp) => {
              const unlocked = growthScore >= sp.unlockAt;
              return (
                <motion.div
                  key={sp.id}
                  className={`relative rounded-2xl border p-3 text-center transition-colors ${
                    unlocked
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-muted/30'
                  }`}
                  whileHover={unlocked ? { scale: 1.05 } : {}}
                  whileTap={unlocked ? { scale: 0.95 } : {}}
                >
                  {unlocked ? (
                    <motion.img
                      src={sp.img}
                      alt={sp.name}
                      className="w-14 h-14 object-contain mx-auto mb-1.5"
                      width={512}
                      height={512}
                      loading="lazy"
                      animate={{ rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: Math.random() * 2 }}
                    />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center mx-auto mb-1.5 opacity-40">
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className={`text-[10px] font-medium ${unlocked ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {sp.name}
                  </p>
                  {!unlocked && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {sp.unlockAt} pts
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Growth stages milestone ── */}
        <div className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-card-foreground">🌱 Growth Journey</p>
          <div className="space-y-1">
            {STAGES.map((s, i) => (
              <motion.div
                key={s.name}
                className={`flex items-center gap-3 py-2 px-2 rounded-xl transition-colors ${
                  i === stageIndex ? 'bg-primary/8' : ''
                } ${i <= stageIndex ? 'opacity-100' : 'opacity-35'}`}
                initial={false}
                animate={i === stageIndex ? { x: [0, 4, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <img src={s.img} alt={s.name} className="w-8 h-8 object-contain" width={512} height={512} loading="lazy" />
                <div className="flex-1">
                  <p className={`text-xs font-medium ${i <= stageIndex ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                    {s.emoji} {s.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{THRESHOLDS[i]} growth points</p>
                </div>
                {i < stageIndex && <span className="text-xs">✅</span>}
                {i === stageIndex && (
                  <motion.span
                    className="text-xs"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🌟
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Tips card ── */}
        <motion.div
          className="rounded-2xl bg-card border border-border p-5 shadow-soft space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm font-semibold text-card-foreground">🌤️ Garden Tips</p>
          <div className="space-y-2.5">
            {[
              { emoji: '💧', text: 'Write a journal entry to water your plant', highlight: todayEntries === 0 },
              { emoji: '☀️', text: 'Use AI reframes to give sunlight', highlight: totalReframes === 0 },
              { emoji: '🔥', text: `${streak > 0 ? `${streak}-day streak! Keep going!` : 'Start a streak for bonus growth'}`, highlight: streak === 0 },
            ].map((item) => (
              <div key={item.emoji} className={`flex items-center gap-3 p-2 rounded-xl ${item.highlight ? 'bg-primary/5 border border-primary/20' : ''}`}>
                <span className="text-lg">{item.emoji}</span>
                <p className={`text-xs ${item.highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
