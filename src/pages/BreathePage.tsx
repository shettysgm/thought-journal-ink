import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GroundingExercise from '@/components/GroundingExercise';

/* ── Breathing constants ── */
const PHASES = [
  { name: 'Breathe In', duration: 4, color: 'hsl(var(--primary))' },
  { name: 'Hold', duration: 7, color: 'hsl(var(--accent))' },
  { name: 'Breathe Out', duration: 8, color: 'hsl(var(--muted))' },
] as const;

const ENCOURAGEMENTS = [
  "You're doing great",
  'Let your mind settle',
  'Feel the calm wash over you',
  'Each breath brings peace',
  'Stay present, stay gentle',
];

/* ── Breathing sub-component ── */
function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState<number>(PHASES[0].duration);
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
          const nextIndex = (phaseIndex + 1) % PHASES.length;
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) setCycles(c => c + 1);
          return PHASES[nextIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, phaseIndex]);

  const getScale = () => {
    if (!isActive) return 0.5;
    if (phaseIndex === 0) return 1;
    if (phaseIndex === 1) return 1;
    return 0.5;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-10" style={{ width: 280, height: 280 }}>
        <motion.div
          className="absolute rounded-full"
          style={{ width: 260, height: 260, backgroundColor: 'hsl(var(--primary) / 0.08)' }}
          animate={{ scale: getScale() * 1.1, opacity: isActive ? 0.8 : 0.3 }}
          transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full flex items-center justify-center shadow-lg"
          style={{ width: 240, height: 240, backgroundColor: 'hsl(var(--primary) / 0.15)', border: '2px solid hsl(var(--primary) / 0.3)' }}
          animate={{ scale: getScale() }}
          transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
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
                    <p className="text-4xl font-bold text-foreground tabular-nums">{countdown}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{currentPhase.name}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">Tap Begin</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Encouragement */}
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

      {isActive && cycles > 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          {cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed
        </p>
      )}

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

/* ── Main page ── */
export default function BreathePage() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center px-6"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))',
      }}
    >
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-foreground mb-1">Calm Toolkit</h1>
        <p className="text-xs text-muted-foreground">Breathing & grounding exercises</p>
      </div>

      <Tabs defaultValue="breathing" className="w-full max-w-[340px]">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="breathing">Breathing</TabsTrigger>
          <TabsTrigger value="grounding">Grounding</TabsTrigger>
        </TabsList>

        <TabsContent value="breathing">
          <BreathingExercise />
        </TabsContent>

        <TabsContent value="grounding">
          <GroundingExercise />
        </TabsContent>
      </Tabs>
    </div>
  );
}
