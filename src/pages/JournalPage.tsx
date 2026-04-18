import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
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
  },
  {
    id: 'anxiety-dump',
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    path: '/unified',
    image: templateVoice,
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    subtitle: '3 good things today',
    path: '/unified',
    image: templateGratitude,
  },
  {
    id: 'late-night',
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    path: '/unified',
    image: templateWinddown,
  },
  {
    id: 'thought-record',
    title: 'Thought Record',
    subtitle: 'CBT worksheet',
    path: '/thought-record',
    image: templateCbt,
  },
  {
    id: 'activity-plan',
    title: 'Activity Planner',
    subtitle: 'Break the cycle',
    path: '/activity-plan',
    image: templateMood,
  },
];

export default function JournalPage() {
  return (
    <div
      className="min-h-screen bg-white dark:bg-background px-5 pb-24"
      style={{
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      <div className="max-w-lg md:max-w-2xl mx-auto space-y-6">
        {/* Header — matches Home/Settings */}
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

        {/* Template cards — themed to match Settings/Home */}
        <div className="space-y-3">
          {TEMPLATES.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`${template.path}?template=${template.id}`} className="block group">
                <Card className="rounded-2xl border border-border/50 shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-200">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 flex items-center justify-center shrink-0">
                      <img
                        src={template.image}
                        alt={template.title}
                        className="w-20 h-20 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {template.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {template.subtitle}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
