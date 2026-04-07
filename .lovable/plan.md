

## Grounding Exercise (5-4-3-2-1) — Plan

### What it is
A guided sensory grounding exercise where the user identifies 5 things they see, 4 they touch, 3 they hear, 2 they smell, and 1 they taste. Each step has its own screen with a simple input, progressing through the senses with calming transitions.

### Where to place it
The most natural spot is **inside the Breathe page** as a second tab or toggle. Both breathing and grounding are quick calming exercises, so grouping them avoids cluttering the bottom nav. The Breathe page becomes a "Calm" toolkit:

```text
┌─────────────────────────┐
│  [Breathing]  [Grounding] │  ← toggle at top
│                           │
│   (active exercise)       │
└─────────────────────────┘
```

### Technical approach

1. **Create `src/components/GroundingExercise.tsx`**
   - State machine with 5 steps (see 5, touch 4, hear 3, smell 2, taste 1)
   - Each step: icon, prompt text, simple text inputs or tap-to-confirm items
   - Progress bar showing current step (1–5)
   - Animated transitions between steps (framer-motion)
   - Completion screen with encouragement message

2. **Update `src/pages/BreathePage.tsx`**
   - Rename conceptually to a "Calm" page (keep route `/breathe`)
   - Add a toggle/tabs at the top: "Breathing" | "Grounding"
   - Conditionally render `BreathingExercise` or `GroundingExercise`
   - Extract current breathing logic into its own section (no new file needed, just wrap in a conditional)

3. **No router or nav changes needed** — stays on the existing `/breathe` route and bottom nav tab

### UI details
- Each sense gets a distinct icon (Eye, Hand, Ear, Flower, Coffee from lucide)
- Calming color palette matching the breathing exercise
- "Next" button advances steps; "Done" on final step
- Optional: save a summary to journal entries via the existing entry store

