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
    
    if (distortions.length < count) {
      return [];
    }

    // Get unique distortion types
    const typeGroups = distortions.reduce((acc, d) => {
      if (!acc[d.type]) acc[d.type] = [];
      acc[d.type].push(d);
      return acc;
    }, {} as Record<string, DistortionMeta[]>);

    const types = Object.keys(typeGroups);
    if (types.length < 2) return [];

    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < count && i < distortions.length; i++) {
      const randomDistortion = distortions[Math.floor(Math.random() * distortions.length)];
      const correctAnswer = randomDistortion.type;
      
      // Generate distractors (wrong answers)
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
    
    return questions;
  },
}));