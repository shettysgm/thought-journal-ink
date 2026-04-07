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
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
  {
    id: 'anxiety-dump',
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    path: '/unified',
    image: templateVoice,
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    path: '/unified',
    image: templateGratitude,
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
  {
    id: 'late-night',
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    path: '/unified',
    image: templateWinddown,
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
  {
    id: 'thought-record',
    title: 'Thought Record',
    subtitle: 'CBT worksheet',
    path: '/thought-record',
    image: templateCbt,
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
  {
    id: 'activity-plan',
    title: 'Activity Planner',
    subtitle: 'Break the cycle',
    path: '/activity-plan',
    image: templateMood,
    iconBg: 'bg-transparent',
    pill: 'text-muted-foreground bg-muted',
  },
];

export default function JournalPage() {
  const gridTemplates = TEMPLATES.slice(1);
  const lastIsAlone = gridTemplates.length % 2 === 1;

  return (
    <div
      className="min-h-screen bg-white dark:bg-background px-5 pb-24"
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
        <Link to={`${TEMPLATES[0].path}?template=${TEMPLATES[0].id}`} className="block">
          <div className="relative rounded-2xl overflow-hidden bg-card border-0 shadow-sm hover:shadow-xl active:scale-[0.98] transition-all duration-200 group">
            <div className="flex items-center gap-4 p-5">
              <div className={`w-16 h-16 rounded-2xl ${TEMPLATES[0].iconBg} flex items-center justify-center shrink-0`}>
                <img src={TEMPLATES[0].image} alt={TEMPLATES[0].title} className="w-14 h-14 object-contain" loading="lazy" />
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

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {gridTemplates.map((template, i) => {
            const spanFull = lastIsAlone && i === gridTemplates.length - 1;

            return (
              <Link
                key={template.id}
                to={`${template.path}?template=${template.id}`}
                className={`block ${spanFull ? 'col-span-2' : ''}`}
              >
                {spanFull ? (
                  <div className="relative rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 group bg-card">
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-14 h-14 rounded-xl ${template.iconBg} flex items-center justify-center shrink-0`}>
                        <img src={template.image} alt={template.title} className="w-12 h-12 object-contain" loading="lazy" />
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
                  <div className="relative rounded-2xl border-0 shadow-sm overflow-hidden hover:shadow-lg active:scale-[0.97] transition-all duration-200 group h-full bg-card">
                    <div className="p-4 flex flex-col items-center text-center gap-3 min-h-[148px] justify-center">
                      <div className={`w-16 h-16 rounded-xl ${template.iconBg} flex items-center justify-center`}>
                        <img src={template.image} alt={template.title} loading="lazy" className="w-14 h-14 object-contain" />
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
