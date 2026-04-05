import { Link } from 'react-router-dom';
import { PenLine, CalendarDays, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TEMPLATES = [
  {
    id: 'free-write',
    title: 'Free Write',
    description: 'Open-ended journaling — write whatever is on your mind with no structure or prompts.',
    icon: PenLine,
    path: '/unified',
    emoji: '✍️',
  },
  {
    id: 'voice',
    title: 'Voice Note',
    description: 'Record your thoughts out loud and let the app transcribe and analyze them.',
    icon: Mic,
    path: '/unified',
    emoji: '🎙️',
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
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Journal</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Choose how you want to journal today</p>
          </div>
          <Link
            to="/calendar"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </Link>
        </header>

        {/* Templates */}
        <div className="space-y-3">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Link key={template.id} to={template.path}>
                <Card className="shadow-soft hover:shadow-medium transition-all active:scale-[0.98] cursor-pointer border-border/60">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
                      {template.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{template.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                    </div>
                    <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}