import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '@/store/useEntries';

const EMOTIONS = [
  { label: 'Anxious', emoji: '😰' },
  { label: 'Overwhelmed', emoji: '😩' },
  { label: 'Angry', emoji: '😠' },
  { label: 'Guilty', emoji: '😔' },
  { label: 'Hopeless', emoji: '😞' },
  { label: 'Frustrated', emoji: '😤' },
  { label: 'Scared', emoji: '😨' },
  { label: 'Ashamed', emoji: '😳' },
];

interface EmotionRating {
  label: string;
  emoji: string;
  intensity: number;
}

interface ThoughtRecordData {
  situation: string;
  emotionsBefore: EmotionRating[];
  automaticThought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  emotionsAfter: EmotionRating[];
}

const STEPS = [
  { title: 'Situation', prompt: 'What happened?' },
  { title: 'Emotions', prompt: 'How did it make you feel?' },
  { title: 'Automatic Thought', prompt: 'What went through your mind?' },
  { title: 'Evidence For', prompt: 'What supports this thought?' },
  { title: 'Evidence Against', prompt: 'What contradicts it?' },
  { title: 'Balanced Thought', prompt: 'A more realistic perspective...' },
  { title: 'Re-rate', prompt: 'How do you feel now?' },
];

export default function ThoughtRecord() {
  const navigate = useNavigate();
  const { createEntry } = useEntries();
  const [step, setStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<ThoughtRecordData>({
    situation: '',
    emotionsBefore: [],
    automaticThought: '',
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    emotionsAfter: [],
  });

  const toggleEmotion = (emotion: typeof EMOTIONS[0], list: 'emotionsBefore' | 'emotionsAfter') => {
    setData(prev => {
      const existing = prev[list].find(e => e.label === emotion.label);
      if (existing) {
        return { ...prev, [list]: prev[list].filter(e => e.label !== emotion.label) };
      }
      return { ...prev, [list]: [...prev[list], { ...emotion, intensity: 5 }] };
    });
  };

  const setIntensity = (label: string, intensity: number, list: 'emotionsBefore' | 'emotionsAfter') => {
    setData(prev => ({
      ...prev,
      [list]: prev[list].map(e => e.label === label ? { ...e, intensity } : e),
    }));
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return data.situation.trim().length > 0;
      case 1: return data.emotionsBefore.length > 0;
      case 2: return data.automaticThought.trim().length > 0;
      case 3: return data.evidenceFor.trim().length > 0;
      case 4: return data.evidenceAgainst.trim().length > 0;
      case 5: return data.balancedThought.trim().length > 0;
      case 6: return data.emotionsAfter.length > 0;
      default: return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const formatEmotions = (emotions: EmotionRating[]) =>
      emotions.map(e => `${e.emoji} ${e.label}: ${e.intensity}/10`).join('\n');

    const text = [
      '📋 Thought Record',
      '',
      '📍 Situation:',
      data.situation,
      '',
      '😶 Initial Emotions:',
      formatEmotions(data.emotionsBefore),
      '',
      '💭 Automatic Thought:',
      data.automaticThought,
      '',
      '✅ Evidence For:',
      data.evidenceFor,
      '',
      '❌ Evidence Against:',
      data.evidenceAgainst,
      '',
      '⚖️ Balanced Thought:',
      data.balancedThought,
      '',
      '🔄 Re-rated Emotions:',
      formatEmotions(data.emotionsAfter),
    ].join('\n');

    await createEntry({
      text,
      templateId: 'thought-record',
      tags: ['thought-record', 'cbt'],
      hasAudio: false,
      hasDrawing: false,
    });

    setSaving(false);
    navigate('/calendar');
  };

  const progress = showSummary ? 100 : ((step + 1) / STEPS.length) * 100;

  const EmotionPicker = ({ list }: { list: 'emotionsBefore' | 'emotionsAfter' }) => {
    const selected = data[list];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(emotion => {
            const isSelected = selected.some(e => e.label === emotion.label);
            return (
              <button
                key={emotion.label}
                onClick={() => toggleEmotion(emotion, list)}
                className={`
                  px-3 py-2 rounded-full text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                {emotion.emoji} {emotion.label}
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="space-y-3 mt-4">
            {selected.map(emotion => (
              <div key={emotion.label} className="flex items-center gap-3">
                <span className="text-sm min-w-[100px]">{emotion.emoji} {emotion.label}</span>
                <Slider
                  value={[emotion.intensity]}
                  onValueChange={([v]) => setIntensity(emotion.label, v, list)}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">{emotion.intensity}/10</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SummaryView = () => {
    const getShift = (label: string) => {
      const before = data.emotionsBefore.find(e => e.label === label);
      const after = data.emotionsAfter.find(e => e.label === label);
      if (!before || !after) return null;
      return { before: before.intensity, after: after.intensity, diff: before.intensity - after.intensity };
    };

    const allLabels = [...new Set([...data.emotionsBefore.map(e => e.label), ...data.emotionsAfter.map(e => e.label)])];

    const improved = allLabels.some(label => {
      const shift = getShift(label);
      return shift && shift.diff > 0;
    });

    return (
      <div className="space-y-5">
        <div className="text-center">
          <Brain className="w-10 h-10 mx-auto text-primary mb-2" />
          <h2 className="text-lg font-semibold text-foreground">Thought Record Complete</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {improved ? "Here's how your emotions shifted" : "You showed up for yourself — that matters"}
          </p>
        </div>

        {!improved && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
            <p className="text-sm text-foreground">
              It's completely normal not to feel better right away. Noticing your thought patterns is the most important step in CBT.
            </p>
            <p className="text-xs text-muted-foreground">
              Change builds over time with practice. You've already done the hardest part.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate('/breathe')}
            >
              Try a Grounding or Breathing Exercise
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {allLabels.map(label => {
            const shift = getShift(label);
            const emotion = EMOTIONS.find(e => e.label === label);
            if (!shift) return null;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm min-w-[100px]">{emotion?.emoji} {label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{shift.before}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className={`text-xs font-mono font-bold ${shift.diff > 0 ? 'text-primary' : shift.diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {shift.after}
                  </span>
                  {shift.diff > 0 && (
                    <span className="text-[10px] text-primary flex items-center gap-0.5">
                      <ChevronDown className="w-3 h-3" /> -{shift.diff}
                    </span>
                  )}
                  {shift.diff < 0 && (
                    <span className="text-[10px] text-destructive flex items-center gap-0.5">
                      <ChevronUp className="w-3 h-3" /> +{Math.abs(shift.diff)}
                    </span>
                  )}
                  {shift.diff === 0 && (
                    <span className="text-[10px] text-muted-foreground">no change</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Balanced Thought</p>
          <p className="text-sm text-foreground italic">"{data.balancedThought}"</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save to Journal'}
        </Button>
      </div>
    );
  };

  const renderStep = () => {
    if (showSummary) return <SummaryView />;

    switch (step) {
      case 0:
        return (
          <Textarea
            value={data.situation}
            onChange={e => setData(prev => ({ ...prev, situation: e.target.value }))}
            placeholder="Describe what happened..."
            className="min-h-[120px] bg-card border-border"
            autoFocus
          />
        );
      case 1:
        return <EmotionPicker list="emotionsBefore" />;
      case 2:
        return (
          <Textarea
            value={data.automaticThought}
            onChange={e => setData(prev => ({ ...prev, automaticThought: e.target.value }))}
            placeholder="What thought popped into your head?"
            className="min-h-[120px] bg-card border-border"
            autoFocus
          />
        );
      case 3:
        return (
          <Textarea
            value={data.evidenceFor}
            onChange={e => setData(prev => ({ ...prev, evidenceFor: e.target.value }))}
            placeholder="What facts support this thought?"
            className="min-h-[120px] bg-card border-border"
            autoFocus
          />
        );
      case 4:
        return (
          <Textarea
            value={data.evidenceAgainst}
            onChange={e => setData(prev => ({ ...prev, evidenceAgainst: e.target.value }))}
            placeholder="What evidence goes against this thought?"
            className="min-h-[120px] bg-card border-border"
            autoFocus
          />
        );
      case 5:
        return (
          <Textarea
            value={data.balancedThought}
            onChange={e => setData(prev => ({ ...prev, balancedThought: e.target.value }))}
            placeholder="Write a more balanced, realistic thought..."
            className="min-h-[120px] bg-card border-border"
            autoFocus
          />
        );
      case 6:
        return <EmotionPicker list="emotionsAfter" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-background px-5"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <button
            onClick={() => {
              if (showSummary) { setShowSummary(false); return; }
              if (step > 0) setStep(step - 1);
              else navigate(-1);
            }}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Thought Record</h1>
            {!showSummary && (
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {STEPS.length} · {STEPS[step].title}
              </p>
            )}
          </div>
        </header>

        {/* Progress */}
        <Progress value={progress} className="h-1.5" />

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showSummary ? 'summary' : step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {!showSummary && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">{STEPS[step].prompt}</h2>
              </div>
            )}

            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {!showSummary && (
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (step < STEPS.length - 1) setStep(step + 1);
                else setShowSummary(true);
              }}
              disabled={!canAdvance()}
              className="flex-1"
            >
              {step === STEPS.length - 1 ? 'See Summary' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
