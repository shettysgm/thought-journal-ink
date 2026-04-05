import templateFreeWrite from '@/assets/template-free-write.png';
import templateVoice from '@/assets/template-voice.png';
import templateGratitude from '@/assets/template-gratitude.png';
import templateMood from '@/assets/template-mood.png';
import templateCbt from '@/assets/template-cbt.png';
import templateWinddown from '@/assets/template-winddown.png';

export interface TemplateConfig {
  title: string;
  subtitle: string;
  emoji: string;
  image: string;
  stickers: { src: string; pos: string }[];
  gradient: string;
  bgAccent: string;
  placeholder: string;
  prompts: string[];
}

export const TEMPLATE_CONFIG: Record<string, TemplateConfig> = {
  'daily-reflection': {
    title: 'Daily Reflection',
    subtitle: 'How was your day, really?',
    emoji: '',
    image: templateFreeWrite,
    stickers: [],
    gradient: 'from-violet-300 to-indigo-400',
    bgAccent: 'bg-violet-50 dark:bg-violet-950/30',
    placeholder: 'What stood out to you today?',
    prompts: ['What made you smile today?', 'What challenged you?', 'What are you grateful for?'],
  },
  'anxiety-dump': {
    title: 'Anxiety Dump',
    subtitle: 'Let it all out',
    emoji: '',
    image: templateVoice,
    stickers: [],
    gradient: 'from-rose-300 to-pink-400',
    bgAccent: 'bg-rose-50 dark:bg-rose-950/30',
    placeholder: "What's racing through your mind right now?",
    prompts: ["What's worrying you most?", "What's the worst that could happen?", 'What would you tell a friend in this situation?'],
  },
  'gratitude': {
    title: 'Gratitude',
    subtitle: '3 good things today',
    emoji: '',
    image: templateGratitude,
    stickers: [],
    gradient: 'from-pink-300 to-rose-400',
    bgAccent: 'bg-pink-50 dark:bg-pink-950/30',
    placeholder: "I'm grateful for...",
    prompts: ['1. Something that made me happy...', '2. Someone I appreciate...', '3. A small moment of joy...'],
  },
  'mood-checkin': {
    title: 'Mood Check-in',
    subtitle: 'How are you really?',
    emoji: '',
    image: templateMood,
    stickers: [],
    gradient: 'from-amber-300 to-orange-400',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
    placeholder: 'How are you feeling right now?',
    prompts: ['Rate your mood (1-10)', "What's influencing your mood?", 'What could make it better?'],
  },
  'thought-reframe': {
    title: 'Thought Reframe',
    subtitle: 'Challenge your thoughts',
    emoji: '',
    image: templateCbt,
    stickers: [],
    gradient: 'from-sky-300 to-blue-400',
    bgAccent: 'bg-sky-50 dark:bg-sky-950/30',
    placeholder: 'What situation is on your mind?',
    prompts: ['What happened?', 'What did you think?', 'How did it make you feel?', 'A kinder perspective...'],
  },
  'late-night': {
    title: 'Late Night Thoughts',
    subtitle: 'For the quiet hours',
    emoji: '',
    image: templateWinddown,
    stickers: [],
    gradient: 'from-indigo-300 to-purple-500',
    bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
    placeholder: "What's keeping you up tonight?",
    prompts: ["What's on your mind?", 'What would help you let go?', 'Tomorrow I want to...'],
  },
  'daily-prompt': {
    title: "Today's Prompt",
    subtitle: 'A thought to explore',
    emoji: '',
    image: templateFreeWrite,
    stickers: [],
    gradient: 'from-amber-200 to-yellow-400',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
    placeholder: 'Start writing your thoughts...',
    prompts: [],
  },
};
