import { getContextWindow } from "./context";
import { simpleRedact } from "./redact";
import { getDetectDistortionsUrl, API_CONFIG } from "../config/api";

export type DetectResponse = {
  distortions: { 
    type: string; 
    span: string; 
    rationale: string; 
    confidence: number;
  }[];
  reframes: { 
    span: string; 
    suggestion: string; 
    socratic: string;
  }[];
};

export async function detectWithAI(rawText: string): Promise<DetectResponse> {
  const text = simpleRedact(rawText); // Redact but send full text
  const context = await getContextWindow();
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  // Use the full URL with endpoint path
  const url = getDetectDistortionsUrl();

  try {
    console.debug("[AI Detect] POST", url, { textLen: text.length, hasContext: !!context });
    
    // Confidence threshold disabled to debug response parsing
    const CONFIDENCE_THRESHOLD = 0;
    
    // Request structured JSON response with confidence scores
    const enhancedPrompt = `Analyze this journal entry for cognitive distortions and return ONLY a JSON array. No explanations or extra text.

Format:
[
  {
    "span": "exact phrase from entry showing distortion",
    "type": "Mind Reading" or "Catastrophizing" or "All-or-Nothing" etc.,
    "reframe": "a specific, personalized alternative thought",
    "confidence": 0.85
  }
]

Confidence scoring:
- 0.9-1.0: Very clear distortion (e.g., "I always fail", "Everyone hates me")
- 0.7-0.89: Likely distortion with strong indicators
- 0.5-0.69: Possible distortion, context-dependent
- Below 0.5: Uncertain, only flag with evidence

REFRAME GUIDELINES (critical — avoid generic platitudes):
- Reference the user's SPECIFIC situation, words, or context — don't just say "things might be okay"
- BAD: "Things might not be as bad as you think" (vague, generic)
- GOOD: "One tough meeting doesn't erase the projects you've delivered well" (specific)
- BAD: "Consider other possibilities" (empty advice)
- GOOD: "Sarah might have been distracted by her own deadline, not judging your idea" (uses their context)
- Reframes should feel like a wise friend who actually READ what you wrote, not a fortune cookie
- 15-30 words is ideal — long enough to be meaningful, short enough to be digestible
- Use warm, conversational tone — not clinical or preachy

Rules:
- Return ONLY the JSON array
- Keep spans under 15 words
- Be conservative: prefer lower confidence over false positives
- If no distortions found, return []

Journal entry:
${text}`;

    
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Add Supabase anon key when calling through the edge function proxy
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (anonKey) {
      headers["apikey"] = anonKey;
      headers["Authorization"] = `Bearer ${anonKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        prompt: enhancedPrompt,
        gcpProject: "apt-gear-425423-i9",
        region: "us-central1",
        model: "gemini-2.0-flash"
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const t = await response.text().catch(() => "");
      throw new Error(`AI detection failed ${response.status}: ${t || response.statusText}`);
    }

    clearTimeout(timeoutId);
    const responseData = await response.json();
    
    console.debug("[AI Detect] Response received:", responseData);
    
    // Handle Vertex AI response format: { data: { result: "..." } } or { result: "..." }
    const data = responseData?.data || responseData;
    console.debug("[AI Detect] Parsed data:", data);
    
    // Validate response structure
    if (!data) {
      throw new Error("Empty response from AI endpoint");
    }
    
    // If data contains distortions (structured format)
    if (Array.isArray(data)) {
      // Handle both expected (type/span/reframe) and actual backend (distortion/example/description) field names
      const allDistortions = data.map((item: any) => ({
        type: String(item.type || item.distortion || ""),
        span: String(item.span || item.example || ""),
        rationale: "",
        confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
      }));
      
      const distortions = allDistortions.filter(d => d.confidence >= CONFIDENCE_THRESHOLD);
      console.debug(`[AI Detect] Distortions (${distortions.length}/${allDistortions.length}):`, distortions);
      
      const reframes = data
        .filter((i: any) => (i?.reframe || i?.description) && (Number(i.confidence) || 0.5) >= CONFIDENCE_THRESHOLD)
        .map((i: any) => ({
          span: String(i.span || i.example || ""),
          suggestion: String(i.reframe || i.description || ""),
          socratic: "",
        }));
      console.debug(`[AI Detect] Reframes (${reframes.length}):`, reframes);
      return { distortions, reframes };
    }
    
    if (data.distortions && Array.isArray(data.distortions)) {
      return {
        distortions: data.distortions,
        reframes: data.reframes || []
      };
    }
    
    // If data.result contains JSON string (Vertex AI format)
    if (data.result && typeof data.result === 'string') {
      // Strip markdown code blocks if present
      let jsonStr = data.result.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      try {
        const parsed = JSON.parse(jsonStr);
        console.debug("[AI Detect] Parsed JSON from result:", parsed);
        if (Array.isArray(parsed)) {
          // Handle both expected and actual backend field names
          const allDistortions = parsed.map((item: any) => ({
            type: String(item.type || item.distortion || ""),
            span: String(item.span || item.example || ""),
            rationale: "",
            confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
          }));
          
          const distortions = allDistortions.filter(d => d.confidence >= CONFIDENCE_THRESHOLD);
          console.debug("[AI Detect] Distortions:", distortions);
          
          const reframes = parsed
            .filter((item: any) => (Number(item.confidence) || 0.5) >= CONFIDENCE_THRESHOLD)
            .map((item: any) => ({
              span: String(item.span || item.example || ""),
              suggestion: String(item.reframe || item.description || ""),
              socratic: String(item.type || item.distortion || ""),
            }));
          console.debug("[AI Detect] Reframes:", reframes);
          return { distortions, reframes };
        }
      } catch (e) {
        console.error("Failed to parse JSON from result:", e, "jsonStr:", jsonStr);
      }
      
      // Fallback: treat as plain text
      return {
        distortions: [],
        reframes: [{
          span: text.slice(0, 100),
          suggestion: data.result,
          socratic: ""
        }]
      };
    }
    
    throw new Error(`Unexpected response format: ${JSON.stringify(data).slice(0, 200)}`);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("AI detection timeout");
    }
    throw error;
  }
}

// Analyze text and persist distortion metadata
export async function analyzeAndPersist(
  entryId: string, 
  text: string,
  saveDistortionFn: (distortion: any) => Promise<void>
): Promise<DetectResponse> {
  const { distortions, reframes } = await detectWithAI(text);
  
  // Save ONLY metadata (not full text)
  for (const d of distortions) {
    await saveDistortionFn({
      entryId,
      createdAt: new Date().toISOString(),
      type: d.type,
      phrase: d.span // Only the short span, not full text
    });
  }
  
  return { distortions, reframes };
}