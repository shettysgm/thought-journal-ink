import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import templateFreeWrite from '@/assets/template-free-write.png';
import templateVoice from '@/assets/template-voice.png';
import templateGratitude from '@/assets/template-gratitude.png';
import templateMood from '@/assets/template-mood.png';
import templateCbt from '@/assets/template-cbt.png';
import templateWinddown from '@/assets/template-winddown.png';

const TEMPLATES = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    subtitle: 'How was your day, really?',
    path: '/unified',
    image: templateFreeWrite,
    accent: 'from-violet-100 to-purple-50',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    pill: 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50',
  },
  {
    id: 'anxiety-dump',
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    path: '/unified',
    image: templateVoice,
    accent: 'from-rose-100 to-pink-50',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    pill: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    path: '/unified',
    image: templateGratitude,
    accent: 'from-amber-100 to-orange-50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    pill: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50',
  },
  {
    id: 'late-night',
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    path: '/unified',
    image: templateWinddown,
    accent: 'from-indigo-100 to-slate-50',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    pill: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50',
  },
  {
    id: 'thought-record',
    title: 'Thought Record',
    subtitle: 'CBT worksheet',
    path: '/thought-record',
    image: templateCbt,
    accent: 'from-sky-100 to-blue-50',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    pill: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50',
  },
  {
    id: 'activity-plan',
    title: 'Activity Planner',
    subtitle: 'Break the cycle',
    path: '/activity-plan',
    image: templateMood,
    accent: 'from-emerald-100 to-teal-50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    pill: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50',
  },
];

export default function JournalPage() {
  return (
    <div
      className="min-h-screen bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg mx-auto space-y-5">
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

        {/* Featured card — first template gets a wide hero layout */}
        <Link to={`${TEMPLATES[0].path}?template=${TEMPLATES[0].id}`} className="block">
          <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${TEMPLATES[0].accent} border border-border/40 hover:shadow-xl active:scale-[0.98] transition-all duration-200 group`}>
            <div className="flex items-center gap-4 p-5">
              <div className={`w-16 h-16 rounded-2xl ${TEMPLATES[0].iconBg} flex items-center justify-center shrink-0`}>
                <img src={TEMPLATES[0].image} alt={TEMPLATES[0].title} className="w-12 h-12 object-contain" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground">{TEMPLATES[0].title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{TEMPLATES[0].subtitle}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </Link>

        {/* Grid — remaining templates */}
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.slice(1).map((template) => (
            <Link key={template.id} to={`${template.path}?template=${template.id}`} className="block">
              <div className="relative rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 group h-full bg-card">

                <div className="relative p-4 flex flex-col items-center text-center gap-3 min-h-[160px]">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${template.iconBg} flex items-center justify-center mt-1`}>
                    <img
                      src={template.image}
                      alt={template.title}
                      loading="lazy"
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{template.title}</h3>
                    <p className={`text-[10px] font-medium mt-1.5 px-2 py-0.5 rounded-full inline-block ${template.pill}`}>
                      {template.subtitle}
                    </p>
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
