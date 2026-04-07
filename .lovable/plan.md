

## Behavioral Activation Planner

### What it is
Behavioral Activation (BA) is a core CBT technique for depression and low motivation. The idea: when you feel low, you withdraw from activities → mood drops further → you withdraw more. BA breaks this cycle by scheduling small, achievable activities tied to values like **pleasure**, **mastery**, or **connection**.

### How it works in the app

```text
┌──────────────────────────────────────┐
│  1. How are you feeling?             │  Quick mood rating (1-5 faces)
│  2. Pick a category                  │  Pleasure / Mastery / Connection
│  3. Choose or write an activity      │  Pre-built suggestions + custom input
│  4. When will you do it?             │  Today / Tomorrow / This week
│  5. Set intention                    │  Confirm → saved as a plan
└──────────────────────────────────────┘
        → Later: mark as done + re-rate mood
```

### UX flow
- **Step-by-step wizard** (same pattern as Thought Record / Grounding) with framer-motion transitions
- **Step 1**: Tap a face emoji for current mood (😔 😕 😐 🙂 😊)
- **Step 2**: Three category cards — Pleasure (🎨 "Things you enjoy"), Mastery (💪 "Things that give accomplishment"), Connection (🤝 "Social activities")
- **Step 3**: Show 4-5 suggestions per category (e.g. Pleasure: "Take a short walk", "Listen to music", "Cook something new") + a text input for custom activity
- **Step 4**: Tap to pick timing — Today, Tomorrow, This Week
- **Step 5**: Summary card showing the plan → "Set this intention" button
- **Completion**: Saved as a journal entry with `templateId: 'activity-plan'`; later the user can revisit and mark it complete with a post-activity mood rating

### Activity suggestions by category
- **Pleasure**: Take a walk, Listen to music, Watch something funny, Draw or doodle, Have a favourite snack
- **Mastery**: Tidy one small area, Reply to a message, Do a 5-min workout, Learn something new, Cook a meal
- **Connection**: Text a friend, Call someone, Go to a café, Say hi to a neighbour, Share a meme

### Where it lives
- **New route**: `/activity-plan` with a dedicated `ActivityPlanPage.tsx`
- **New template card** on the Journal hub page alongside existing templates
- **Router**: Add lazy-loaded route

### Implementation

1. **`src/components/ActivityPlanner.tsx`** — Multi-step wizard component
   - State: `{ moodBefore, category, activity, timing, moodAfter? }`
   - 5 steps with AnimatePresence transitions
   - Summary screen at end

2. **`src/pages/ActivityPlanPage.tsx`** — Thin page wrapper (same pattern as ThoughtRecordPage)

3. **`src/pages/JournalPage.tsx`** — Add "Activity Planner" template card to the grid

4. **`src/router.tsx`** — Add `/activity-plan` route

5. **`src/config/templates.ts`** — Add `'activity-plan'` template config

6. **Save logic** — On completion, format as readable text and save via `useEntries.createEntry()` with `templateId: 'activity-plan'`

### Why this complements CBT
- Thought Record addresses **thinking** patterns; BA addresses **behavior** patterns
- Works especially well for users who feel stuck or unmotivated
- The mood before/after comparison reinforces that action improves mood (same insight pattern as Thought Record)

