import { describe, it, expect } from 'vitest';

/**
 * Tests for the one-entry-per-day-per-template logic.
 * The actual logic lives in UnifiedJournalPage's useEffect, which checks
 * for existing entries with matching templateId on the current day.
 * Here we test the matching logic in isolation.
 */

function findExistingTemplateEntry(
  entries: { createdAt: string; templateId?: string }[],
  templateId: string,
): { createdAt: string; templateId?: string } | undefined {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return entries.find((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= startOfDay && entryDate <= endOfDay && entry.templateId === templateId;
  });
}

describe('One entry per day per template', () => {
  it('returns undefined when no entries exist', () => {
    const result = findExistingTemplateEntry([], 'gratitude');
    expect(result).toBeUndefined();
  });

  it('finds a matching entry for today', () => {
    const today = new Date().toISOString();
    const entries = [{ createdAt: today, templateId: 'gratitude' }];
    const result = findExistingTemplateEntry(entries, 'gratitude');
    expect(result).toBeDefined();
    expect(result?.templateId).toBe('gratitude');
  });

  it('does not match a different template', () => {
    const today = new Date().toISOString();
    const entries = [{ createdAt: today, templateId: 'anxiety-dump' }];
    const result = findExistingTemplateEntry(entries, 'gratitude');
    expect(result).toBeUndefined();
  });

  it('does not match yesterday entries', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const entries = [{ createdAt: yesterday.toISOString(), templateId: 'gratitude' }];
    const result = findExistingTemplateEntry(entries, 'gratitude');
    expect(result).toBeUndefined();
  });

  it('matches only the correct template among multiple entries', () => {
    const today = new Date().toISOString();
    const entries = [
      { createdAt: today, templateId: 'daily-reflection' },
      { createdAt: today, templateId: 'gratitude' },
      { createdAt: today, templateId: 'anxiety-dump' },
    ];
    const result = findExistingTemplateEntry(entries, 'gratitude');
    expect(result?.templateId).toBe('gratitude');
  });

  it('ignores entries without a templateId', () => {
    const today = new Date().toISOString();
    const entries = [{ createdAt: today }];
    const result = findExistingTemplateEntry(entries, 'gratitude');
    expect(result).toBeUndefined();
  });
});
