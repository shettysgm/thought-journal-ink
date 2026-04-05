import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { name: 'Breathe In', duration: 4, color: 'hsl(var(--primary))' },
  { name: 'Hold', duration: 7, color: 'hsl(var(--accent))' },
  { name: 'Breathe Out', duration: 8, color: 'hsl(var(--muted))' },
] as const;

const TOTAL_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0);

const ENCOURAGEMENTS = [
  'You're doing great',
  'Let your mind settle',
  'Feel the calm wash over you',
  'Each breath brings peace',
  'Stay present, stay gentle',
];

export default function BreathePage() {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);

  const currentPhase = PHASES[phaseIndex];

  const reset = useCallback(() => {
    setIsActive(false);
    setPhaseIndex(0);
    setCountdown(PHASES[0].duration);
    setCycles(0);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          const nextIndex = (phaseIndex + 1) % PHASES.length;
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) {
            setCycles(c => c + 1);
          }
          return PHASES[nextIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phaseIndex]);

  // Circle scale: expand on inhale, hold during hold, shrink on exhale
  const getScale = () => {
    if (!isActive) return 1;
    if (phaseIndex === 0) return 1.6; // Inhale - expand
    if (phaseIndex === 1) return 1.6; // Hold - stay expanded
    return 1; // Exhale - shrink
  };

  const getTransitionDuration = () => {
    return currentPhase.duration;
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))',
      }}
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold text-foreground mb-1">4-7-8 Breathing</h1>
        <p className="text-xs text-muted-foreground">
          A calming technique to ease anxiety and find balance
        </p>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-10" style={{ width: 220, height: 220 }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${currentPhase.color}15 0%, transparent 70%)`,
          }}
          animate={{ scale: getScale() * 1.15, opacity: isActive ? 0.6 : 0.2 }}
          transition={{ duration: getTransitionDuration(), ease: 'easeInOut' }}
        />

        {/* Main circle */}
        <motion.div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: 160,
            height: 160,
            background: `radial-gradient(circle at 30% 30%, ${currentPhase.color}30, ${currentPhase.color}10)`,
            border: `2px solid ${currentPhase.color}40`,
            backdropFilter: 'blur(8px)',
          }}
          animate={{ scale: getScale() }}
          transition={{ duration: getTransitionDuration(), ease: 'easeInOut' }}
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={isActive ? `${phaseIndex}-${countdown}` : 'idle'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {isActive ? (
                  <>
                    <p className="text-3xl font-bold text-foreground tabular-nums">{countdown}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">{currentPhase.name}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">Tap to start</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Phase indicator dots */}
        <div className="absolute -bottom-6 flex gap-2">
          {PHASES.map((phase, i) => (
            <div
              key={phase.name}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === phaseIndex && isActive ? phase.color : 'hsl(var(--border))',
                transform: i === phaseIndex && isActive ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Encouragement text */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.p
            key={cycles}
            className="text-sm text-muted-foreground text-center italic mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {ENCOURAGEMENTS[cycles % ENCOURAGEMENTS.length]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Cycle counter */}
      {isActive && cycles > 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          {cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed
        </p>
      )}

      {/* Start/Stop button */}
      <button
        onClick={() => (isActive ? reset() : setIsActive(true))}
        className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 touch-manipulation"
        style={{
          backgroundColor: isActive ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
          color: isActive ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
        }}
      >
        {isActive ? 'Stop' : 'Begin'}
      </button>

      {/* Info */}
      {!isActive && (
        <div className="mt-8 text-center max-w-[260px]">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3–4 cycles to feel the calming effect.
          </p>
        </div>
      )}
    </div>
  );
}
