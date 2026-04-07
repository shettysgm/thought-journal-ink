import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Dumbbell, Users, Clock, CalendarDays, CalendarPlus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '@/store/useEntries';
import { useSettings } from '@/store/useSettings';
import { scheduleActivityReminder } from '@/lib/notifications';
import { format, addDays } from 'date-fns';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Down' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const CATEGORIES = [
  {
    id: 'pleasure' as const,
    emoji: '🎨',
    title: 'Pleasure',
    subtitle: 'Things you enjoy',
    icon: Sparkles,
  },
  {
    id: 'mastery' as const,
    emoji: '💪',
    title: 'Mastery',
    subtitle: 'Accomplishment',
    icon: Dumbbell,
  },
  {
    id: 'connection' as const,
    emoji: '🤝',
    title: 'Connection',
    subtitle: 'Social activities',
    icon: Users,
  },
];

const SUGGESTIONS: Record<string, string[]> = {
  pleasure: ['Take a short walk', 'Listen to music', 'Watch something funny', 'Draw or doodle', 'Have a favourite snack'],
  mastery: ['Tidy one small area', 'Reply to a message', 'Do a 5-min workout', 'Learn something new', 'Cook a meal'],
  connection: ['Text a friend', 'Call someone', 'Go to a café', 'Say hi to a neighbour', 'Share a meme'],
};

const TIMINGS = [
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'tomorrow', label: 'Tomorrow', icon: CalendarDays },
  { id: 'this-week', label: 'This Week', icon: CalendarPlus },
];

type Category = 'pleasure' | 'mastery' | 'connection';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function ActivityPlanner() {
  const navigate = useNavigate();
  const { createEntry } = useEntries();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [activity, setActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [timing, setTiming] = useState('');
  const [saving, setSaving] = useState(false);
  const [remindMe, setRemindMe] = useState(true);

  const totalSteps = 5;
  const selectedActivity = activity || customActivity;

  const canAdvance = () => {
    switch (step) {
      case 1: return moodBefore !== null;
      case 2: return category !== null;
      case 3: return selectedActivity.trim().length > 0;
      case 4: return timing !== '';
      default: return true;
    }
  };

  const goNext = () => {
    if (step < totalSteps) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(s => s - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const moodLabel = MOODS.find(m => m.value === moodBefore)?.label || '';
    const catLabel = CATEGORIES.find(c => c.id === category)?.title || '';
    const text = [
      `🎯 Activity Plan`,
      ``,
      `Mood before: ${MOODS.find(m => m.value === moodBefore)?.emoji} ${moodLabel} (${moodBefore}/5)`,
      `Category: ${catLabel}`,
      `Activity: ${selectedActivity}`,
      `When: ${TIMINGS.find(t => t.id === timing)?.label}`,
      ``,
      `Set on ${format(new Date(), 'PPP')}`,
    ].join('\n');

    await createEntry({ text, templateId: 'activity-plan', tags: ['activity-plan', catLabel.toLowerCase()] });

    // Schedule a reminder notification if opted in
    if (remindMe) {
      const { reminderTime } = useSettings.getState();
      const [h, m] = reminderTime ? reminderTime.split(':').map(Number) : [9, 0];
      const now = new Date();
      let targetDate = now;
      if (timing === 'tomorrow') targetDate = addDays(now, 1);
      else if (timing === 'this-week') targetDate = addDays(now, 3);
      await scheduleActivityReminder(selectedActivity, targetDate, h, m);
    }

    navigate('/journal');
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{
        paddingTop: 'max(3rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))',
      }}
    >
      {/* Header */}
      <div className="px-5 flex items-center gap-3 mb-2">
        <button onClick={goBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Activity Planner</h1>
          <p className="text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 px-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">How are you feeling?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Tap to rate your current mood</p>
                </div>
                <div className="flex justify-between gap-2 max-w-xs mx-auto pt-4">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => { setMoodBefore(m.value); setTimeout(goNext, 300); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                        moodBefore === m.value
                          ? 'bg-primary/10 ring-2 ring-primary scale-110'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pick a category</h2>
                  <p className="text-sm text-muted-foreground mt-1">What kind of activity feels right?</p>
                </div>
                <div className="space-y-3 pt-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setActivity(''); setCustomActivity(''); setTimeout(goNext, 300); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                          category === cat.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                          <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                        </div>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && category && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Choose an activity</h2>
                  <p className="text-sm text-muted-foreground mt-1">Pick one or write your own</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTIONS[category].map(s => (
                    <button
                      key={s}
                      onClick={() => { setActivity(s); setCustomActivity(''); setTimeout(goNext, 300); }}
                      className={`px-3 py-2 rounded-xl text-sm transition-all border ${
                        activity === s
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Or type your own activity..."
                    value={customActivity}
                    onChange={e => { setCustomActivity(e.target.value); setActivity(''); }}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">When will you do it?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Pick a timeframe</p>
                </div>
                <div className="space-y-3 pt-2">
                  {TIMINGS.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setTiming(t.id); setTimeout(goNext, 300); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                          timing === t.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Reminder toggle */}
                {timing && (
                  <button
                    onClick={() => setRemindMe(r => !r)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left mt-2 ${
                      remindMe
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Bell className={`w-5 h-5 ${remindMe ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Remind me</span>
                      <p className="text-[11px] text-muted-foreground">
                        {timing === 'today' ? 'Get a nudge today' : timing === 'tomorrow' ? 'Get a nudge tomorrow morning' : 'Get a nudge mid-week'}
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors ${remindMe ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${remindMe ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                )}
              </>
            )}

            {step === 5 && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Review and set your intention</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MOODS.find(m => m.value === moodBefore)?.emoji}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Current mood</p>
                      <p className="text-sm font-medium text-foreground">{MOODS.find(m => m.value === moodBefore)?.label} ({moodBefore}/5)</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORIES.find(c => c.id === category)?.emoji}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="text-sm font-medium text-foreground">{CATEGORIES.find(c => c.id === category)?.title}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Activity</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{selectedActivity}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-3">
                    {(() => { const T = TIMINGS.find(t => t.id === timing); return T ? <T.icon className="w-5 h-5 text-muted-foreground" /> : null; })()}
                    <div>
                      <p className="text-xs text-muted-foreground">When</p>
                      <p className="text-sm font-medium text-foreground">{TIMINGS.find(t => t.id === timing)?.label}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button — only show when needed */}
      <div className="px-5 pt-4">
        {step === 3 && customActivity.trim().length > 0 ? (
          <Button
            onClick={goNext}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            Continue
          </Button>
        ) : step === totalSteps ? (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Set this intention'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
