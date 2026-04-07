

## Thought Record — How It Works

A **Thought Record** is the core CBT worksheet. It walks users through a structured sequence of steps to examine and reframe a distressing thought. Here's the flow:

```text
┌─────────────────────────────┐
│  1. Situation                │  "What happened?"
│  2. Emotions                 │  Tap emoji chips + intensity slider (1-10)
│  3. Automatic Thought        │  "What went through your mind?"
│  4. Evidence FOR              │  "What supports this thought?"
│  5. Evidence AGAINST          │  "What contradicts it?"
│  6. Balanced Thought          │  "A more realistic view..."
│  7. Re-rate Emotions          │  Same chips, new intensity
└─────────────────────────────┘
        → Summary card saved as journal entry
```

### User experience
- Accessed as a **new journal template** ("Thought Record") on the Journal hub page, alongside Daily Reflection, Anxiety Dump, etc.
- Opens a **step-by-step wizard** (similar to the Grounding exercise) — one question per screen with smooth transitions
- Steps 2 and 7 use **tappable emotion chips** (😰 Anxious, 😢 Sad, 😠 Angry, etc.) with a small intensity slider
- Text steps use the existing textarea component — short, focused prompts
- On completion, shows a **summary card** comparing before/after emotion ratings, highlighting the shift
- The full record is saved as a journal entry with `templateId: 'thought-record'`

### Implementation

1. **New component**: `src/components/ThoughtRecord.tsx`
   - Multi-step wizard with `framer-motion` transitions
   - State: `{ situation, emotions[], automaticThought, evidenceFor, evidenceAgainst, balancedThought, emotionsAfter[] }`
   - Each emotion: `{ label, emoji, intensity: number }`
   - Summary screen at end with before/after comparison

2. **New template config** in `src/config/templates.ts`
   - Add `'thought-record'` entry with appropriate prompts and styling

3. **New template card** on `src/pages/JournalPage.tsx`
   - Route to `/unified?template=thought-record` or a dedicated `/thought-record` page

4. **Save logic**: On completion, format the structured data into a readable text block and save via the existing `useEntries` store

5. **No new routes needed** if embedded in UnifiedJournalPage, or one new route if standalone (standalone is cleaner for the wizard UX)

### Why standalone page is better
The existing `UnifiedJournalPage` is a free-form editor. A Thought Record is a guided, step-by-step worksheet — mixing them would be awkward. A dedicated `/thought-record` route with the wizard component keeps it clean.

