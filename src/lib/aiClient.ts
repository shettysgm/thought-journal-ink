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
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
  
  // Use the full URL with endpoint path
  const url = getDetectDistortionsUrl();

  try {
    console.debug("[AI Detect] POST", url, { textLen: text.length, hasContext: !!context });
    
    // Request structured JSON response
    const enhancedPrompt = `Analyze this journal entry for cognitive distortions and return ONLY a JSON array. No explanations or extra text.

Format:
[
  {
    "span": "exact phrase from entry showing distortion",
    "type": "Mind Reading" or "Catastrophizing" or "All-or-Nothing" etc.,
    "reframe": "brief compassionate alternative thought"
  }
]

Rules:
- Return ONLY the JSON array
- Keep spans under 15 words
- Keep reframes under 20 words
- Use compassionate, friendly language
- If no distortions found, return []

Journal entry:
${text}`;

    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    
    // Handle Vertex AI response format: { data: { result: "..." } }
    const data = responseData?.data || responseData;
    
    // Validate response structure
    if (!data) {
      throw new Error("Empty response from AI endpoint");
    }
    
    // If data contains distortions (structured format)
    if (Array.isArray(data)) {
      const distortions = data.map((item: any) => ({
        type: String(item.type || ""),
        span: String(item.span || ""),
        rationale: "",
        confidence: 0.75,
      }));
      const reframes = data.filter((i: any) => i?.reframe).map((i: any) => ({
        span: String(i.span || ""),
        suggestion: String(i.reframe || ""),
        socratic: "",
      }));
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
        if (Array.isArray(parsed)) {
          const distortions = parsed.map((item: any) => ({
            type: String(item.type || ""),
            span: String(item.span || ""),
            rationale: "",
            confidence: 0.75,
          }));
          const reframes = parsed.map((item: any) => ({
            span: String(item.span || ""),
            suggestion: String(item.reframe || ""),
            socratic: "",
          }));
          return { distortions, reframes };
        }
      } catch (e) {
        console.error("Failed to parse JSON from result:", e);
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