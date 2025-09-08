import { 
  getAllDistortions, 
  getDistortionsByDateRange,
  getAllJournalEntries 
} from '@/lib/idb';
import { DistortionMeta } from '@/types';

export type DistortionContext = {
  topics: string[];                 // tags like ["work","family"]
  commonTypes: string[];            // e.g. ["Mind Reading","Catastrophizing"]  
  recentPhrases: string[];          // short past snippets only
  userGoals?: string[];             // optional objectives
};

// Get recent topics from journal entries (last N days)
async function getRecentTopics(days: number = 14): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();
  
  const entries = await getAllJournalEntries();
  const topics = new Set<string>();
  
  entries
    .filter(entry => entry.createdAt >= cutoffISO)
    .forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => topics.add(tag));
      }
    });
    
  return Array.from(topics).slice(0, 10); // Top 10 topics
}

// Get top distortion types from recent history
async function getTopDistortionTypes(days: number = 14, limit: number = 3): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();
  
  const distortions = await getDistortionsByDateRange(cutoffISO, new Date().toISOString());
  
  // Count occurrences by type
  const typeCounts = distortions.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by count and return top N
  return Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([type]) => type);
}

// Get recent distortion phrases (for context)
async function getRecentDistortionMeta(days: number = 14): Promise<DistortionMeta[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();
  
  return await getDistortionsByDateRange(cutoffISO, new Date().toISOString());
}

// Build complete context window for AI
export async function getContextWindow(): Promise<DistortionContext> {
  const topics = await getRecentTopics(14);               // last 14 days
  const commonTypes = await getTopDistortionTypes(14, 3); // top 3 types
  const recentPhrases = (await getRecentDistortionMeta(14))
    .slice(0, 6)
    .map(d => d.phrase);
  const userGoals = JSON.parse(localStorage.getItem("cbt_goals") || "[]");
  
  return { topics, commonTypes, recentPhrases, userGoals };
}