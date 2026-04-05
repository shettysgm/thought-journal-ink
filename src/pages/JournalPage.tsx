import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import templateFreeWrite from '@/assets/template-free-write.png';
import templateVoice from '@/assets/template-voice.png';
import templateGratitude from '@/assets/template-gratitude.png';
import templateMood from '@/assets/template-mood.png';
import templateCbt from '@/assets/template-cbt.png';
import templateWinddown from '@/assets/template-winddown.png';

const TEMPLATES = [
  {
    id: 'free-write',
    title: 'Free Write',
    subtitle: 'No rules, just you',
    description: 'Write whatever comes to mind — no prompts, no pressure.',
    path: '/unified',
    image: templateFreeWrite,
    gradient: 'from-teal-400 to-cyan-500',
    bgAccent: 'bg-teal-50 dark:bg-teal-950/30',
    borderAccent: 'border-teal-200 dark:border-teal-800/40',
  },
  {
    id: 'voice',
    title: 'Voice Note',
    subtitle: 'Speak your mind',
    description: 'Talk it out — we\'ll transcribe and help you reflect.',
    path: '/unified',
    image: templateVoice,
    gradient: 'from-violet-400 to-purple-500',
    bgAccent: 'bg-violet-50 dark:bg-violet-950/30',
    borderAccent: 'border-violet-200 dark:border-violet-800/40',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    description: 'Capture moments of joy — big or small — to shift your focus.',
    path: '/unified',
    image: templateGratitude,
    gradient: 'from-pink-400 to-rose-500',
    bgAccent: 'bg-pink-50 dark:bg-pink-950/30',
    borderAccent: 'border-pink-200 dark:border-pink-800/40',
  },
  {
    id: 'mood-checkin',
    title: 'Mood Check-in',
    subtitle: 'How are you really?',
    description: 'Quick emotional pulse — rate your mood and add a note.',
    path: '/unified',
    image: templateMood,
    gradient: 'from-amber-400 to-orange-500',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
    borderAccent: 'border-amber-200 dark:border-amber-800/40',
  },
  {
    id: 'thought-record',
    title: 'CBT Thought Record',
    subtitle: 'Challenge your thoughts',
    description: 'Situation → Thought → Emotion → Reframe.',
    path: '/unified',
    image: templateCbt,
    gradient: 'from-blue-400 to-indigo-500',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/30',
    borderAccent: 'border-blue-200 dark:border-blue-800/40',
  },
  {
    id: 'wind-down',
    title: 'Wind Down',
    subtitle: 'End the day gently',
    description: 'Reflect on your day, release tension, set tomorrow\'s intention.',
    path: '/unified',
    image: templateWinddown,
    gradient: 'from-indigo-400 to-slate-500',
    bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderAccent: 'border-indigo-200 dark:border-indigo-800/40',
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
            <Link key={template.id} to={template.path} className="block">
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