import { Capacitor } from '@capacitor/core';

const REVIEW_STORAGE_KEY = 'app_review_state';
const MIN_ENTRIES_BEFORE_PROMPT = 5;
const MIN_DAYS_BETWEEN_PROMPTS = 60;

interface ReviewState {
  lastPromptedAt: string | null;
  promptCount: number;
  entryCount: number;
}

function getReviewState(): ReviewState {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastPromptedAt: null, promptCount: 0, entryCount: 0 };
}

function saveReviewState(state: ReviewState) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

export async function maybeRequestReview() {
  // Only works on native iOS/Android
  if (!Capacitor.isNativePlatform()) return;

  const state = getReviewState();
  state.entryCount += 1;
  saveReviewState(state);

  // Don't prompt too early
  if (state.entryCount < MIN_ENTRIES_BEFORE_PROMPT) return;

  // iOS limits to 3 prompts/year; respect a cooldown
  if (state.lastPromptedAt) {
    const daysSince = (Date.now() - new Date(state.lastPromptedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
  }

  // Only prompt on every 5th entry after the minimum
  if ((state.entryCount - MIN_ENTRIES_BEFORE_PROMPT) % 5 !== 0) return;

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    state.lastPromptedAt = new Date().toISOString();
    state.promptCount += 1;
    saveReviewState(state);
  } catch (e) {
    console.warn('In-app review not available:', e);
  }
}
