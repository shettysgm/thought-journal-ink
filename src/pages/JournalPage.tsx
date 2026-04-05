import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'free-write',
    title: 'Free Write',
    subtitle: 'No rules, just you',
    description: 'Write whatever comes to mind — no prompts, no pressure.',
    path: '/unified',
    emoji: '✍️',
    gradient: 'from-teal-400 to-cyan-500',
    bgAccent: 'bg-teal-50 dark:bg-teal-950/30',
    borderAccent: 'border-teal-200 dark:border-teal-800/40',
    iconBg: 'bg-teal-500/15',
  },
  {
    id: 'voice',
    title: 'Voice Note',
    subtitle: 'Speak your mind',
    description: 'Talk it out — we\'ll transcribe and help you reflect.',
    path: '/unified',
    emoji: '🎙️',
    gradient: 'from-violet-400 to-purple-500',
    bgAccent: 'bg-violet-50 dark:bg-violet-950/30',
    borderAccent: 'border-violet-200 dark:border-violet-800/40',
    iconBg: 'bg-violet-500/15',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    description: 'Capture moments of joy — big or small — to shift your focus.',
    path: '/unified',
    emoji: '🌸',
    gradient: 'from-pink-400 to-rose-500',
    bgAccent: 'bg-pink-50 dark:bg-pink-950/30',
    borderAccent: 'border-pink-200 dark:border-pink-800/40',
    iconBg: 'bg-pink-500/15',
  },
  {
    id: 'mood-checkin',
    title: 'Mood Check-in',
    subtitle: 'How are you really?',
    description: 'Quick emotional pulse — rate your mood and add a note.',
    path: '/unified',
    emoji: '🌈',
    gradient: 'from-amber-400 to-orange-500',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
    borderAccent: 'border-amber-200 dark:border-amber-800/40',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'thought-record',
    title: 'CBT Thought Record',
    subtitle: 'Challenge your thoughts',
    description: 'Situation → Thought → Emotion → Reframe. Structured reflection.',
    path: '/unified',
    emoji: '🧠',
    gradient: 'from-blue-400 to-indigo-500',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/30',
    borderAccent: 'border-blue-200 dark:border-blue-800/40',
    iconBg: 'bg-blue-500/15',
  },
  {
    id: 'wind-down',
    title: 'Wind Down',
    subtitle: 'End the day gently',
    description: 'Reflect on your day, release tension, and set tomorrow\'s intention.',
    path: '/unified',
    emoji: '🌙',
    gradient: 'from-indigo-400 to-slate-500',
    bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderAccent: 'border-indigo-200 dark:border-indigo-800/40',
    iconBg: 'bg-indigo-500/15',
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

                <div className="p-4 flex flex-col gap-2.5">
                  {/* Emoji icon */}
                  <div className={`w-11 h-11 rounded-xl ${template.iconBg} flex items-center justify-center text-2xl`}>
                    {template.emoji}
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