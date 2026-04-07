import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

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
  const recordPromptUsed = useGameStore((s) => s.recordPromptUsed);
  const prompt = getDailyPrompt();

  const handleClick = () => {
    recordPromptUsed();
    navigate(`/unified?template=daily-prompt&promptText=${encodeURIComponent(prompt)}`);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 group cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0">
          <Lightbulb className="w-7 h-7 text-accent-strong" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground">Today's Prompt</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{prompt}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
          <ArrowRight className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
