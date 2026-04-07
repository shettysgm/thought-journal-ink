import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Hand, Ear, Flower, Coffee, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { sense: 'See', count: 5, icon: Eye, prompt: 'Name 5 things you can see', color: 'hsl(var(--primary))' },
  { sense: 'Touch', count: 4, icon: Hand, prompt: 'Name 4 things you can touch', color: 'hsl(var(--accent))' },
  { sense: 'Hear', count: 3, icon: Ear, prompt: 'Name 3 things you can hear', color: 'hsl(var(--primary))' },
  { sense: 'Smell', count: 2, icon: Flower, prompt: 'Name 2 things you can smell', color: 'hsl(var(--accent))' },
  { sense: 'Taste', count: 1, icon: Coffee, prompt: 'Name 1 thing you can taste', color: 'hsl(var(--primary))' },
] as const;

const COMPLETIONS = [
  "You're grounded. You're safe.",
  'Well done — you brought yourself back to the present.',
  'Take a deep breath. You did great.',
];

export default function GroundingExercise() {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [inputs, setInputs] = useState<string[][]>(STEPS.map(s => Array(s.count).fill('')));
  const [done, setDone] = useState(false);

  const step = STEPS[stepIndex];
  const progress = ((stepIndex) / STEPS.length) * 100;

  const canAdvance = inputs[stepIndex].every(v => v.trim().length > 0);

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
    setInputs(STEPS.map(s => Array(s.count).fill('')));
    setDone(false);
  }, []);

  const updateInput = (itemIndex: number, value: string) => {
    setInputs(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[stepIndex][itemIndex] = value;
      return copy;
    });
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center text-center gap-5 px-6 py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
        >
          <Eye className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground">5-4-3-2-1 Grounding</h2>
        <div className="max-w-[280px] space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            When anxiety pulls you out of the present, this technique anchors you back by engaging all five senses.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            It interrupts the fight-or-flight response and redirects your brain toward what's real and safe around you — a clinically backed method for managing panic and overwhelm.
          </p>
        </div>
        <Button onClick={() => setStarted(true)} className="rounded-full px-6 mt-2" size="sm">
          Begin Exercise
        </Button>
      </div>
    );
  }

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
          <Eye className="w-8 h-8 text-primary" />
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

  return (
    <div className="flex flex-col items-center px-6 pt-2 pb-4 gap-6">
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
          className="flex flex-col items-center gap-5 w-full max-w-[300px]"
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

          {/* Inputs */}
          <div className="w-full flex flex-col gap-2.5">
            {inputs[stepIndex].map((val, i) => (
              <Input
                key={i}
                value={val}
                onChange={e => updateInput(i, e.target.value)}
                placeholder={`${step.sense} #${i + 1}`}
                className="h-9 text-sm"
                autoFocus={i === 0}
              />
            ))}
          </div>
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
