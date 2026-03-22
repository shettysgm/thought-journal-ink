import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const PROMPTS = [
  "What's one thing you're grateful for today?",
  "What emotion are you feeling right now? Why?",
  "What's a negative thought you had today? Can you reframe it?",
  "Describe one small win from today.",
  "What's something you're worried about? Is it based on facts or assumptions?",
  "Write about a moment today when you felt at peace.",
  "What would you tell a friend in your situation right now?",
  "What pattern of thinking do you notice this week?",
  "Describe something kind someone did for you recently.",
  "What's one thing you can let go of today?",
  "If your anxiety could talk, what would it say? How would you respond?",
  "What's a belief you hold about yourself — is it truly accurate?",
  "Write about a challenge you overcame recently.",
  "What boundary do you need to set or reinforce?",
  "Name three things that went well today, no matter how small.",
  "What's draining your energy? What's giving you energy?",
  "Describe how your body feels right now — any tension or ease?",
  "What's a should statement you caught yourself thinking?",
  "Write a compassionate letter to yourself about a recent struggle.",
  "What are you looking forward to this week?",
  "What would 'good enough' look like today instead of perfect?",
];

function getDailyPrompt(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

export default function DailyPrompt() {
  const navigate = useNavigate();
  const prompt = getDailyPrompt();

  return (
    <Card
      className="cursor-pointer border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md bg-primary/5"
      onClick={() => navigate('/unified')}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center shrink-0 shadow-sm">
          <Lightbulb className="w-6 h-6 text-amber-300" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Today's Prompt</p>
          <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
        </div>
      </CardContent>
    </Card>
  );
}
