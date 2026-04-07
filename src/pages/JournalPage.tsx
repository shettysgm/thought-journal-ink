import { Link } from 'react-router-dom';
import { 
  CalendarDays, ArrowRight, BookOpen, CloudLightning, 
  Heart, Moon, Brain, Zap, type LucideIcon 
} from 'lucide-react';

interface TemplateItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  pill: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    subtitle: 'How was your day, really?',
    path: '/unified',
    icon: BookOpen,
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    pill: 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50',
  },
  {
    id: 'anxiety-dump',
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    path: '/unified',
    icon: CloudLightning,
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    pill: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    path: '/unified',
    icon: Heart,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    pill: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50',
  },
  {
    id: 'late-night',
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    path: '/unified',
    icon: Moon,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    pill: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50',
  },
  {
    id: 'thought-record',
    title: 'Thought Record',
    subtitle: 'CBT worksheet',
    path: '/thought-record',
    icon: Brain,
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    pill: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50',
  },
  {
    id: 'activity-plan',
    title: 'Activity Planner',
    subtitle: 'Break the cycle',
    path: '/activity-plan',
    icon: Zap,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    pill: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50',
  },
];

export default function JournalPage() {
  const gridTemplates = TEMPLATES.slice(1);
  const lastIsAlone = gridTemplates.length % 2 === 1;

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

        {/* Featured hero card */}
        {(() => {
          const hero = TEMPLATES[0];
          const HeroIcon = hero.icon;
          return (
            <Link to={`${hero.path}?template=${hero.id}`} className="block">
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border/40 hover:shadow-xl active:scale-[0.98] transition-all duration-200 group">
                <div className="flex items-center gap-4 p-5">
                  <div className={`w-14 h-14 rounded-2xl ${hero.iconBg} flex items-center justify-center shrink-0`}>
                    <HeroIcon className={`w-6 h-6 ${hero.iconColor}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground">{hero.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{hero.subtitle}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {gridTemplates.map((template, i) => {
            const Icon = template.icon;
            const spanFull = lastIsAlone && i === gridTemplates.length - 1;

            return (
              <Link
                key={template.id}
                to={`${template.path}?template=${template.id}`}
                className={`block ${spanFull ? 'col-span-2' : ''}`}
              >
                {spanFull ? (
                  <div className="relative rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 group bg-card">
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-12 h-12 rounded-xl ${template.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${template.iconColor}`} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{template.title}</h3>
                        <p className={`text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${template.pill}`}>
                          {template.subtitle}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 group h-full bg-card">
                    <div className="p-4 flex flex-col items-center text-center gap-3 min-h-[148px] justify-center">
                      <div className={`w-12 h-12 rounded-xl ${template.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${template.iconColor}`} strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground leading-tight">{template.title}</h3>
                        <p className={`text-[10px] font-medium mt-1.5 px-2 py-0.5 rounded-full inline-block ${template.pill}`}>
                          {template.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
