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

        {/* All cards — horizontal layout */}
        <div className="space-y-3">
          {TEMPLATES.map((template) => (
            <Link key={template.id} to={`${template.path}?template=${template.id}`} className="block">
              <div className="relative rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 group">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-14 h-14 rounded-2xl ${template.iconBg} flex items-center justify-center shrink-0`}>
                    <img src={template.image} alt={template.title} className="w-12 h-12 object-contain" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground">{template.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.subtitle}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4 text-primary" />
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
