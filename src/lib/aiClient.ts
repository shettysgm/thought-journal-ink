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
  const text = simpleRedact(rawText).slice(0, 2000); // local redaction + cap
  const context = await getContextWindow();          // topics, commonTypes, recentPhrases, userGoals
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  // Build candidate URLs with graceful fallbacks
  const base = API_CONFIG.BACKEND_URL;
  const configured = getDetectDistortionsUrl();
  const candidates = [
    configured,
    `${base}/api/detectDistortions`,
    `${base}/detectDistortions`,
    base,
  ].filter((v, i, a) => !!v && a.indexOf(v) === i);

  try {
    let lastErr: any = null;
    for (const url of candidates) {
      try {
        console.debug("[AI Detect] POST", url, { textLen: text.length, hasContext: !!context });
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, context }),
          signal: controller.signal
        });

        if (!response.ok) {
          if ([404, 405, 307, 308].includes(response.status)) {
            console.warn("[AI Detect] Endpoint not usable (", response.status, ") -> trying next fallback");
            lastErr = new Error(`status ${response.status}`);
            continue;
          }
          const t = await response.text().catch(() => "");
          throw new Error(`AI detection failed ${response.status}: ${t || response.statusText}`);
        }

        clearTimeout(timeoutId);
        const data = await response.json();
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
          return { distortions, reframes } as DetectResponse;
        }
        return data as DetectResponse;
      } catch (e: any) {
        lastErr = e;
        if (e?.name === 'AbortError') {
          clearTimeout(timeoutId);
          throw new Error("AI detection timeout");
        }
        console.warn("[AI Detect] Error calling", url, e?.message || e);
      }
    }

    clearTimeout(timeoutId);
    throw lastErr || new Error("AI detection failed with no valid endpoint");
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