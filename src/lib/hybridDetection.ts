import { Hit } from '@/types';
import { detectDistortions as ruleBasedDetect } from './distortions';
import { detectWithAI, analyzeAndPersist } from './aiClient';

export type DetectionMethod = 'hybrid' | 'rules-only' | 'ai-only';

// Combine rule-based and AI detection results
export async function hybridDetection(
  text: string, 
  method: DetectionMethod = 'ai-only'
): Promise<{ hits: Hit[]; reframes?: any[] }> {
  
  if (method === 'rules-only') {
    const hits = ruleBasedDetect(text);
    return { hits: hits.map(hit => ({ ...hit, isAI: false })) };
  }
  
  if (method === 'ai-only') {
    console.log('🤖 Attempting AI-only detection for text:', text.slice(0, 100) + '...');
    try {
      const { distortions, reframes } = await detectWithAI(text);
      console.log('🤖 AI detection successful, found', distortions.length, 'distortions');
      const hits: Hit[] = distortions.map(d => ({
        type: d.type,
        phrase: d.span,
        start: text.indexOf(d.span),
        end: text.indexOf(d.span) + d.span.length,
        confidence: d.confidence,
        rationale: d.rationale,
        isAI: true
      })).filter(hit => hit.start !== -1); // Only include hits found in text
      
      return { hits, reframes };
    } catch (error) {
      console.error('❌ AI detection failed, falling back to rules:', error);
      const hits = ruleBasedDetect(text);
      return { hits: hits.map(hit => ({ ...hit, isAI: false })) };
    }
  }
  
  // Hybrid approach: combine both methods
  const ruleHits = ruleBasedDetect(text).map(hit => ({ ...hit, isAI: false }));
  
  try {
    const { distortions, reframes } = await detectWithAI(text);
    const aiHits: Hit[] = distortions.map(d => ({
      type: d.type,
      phrase: d.span,
      start: text.indexOf(d.span),
      end: text.indexOf(d.span) + d.span.length,
      confidence: d.confidence,
      rationale: d.rationale,
      isAI: true
    })).filter(hit => hit.start !== -1);
    
    // Merge and deduplicate hits
    const allHits = [...ruleHits, ...aiHits];
    const uniqueHits = deduplicateHits(allHits);
    
    return { hits: uniqueHits, reframes };
  } catch (error) {
    console.warn('AI detection failed, using rules only:', error);
    return { hits: ruleHits };
  }
}

// Remove duplicate hits based on overlap and confidence
function deduplicateHits(hits: Hit[]): Hit[] {
  const sorted = hits.sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5));
  const deduplicated: Hit[] = [];
  
  for (const hit of sorted) {
    const hasOverlap = deduplicated.some(existing => 
      Math.max(hit.start, existing.start) < Math.min(hit.end, existing.end)
    );
    
    if (!hasOverlap) {
      deduplicated.push(hit);
    }
  }
  
  return deduplicated;
}

// Enhanced analysis function that saves context-aware distortions
export async function analyzeEntryWithContext(
  entryId: string,
  text: string,
  method: DetectionMethod = 'ai-only',
  saveDistortionFn: (distortion: any) => Promise<void>
): Promise<{ hits: Hit[]; reframes?: any[] }> {
  
  const result = await hybridDetection(text, method);
  
  // Save distortion metadata (not full text)
  for (const hit of result.hits) {
    await saveDistortionFn({
      entryId,
      createdAt: new Date().toISOString(),
      type: hit.type,
      phrase: hit.phrase,
    });
  }
  
  return result;
}