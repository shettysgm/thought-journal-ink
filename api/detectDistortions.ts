import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { text, context } = req.body as {
      text: string;
      context?: {
        topics?: string[];
        commonTypes?: string[];
        recentPhrases?: string[];
        userGoals?: string[];
      };
    };

    // Basic input limits + redaction pass (client also does this)
    const trimmed = (text || "").slice(0, 2000); // keep prompt lean

    const system = `
You are a CBT assistant. Analyze journal entries for cognitive distortions and return ONLY structured JSON.

CRITICAL: BE CONSERVATIVE. Only flag CLEAR distortions. When uncertain, DO NOT FLAG.

OUTPUT SCHEMA:
[
  {
    "span": "<exact text span (≤12 words) showing the distortion>",
    "type": "<one of: All-or-Nothing, Catastrophizing, Mind Reading, Fortune Telling, Should Statements, Labeling, Emotional Reasoning, Overgeneralization, Personalization, Mental Filter>",
    "reframe": "<specific, personalized alternative thought in 15-30 words>",
    "confidence": <0.0-1.0>
  }
]

If no CLEAR distortion exists, return: []

CONFIDENCE THRESHOLDS (be strict):
- 0.9-1.0: Unmistakable distortion with extreme language ("always", "never", "everyone", "I'm such a failure")
- 0.8-0.89: Clear distortion with strong patterns
- 0.7-0.79: Likely distortion, but requires careful consideration
- Below 0.7: DO NOT INCLUDE - too uncertain

DO NOT FLAG (these are NOT distortions):
- Reasonable concerns or realistic worries
- Factual observations, even if negative
- Healthy emotional expression ("I felt sad when...")
- Questions or curiosity about others' thoughts
- Balanced self-reflection or self-improvement goals
- Mild preferences or opinions

ONLY FLAG when you see:
- Absolute language: "always", "never", "everyone", "no one", "nothing"
- Catastrophic predictions without evidence
- Mind-reading stated as fact: "They think I'm..."
- Self-labeling: "I'm a failure/idiot/worthless"
- Rigid "should/must" statements implying moral failure

REFRAME GUIDELINES (critical — avoid generic platitudes):
- Reference the user's SPECIFIC situation, words, and context
- BAD: "Things might not be as bad as you think" (vague, useless)
- GOOD: "One tough meeting doesn't erase the projects you've delivered well" (specific to their situation)
- BAD: "Consider other possibilities" (empty advice)
- GOOD: "Your colleague may have been rushed, not dismissing your contribution" (references their actual scenario)
- Reframes should feel like a thoughtful friend who READ what they wrote — not a fortune cookie
- 15-30 words: long enough to be meaningful, short enough to be digestible
- Warm, conversational tone — never clinical or preachy

RULES:
- The "span" MUST be an exact quote from the user's text
- Prefer fewer, high-confidence detections over many uncertain ones
- When in doubt, leave it out
`;

    const user = JSON.stringify({
      text: trimmed,
      context: {
        topics: context?.topics ?? [],
        commonTypes: context?.commonTypes ?? [],
        recentPhrases: (context?.recentPhrases ?? []).slice(0, 5),
        userGoals: context?.userGoals ?? []
      },
      // optional toggles for stricter privacy
      privacy: { redactPII: true, keepSnippetsShort: true }
    });

    const prompt = `
CONTEXT (user-specific):
- Topics: ${(context?.topics ?? []).join(", ") || "n/a"}
- Common types: ${(context?.commonTypes ?? []).join(", ") || "n/a"}
- Recent phrases: ${(context?.recentPhrases ?? []).join(" | ") || "n/a"}
- Goals: ${(context?.userGoals ?? []).join(", ") || "n/a"}

TEXT:
"""${trimmed}"""
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: { 
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const fullPrompt = `${system}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const json = JSON.parse(response.text() || "[]");

    // Enforce response shape - expect array format with confidence scores
    const clean = Array.isArray(json) ? json.map((item: any) => ({
      span: String(item.span || "").slice(0, 80),
      type: String(item.type || ""),
      reframe: String(item.reframe || "").slice(0, 300),
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5))
    })) : [];

    res.status(200).json(clean);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Detection failed" });
  }
}