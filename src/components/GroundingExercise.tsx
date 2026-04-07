import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Fingerprint, Headphones, Wind, Cherry, ChevronRight, RotateCcw, Check, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { sense: 'See', count: 5, icon: Scan, prompt: 'Notice 5 things you can see' },
  { sense: 'Touch', count: 4, icon: Fingerprint, prompt: 'Notice 4 things you can touch' },
  { sense: 'Hear', count: 3, icon: Headphones, prompt: 'Notice 3 things you can hear' },
  { sense: 'Smell', count: 2, icon: Wind, prompt: 'Notice 2 things you can smell' },
  { sense: 'Taste', count: 1, icon: Cherry, prompt: 'Notice 1 thing you can taste' },
] as const;

const COMPLETIONS = [
  "You're grounded. You're safe.",
  'Well done — you brought yourself back to the present.',
  'Take a deep breath. You did great.',
];

export default function GroundingExercise() {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tapped, setTapped] = useState<number[]>(STEPS.map(() => 0));
  const [notes, setNotes] = useState<string[]>(STEPS.map(() => ''));
  const [showNote, setShowNote] = useState<boolean[]>(STEPS.map(() => false));
  const [done, setDone] = useState(false);

  const step = STEPS[stepIndex];
  const progress = (stepIndex / STEPS.length) * 100;
  const canAdvance = tapped[stepIndex] >= step.count;

  const advance = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      setDone(true);
    }
  }, [stepIndex]);

  const reset = useCallback(() => {
    setStarted(false);
    setStepIndex(0);
    setTapped(STEPS.map(() => 0));
    setNotes(STEPS.map(() => ''));
    setShowNote(STEPS.map(() => false));
    setDone(false);
  }, []);

  const handleTap = () => {
    setTapped(prev => {
      const copy = [...prev];
      if (copy[stepIndex] < step.count) copy[stepIndex]++;
      return copy;
    });
  };

  const toggleNote = () => {
    setShowNote(prev => {
      const copy = [...prev];
      copy[stepIndex] = !copy[stepIndex];
      return copy;
    });
  };

  const updateNote = (value: string) => {
    setNotes(prev => {
      const copy = [...prev];
      copy[stepIndex] = value;
      return copy;
    });
  };

  // Intro screen
  if (!started) {
    return (
      <div className="flex flex-col items-center text-center gap-5 px-6 py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <Scan className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground">5-4-3-2-1 Grounding</h2>
        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
          Engage your five senses to anchor yourself in the present moment.
        </p>
        <Button onClick={() => setStarted(true)} className="rounded-full px-6 mt-2" size="sm">
          Begin Exercise
        </Button>
      </div>
    );
  }

  // Completion screen
  if (done) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center text-center gap-6 px-6 py-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
        >
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">All done</h2>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          {COMPLETIONS[Math.floor(Math.random() * COMPLETIONS.length)]}
        </p>
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Start Over
        </Button>
      </motion.div>
    );
  }

  const Icon = step.icon;
  const count = tapped[stepIndex];
  const total = step.count;

  return (
    <div className="flex flex-col items-center px-6 pt-2 pb-4 gap-5">
      {/* Progress */}
      <div className="w-full max-w-[300px]">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Step {stepIndex + 1} of {STEPS.length}</span>
          <span>{step.sense}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          className="flex flex-col items-center gap-4 w-full max-w-[300px]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          >
            <Icon className="w-7 h-7 text-primary" />
          </div>

          {/* Prompt */}
          <p className="text-sm font-medium text-foreground text-center">{step.prompt}</p>

          {/* Tap counter dots */}
          <div className="flex items-center gap-2.5">
            {Array.from({ length: total }).map((_, i) => (
              <motion.div
                key={i}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: i < count
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
                }}
                whileTap={{ scale: 0.9 }}
                animate={i < count ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.2 }}
                onClick={i === count ? handleTap : undefined}
              >
                {i < count && <Check className="w-4 h-4 text-primary-foreground" />}
              </motion.div>
            ))}
          </div>

          {/* Tap instruction */}
          <p className="text-xs text-muted-foreground">
            {count < total
              ? `Tap when you notice each one (${count}/${total})`
              : 'All noticed ✓'}
          </p>

          {/* Optional note toggle */}
          <button
            onClick={toggleNote}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <PenLine className="w-3 h-3" />
            {showNote[stepIndex] ? 'Hide notes' : 'Want to write them down?'}
          </button>

          {/* Optional note input */}
          <AnimatePresence>
            {showNote[stepIndex] && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  value={notes[stepIndex]}
                  onChange={e => updateNote(e.target.value)}
                  placeholder={`What do you ${step.sense.toLowerCase()}?`}
                  className="h-9 text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <Button
        onClick={advance}
        disabled={!canAdvance}
        className="gap-2 rounded-full px-6"
        size="sm"
      >
        {stepIndex === STEPS.length - 1 ? 'Done' : 'Next'}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
