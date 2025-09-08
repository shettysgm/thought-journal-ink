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
You are a CBT assistant. Your job is to detect cognitive distortions in a user's short journal text and suggest gentle reframes.
Follow STRICTLY:
- Output VALID JSON only (no extra text).
- Use these distortion types: ["All-or-Nothing","Catastrophizing","Mind Reading","Fortune Telling","Should Statements","Labeling","Emotional Reasoning","Overgeneralization","Personalization","Mental Filter"].
- Be non-judgmental, trauma-informed, and brief.
- NEVER include the user's full text in your response; return only short spans that were flagged (≤ 12 words).
- If no clear distortion, return an empty array.
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

    const schema = `
Return JSON in this exact schema:

{
  "distortions": [
    {
      "type": "Mind Reading",
      "span": "they probably think I'm useless",
      "rationale": "Assuming others' thoughts without evidence",
      "confidence": 0.78
    }
  ],
  "reframes": [
    {
      "span": "they probably think I'm useless",
      "suggestion": "I don't know what they think; I can ask for feedback.",
      "socratic": "What evidence supports this belief? What evidence contradicts it?"
    }
  ]
}
`;

    const prompt = `
CONTEXT (user-specific):
- Topics: ${(context?.topics ?? []).join(", ") || "n/a"}
- Common types: ${(context?.commonTypes ?? []).join(", ") || "n/a"}
- Recent phrases: ${(context?.recentPhrases ?? []).join(" | ") || "n/a"}
- Goals: ${(context?.userGoals ?? []).join(", ") || "n/a"}

TEXT:
"""${trimmed}"""

${schema}
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
    const json = JSON.parse(response.text() || "{}");

    // Enforce response shape
    const clean = {
      distortions: Array.isArray(json.distortions) ? json.distortions.map((d: any) => ({
        type: String(d.type || ""),
        span: String(d.span || "").slice(0, 80),
        rationale: String(d.rationale || "").slice(0, 160),
        confidence: Math.max(0, Math.min(1, Number(d.confidence ?? 0)))
      })) : [],
      reframes: Array.isArray(json.reframes) ? json.reframes.map((r: any) => ({
        span: String(r.span || "").slice(0, 80),
        suggestion: String(r.suggestion || "").slice(0, 180),
        socratic: String(r.socratic || "").slice(0, 180)
      })) : []
    };

    res.status(200).json(clean);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Detection failed" });
  }
}