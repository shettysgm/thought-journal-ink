import { create } from 'zustand';
import { DistortionMeta, QuizQuestion } from '@/types';
import { 
  saveDistortionMeta, 
  getAllDistortions,
  getDistortionsByDateRange,
  getDistortionsByType 
} from '@/lib/idb';

interface DistortionsState {
  distortions: DistortionMeta[];
  loading: boolean;
  error: string | null;
  loadDistortions: () => Promise<void>;
  addDistortion: (distortion: Omit<DistortionMeta, 'id'>) => Promise<void>;
  getDistortionsByRange: (startDate: string, endDate: string) => Promise<DistortionMeta[]>;
  generateQuizQuestions: (count?: number) => QuizQuestion[];
}

export const useDistortions = create<DistortionsState>((set, get) => ({
  distortions: [],
  loading: false,
  error: null,

  loadDistortions: async () => {
    set({ loading: true, error: null });
    try {
      const distortions = await getAllDistortions();
      set({ distortions, loading: false });
    } catch (error) {
      set({ error: 'Failed to load distortions', loading: false });
    }
  },

  addDistortion: async (distortionData) => {
    const id = crypto.randomUUID();
    const distortion: DistortionMeta = {
      id,
      ...distortionData,
    };
    
    await saveDistortionMeta(distortion);
    
    set(state => ({ 
      distortions: [...state.distortions, distortion].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));
  },

  getDistortionsByRange: async (startDate: string, endDate: string) => {
    return await getDistortionsByDateRange(startDate, endDate);
  },

  generateQuizQuestions: (count = 5) => {
    const { distortions } = get();
    
    // Fallback sample questions when not enough personal distortion data
    const SAMPLE_QUESTIONS: QuizQuestion[] = [
      { id: 'sample-1', phrase: "I always mess everything up.", correctAnswer: 'Overgeneralization', options: ['Overgeneralization', 'Mind Reading', 'Catastrophizing', 'Personalization'], explanation: 'Using "always" to generalize from one event to all situations is overgeneralization.' },
      { id: 'sample-2', phrase: "She didn't text back — she must hate me.", correctAnswer: 'Mind Reading', options: ['Mind Reading', 'All-or-Nothing Thinking', 'Jumping to Conclusions', 'Emotional Reasoning'], explanation: 'Assuming you know what someone else is thinking without evidence is mind reading.' },
      { id: 'sample-3', phrase: "If I fail this test, my life is over.", correctAnswer: 'Catastrophizing', options: ['Catastrophizing', 'Overgeneralization', 'Disqualifying the Positive', 'Should Statements'], explanation: 'Imagining the worst possible outcome from a single event is catastrophizing.' },
      { id: 'sample-4', phrase: "I should always be productive.", correctAnswer: 'Should Statements', options: ['Should Statements', 'All-or-Nothing Thinking', 'Labeling', 'Mental Filter'], explanation: 'Rigid rules about how you "should" behave create unnecessary pressure and guilt.' },
      { id: 'sample-5', phrase: "I got a compliment but they were just being nice.", correctAnswer: 'Disqualifying the Positive', options: ['Disqualifying the Positive', 'Mind Reading', 'Personalization', 'Emotional Reasoning'], explanation: 'Dismissing positive experiences by insisting they don\'t count is disqualifying the positive.' },
      { id: 'sample-6', phrase: "Everything is either perfect or a total failure.", correctAnswer: 'All-or-Nothing Thinking', options: ['All-or-Nothing Thinking', 'Catastrophizing', 'Overgeneralization', 'Mental Filter'], explanation: 'Seeing things in only two categories instead of on a continuum is all-or-nothing thinking.' },
      { id: 'sample-7', phrase: "I feel stupid, so I must be stupid.", correctAnswer: 'Emotional Reasoning', options: ['Emotional Reasoning', 'Labeling', 'Mind Reading', 'Should Statements'], explanation: 'Assuming that your emotions reflect reality is emotional reasoning.' },
      { id: 'sample-8', phrase: "The project failed because of me.", correctAnswer: 'Personalization', options: ['Personalization', 'Overgeneralization', 'Catastrophizing', 'Mental Filter'], explanation: 'Blaming yourself entirely for something that involved multiple factors is personalization.' },
    ];

    // Try to generate from personal data first
    if (distortions.length >= count) {
      const typeGroups = distortions.reduce((acc, d) => {
        if (!acc[d.type]) acc[d.type] = [];
        acc[d.type].push(d);
        return acc;
      }, {} as Record<string, DistortionMeta[]>);

      const types = Object.keys(typeGroups);
      if (types.length >= 2) {
        const questions: QuizQuestion[] = [];
        
        for (let i = 0; i < count && i < distortions.length; i++) {
          const randomDistortion = distortions[Math.floor(Math.random() * distortions.length)];
          const correctAnswer = randomDistortion.type;
          
          const otherTypes = types.filter(t => t !== correctAnswer);
          const distractors = otherTypes
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
          
          if (distractors.length < 2) continue;
          
          const options = [correctAnswer, ...distractors]
            .sort(() => 0.5 - Math.random());
          
          questions.push({
            id: crypto.randomUUID(),
            phrase: randomDistortion.phrase,
            correctAnswer,
            options,
            explanation: `This is an example of ${correctAnswer} because it involves making assumptions without sufficient evidence.`
          });
        }
        
        if (questions.length >= count) return questions;
      }
    }

    // Fallback: use sample questions
    const shuffled = [...SAMPLE_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },
}));