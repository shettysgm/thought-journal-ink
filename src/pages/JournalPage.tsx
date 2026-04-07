import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import templateFreeWrite from '@/assets/template-free-write.png';
import templateVoice from '@/assets/template-voice.png';
import templateGratitude from '@/assets/template-gratitude.png';
import templateMood from '@/assets/template-mood.png';
import templateCbt from '@/assets/template-cbt.png';
import templateWinddown from '@/assets/template-winddown.png';
import journalHeaderBg from '@/assets/journal-header-bg.png';

const TEMPLATES = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    subtitle: 'How was your day, really?',
    description: 'Pause, breathe, and reflect on the moments that shaped today.',
    path: '/unified',
    image: templateFreeWrite,
    gradient: 'from-stone-200 to-stone-300',
    bgAccent: 'bg-stone-50 dark:bg-stone-900/30',
    borderAccent: 'border-stone-200 dark:border-stone-700/40',
  },
  {
    id: 'anxiety-dump',
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    description: 'Unload your racing thoughts — no filter, no judgment.',
    path: '/unified',
    image: templateVoice,
    gradient: 'from-neutral-200 to-neutral-300',
    bgAccent: 'bg-neutral-50 dark:bg-neutral-900/30',
    borderAccent: 'border-neutral-200 dark:border-neutral-700/40',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    description: 'Capture moments of joy — big or small — to shift your focus.',
    path: '/unified',
    image: templateGratitude,
    gradient: 'from-zinc-200 to-zinc-300',
    bgAccent: 'bg-zinc-50 dark:bg-zinc-900/30',
    borderAccent: 'border-zinc-200 dark:border-zinc-700/40',
  },
  {
    id: 'mood-checkin',
    title: 'Mood Check-in',
    subtitle: 'How are you really?',
    description: 'Quick emotional pulse — rate your mood and add a note.',
    path: '/unified',
    image: templateMood,
    gradient: 'from-slate-200 to-slate-300',
    bgAccent: 'bg-slate-50 dark:bg-slate-900/30',
    borderAccent: 'border-slate-200 dark:border-slate-700/40',
  },
  {
    id: 'late-night',
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    description: 'When the world sleeps but your mind doesn\'t — write here.',
    path: '/unified',
    image: templateWinddown,
    gradient: 'from-stone-300 to-stone-400',
    bgAccent: 'bg-stone-50 dark:bg-stone-900/30',
    borderAccent: 'border-stone-200 dark:border-stone-700/40',
  },
  {
    id: 'thought-record',
    title: 'Thought Record',
    subtitle: 'CBT worksheet',
    description: 'Examine a thought step-by-step and find a balanced perspective.',
    path: '/thought-record',
    image: templateCbt,
    gradient: 'from-sky-200 to-sky-300',
    bgAccent: 'bg-sky-50 dark:bg-sky-900/30',
    borderAccent: 'border-sky-200 dark:border-sky-700/40',
  },
  {
    id: 'activity-plan',
    title: 'Activity Planner',
    subtitle: 'Break the cycle',
    description: 'Schedule a small, meaningful activity to boost your mood.',
    path: '/activity-plan',
    image: templateMood,
    gradient: 'from-emerald-200 to-emerald-300',
    bgAccent: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderAccent: 'border-emerald-200 dark:border-emerald-700/40',
  },
];
export default function JournalPage() {
  return (
    <div
      className="min-h-screen bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))'
      }}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Journal</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pick a template to start</p>
          </div>
          <Link
            to="/calendar"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </Link>
        </header>

        {/* Template Grid */}
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((template) => (
            <Link key={template.id} to={`${template.path}?template=${template.id}`} className="block">
              <div
                className={`
                  relative rounded-2xl border overflow-hidden
                  ${template.bgAccent} ${template.borderAccent}
                  hover:shadow-lg active:scale-[0.97] transition-all duration-200
                  cursor-pointer group h-full
                `}
              >
                {/* Gradient accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${template.gradient}`} />

                <div className="p-4 flex flex-col gap-2">
                  {/* Illustrated icon */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                    <img
                      src={template.image}
                      alt={template.title}
                      loading="lazy"
                      width={512}
                      height={512}
                      className="w-14 h-14 object-contain"
                    />
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{template.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{template.subtitle}</p>
                  </div>

                  <p className="text-[10px] text-muted-foreground/80 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex justify-end mt-auto">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/60 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}