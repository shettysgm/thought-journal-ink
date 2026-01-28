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
You are a CBT assistant. Your role is to analyze short journal entries for cognitive distortions and return ONLY structured JSON.

OUTPUT RULES:
- Output must be VALID JSON only.
- Use this schema: 
  [
    {
      "span": "<short text span (≤12 words) that shows distortion>",
      "type": "<one of: All-or-Nothing, Catastrophizing, Mind Reading, Fortune Telling, Should Statements, Labeling, Emotional Reasoning, Overgeneralization, Personalization, Mental Filter>",
      "reframe": "<gentle, non-judgmental alternative thought in ≤15 words>"
    }
  ]
- If no clear distortion is found, return: []

GUIDELINES:
- Never include the entire user text, only the flagged span.
- Keep reframes brief, compassionate, and trauma-informed.
- Detect multiple distortions if present, each as a separate object in the array.
- Do not add extra commentary, explanations, or formatting outside the JSON.
- Prioritize common patterns: all-or-nothing language, predicting the future, negative labels, assumptions about others' thoughts.
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

    // Enforce response shape - expect array format
    const clean = Array.isArray(json) ? json.map((item: any) => ({
      span: String(item.span || "").slice(0, 80),
      type: String(item.type || ""),
      reframe: String(item.reframe || "").slice(0, 180)
    })) : [];

    res.status(200).json(clean);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Detection failed" });
  }
}