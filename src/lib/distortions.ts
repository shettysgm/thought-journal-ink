import { Hit, DistortionType } from '@/types';

// Cognitive distortion detection rules
export const DISTORTION_RULES: Record<string, RegExp[]> = {
  "All-or-Nothing": [
    /\balways\b/gi,
    /\bnever\b/gi,
    /ruined everything/gi,
    /total failure/gi,
    /completely (useless|incompetent|worthless)/gi,
    /\beveryone\b/gi,
    /\bnothing\b/gi,
    /\bperfect\b/gi
  ],
  "Mind Reading": [
    /they (must|probably) (think|hate)/gi,
    /everyone (thinks|knows)/gi,
    /(he|she|they) must be thinking/gi,
    /I can tell (he|she|they)/gi,
    /obviously (he|she|they)/gi
  ],
  "Fortune Telling": [
    /I['']ll never/gi,
    /I am going to (fail|get fired)/gi,
    /this will (end|go) badly/gi,
    /I know (it|this) will/gi,
    /guaranteed to/gi,
    /bound to (fail|happen)/gi
  ],
  "Should Statements": [
    /\bI should\b/gi,
    /\bI must\b/gi,
    /\bI ought to\b/gi,
    /\bI have to\b/gi,
    /supposed to/gi
  ],
  "Labeling": [
    /\bI('m| am) (stupid|worthless|a loser|an idiot|terrible)\b/gi,
    /\bI('m| am) such a/gi,
    /(he|she|they) (is|are) (such a|totally)/gi
  ],
  "Catastrophizing": [
    /worst case/gi,
    /disaster/gi,
    /nightmare/gi,
    /end of the world/gi,
    /terrible (thing|situation)/gi,
    /can't handle/gi
  ],
  "Mental Filter": [
    /only (see|remember|think about)/gi,
    /can't stop thinking about/gi,
    /all I can focus on/gi,
    /keeps coming back/gi
  ],
  "Emotional Reasoning": [
    /I feel like/gi,
    /because I feel/gi,
    /my gut tells me/gi,
    /I just know/gi,
    /feels true/gi
  ]
};

export const DISTORTION_TYPES: Record<string, DistortionType> = {
  "All-or-Nothing": {
    name: "All-or-Nothing Thinking",
    description: "Seeing things in black and white with no middle ground. Things are either perfect or a complete failure.",
    examples: ["I'm a complete failure", "Everyone hates me", "Nothing ever goes right"],
    reframePrompts: [
      "What evidence do I have for and against this thought?",
      "Is there a middle ground or gray area I'm missing?",
      "Would I say this to a good friend in the same situation?"
    ]
  },
  "Mind Reading": {
    name: "Mind Reading",
    description: "Assuming you know what others are thinking without evidence.",
    examples: ["They think I'm boring", "Everyone can tell I'm nervous", "She must hate me"],
    reframePrompts: [
      "What actual evidence do I have for what they're thinking?",
      "Could there be other explanations for their behavior?",
      "How would I find out what they're really thinking?"
    ]
  },
  "Fortune Telling": {
    name: "Fortune Telling",
    description: "Predicting negative outcomes without sufficient evidence.",
    examples: ["I'll never get better", "This will end badly", "I'm going to fail"],
    reframePrompts: [
      "What evidence do I have that this will happen?",
      "What are some other possible outcomes?",
      "How can I prepare for different scenarios?"
    ]
  },
  "Should Statements": {
    name: "Should Statements",
    description: "Using 'should' or 'must' statements that create pressure and guilt.",
    examples: ["I should be better at this", "I must never make mistakes", "I ought to be perfect"],
    reframePrompts: [
      "Where did this rule come from? Is it realistic?",
      "What would I tell a friend who had this expectation?",
      "How can I reframe this as a preference rather than a demand?"
    ]
  },
  "Labeling": {
    name: "Labeling",
    description: "Attaching negative labels to yourself or others based on limited information.",
    examples: ["I'm stupid", "She's selfish", "I'm a failure"],
    reframePrompts: [
      "Is this label based on one event or my whole person?",
      "What are some of my positive qualities?",
      "How can I describe the behavior without labeling the person?"
    ]
  },
  "Catastrophizing": {
    name: "Catastrophizing",
    description: "Imagining the worst possible outcome and believing it will happen.",
    examples: ["This is a disaster", "I can't handle this", "Everything is ruined"],
    reframePrompts: [
      "What's the most likely outcome, not the worst case?",
      "Have I handled difficult situations before?",
      "What would I do if this did happen?"
    ]
  },
  "Mental Filter": {
    name: "Mental Filter",
    description: "Focusing exclusively on negative details while ignoring positive aspects.",
    examples: ["All I can think about is that mistake", "The whole day was ruined by one bad moment"],
    reframePrompts: [
      "What positive things happened that I'm overlooking?",
      "Am I giving this one negative event too much weight?",
      "What would a balanced view look like?"
    ]
  },
  "Emotional Reasoning": {
    name: "Emotional Reasoning",
    description: "Believing something is true because you feel it emotionally.",
    examples: ["I feel guilty, so I must have done something wrong", "I feel scared, so it must be dangerous"],
    reframePrompts: [
      "Are my feelings based on facts or assumptions?",
      "What would someone looking at this objectively say?",
      "How can I separate my emotions from the actual facts?"
    ]
  }
};

export function detectDistortions(text: string): Hit[] {
  const hits: Hit[] = [];
  
  for (const [type, patterns] of Object.entries(DISTORTION_RULES)) {
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        hits.push({
          type,
          phrase: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  }
  
  // Sort by position in text
  return hits.sort((a, b) => a.start - b.start);
}

export function getDistortionInfo(type: string): DistortionType | undefined {
  return DISTORTION_TYPES[type];
}

export function generateReframePrompt(type: string): string {
  const info = getDistortionInfo(type);
  if (!info || !info.reframePrompts.length) {
    return "How could you look at this situation differently?";
  }
  
  const randomIndex = Math.floor(Math.random() * info.reframePrompts.length);
  return info.reframePrompts[randomIndex];
}