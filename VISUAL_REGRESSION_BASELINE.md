# Visual Regression Baseline - AI-Generated Class Display

**Commit:** `a53672e` - UAT Fix: AI-Generated Class Display - Transitions & Movement Counts
**Date:** 2025-11-17
**Status:** ✅ APPROVED APPEARANCE - USE AS REGRESSION BASELINE

---

## Purpose

This document describes the **approved visual appearance** of the "Your AI-Generated Class" modal. Use this as a reference during regression testing to ensure the display remains consistent.

---

## Visual Components (Approved)

### 1. Summary Stats Row (Top of Modal)

Four cards displayed in a grid:

**Card 1: Movements**
- Label: "Movements" (small, cream/60)
- Count: **9** (large, bold, cream)
- Subtext: "8 transitions" (small, cream/40)

**Card 2: Duration**
- Label: "Duration" (small, cream/60)
- Value: **45m** (large, bold, cream)

**Card 3: Primary Focus**
- Label: "Primary Focus" (small, cream/60)
- Percentage: **25%** (large, bold, cream)
- Muscle name: "Core Strength" (small, cream/60, truncated if long)

**Card 4: Balance Score**
- Label: "Balance Score" (small, cream/60)
- Score: **45%** (large, bold, cream)

### 2. Muscle Group Balance Chart

- Title: "Muscle Group Balance"
- Dynamic list of muscle groups from database
- Each group shows:
  - Name (capitalized)
  - Percentage value
  - Progress bar (energy gradient)
- Example groups:
  - Scapular Stability: 15%
  - Core Strength: 25%
  - Hip Flexor Strengthening: 12%
  - Spinal Mobility: 18%

### 3. Movement Sequence List

**Movement Cards (Dark Background):**
```
┌─────────────────────────────────────────────────┐
│ ⓵  The Hundred                          4:00   │
│     Beginner                            duration│
│                                                  │
│ [Core] [Stability] [Breathing]                 │
└─────────────────────────────────────────────────┘
```
- Dark burgundy background (`bg-burgundy-dark`)
- Cream border (`border-cream/30`)
- Numbered badge (1, 2, 3...)
- Movement name (bold, cream)
- Difficulty badge (colored by level)
- Muscle tags (pill-shaped)
- Duration (right-aligned)

**Transition Items (Light Background - APPROVED STYLE):**
```
┌────────────────────────────────────────────────┐
│ │ → Roll onto your side, then continue    1:00│
│ │    rolling all the way onto your front       │
│ │    with control.                             │
└────────────────────────────────────────────────┘
```
- Lighter burgundy background (`bg-burgundy/50`)
- Light cream border (`border-cream/20`)
- **Left accent border** (`border-l-4 border-l-cream/40`) ← KEY VISUAL
- **Italic text** for narrative (`italic text-cream/70`) ← KEY VISUAL
- **Arrow icon** (→) at the start ← KEY VISUAL
- Duration in lighter color (`text-cream/60`)

### 4. Visual Hierarchy

**Movements:** Prominent, dark cards with full information
**Transitions:** Subdued, light background, italic text, left accent

This creates clear visual distinction between:
- Active movements (what you teach)
- Passive transitions (how you move between them)

---

## Technical Specifications

### Backend API Response
```json
{
  "sequence": [...],          // Array of movements + transitions
  "movement_count": 9,        // Movements only
  "transition_count": 8,      // Transitions only
  "total_items": 17,          // Total sequence length
  "total_duration_minutes": 45,
  "muscle_balance": {         // Dynamic from database
    "Scapular Stability": 15.2,
    "Core Strength": 25.8,
    // ...
  }
}
```

### Transition Item Structure
```json
{
  "type": "transition",
  "from_position": "Supine",
  "to_position": "Prone",
  "narrative": "Roll onto your side, then continue rolling...",
  "duration_seconds": 60,
  "name": "Transition: Supine → Prone"
}
```

### Movement Item Structure
```json
{
  "type": "movement",
  "id": "uuid",
  "name": "The Hundred",
  "difficulty_level": "Beginner",
  "duration_seconds": 240,
  "primary_muscles": ["Core", "Stability"],
  "setup_position": "Supine"
}
```

---

## Regression Testing Checklist

When testing changes, verify:

- [ ] Movement count shows **movements only** (not total items)
- [ ] Transition count shows below movement count
- [ ] Transitions have **lighter background** than movements
- [ ] Transitions have **left accent border** (visual key)
- [ ] Transition text is **italic**
- [ ] Transition has **arrow icon** (→)
- [ ] Balance Score is **not NaN** (calculated from dynamic muscle groups)
- [ ] Primary Focus shows **actual muscle group name** from database
- [ ] Muscle Balance chart shows **database muscle groups** (not generic core/legs/arms)
- [ ] Movement durations show **4:00, 5:00, or 6:00** (teaching time)
- [ ] Transition durations show **1:00**

---

## Revert Instructions

If visual regression occurs, revert to this commit:

```bash
git checkout a53672e -- backend/agents/sequence_agent.py
git checkout a53672e -- frontend/src/components/class-builder/ai-generation/SequenceResultsTab.tsx
git checkout a53672e -- frontend/src/components/class-builder/ai-generation/GeneratedResults.tsx
git checkout a53672e -- frontend/src/components/class-builder/AIGenerationPanel.tsx
```

Or full revert:
```bash
git revert a53672e
```

---

## CSS Classes Reference (Approved)

### Transition Styling
```tsx
className="bg-burgundy/50 border border-cream/20 rounded-lg p-3 border-l-4 border-l-cream/40"
```

### Transition Text
```tsx
className="text-sm italic text-cream/70"
```

### Movement Card
```tsx
className="bg-burgundy-dark border border-cream/30 rounded-lg p-4 hover:border-cream/40 transition-smooth"
```

---

## Screenshots

**Reference Screenshot:** `/Users/lauraredmond/Desktop/Screenshot 2025-11-17 at 21.09.42.png`

Key visual features to match:
1. Movement count: "9" (large) with "8 transitions" (small below)
2. Transitions: Light background, italic, left border accent
3. Movements: Dark background, muscle tags, duration
4. Muscle balance: Actual database names (not generic)

---

## Related Documentation

- `/UAT_FIXES_ROUND2_2025-11-17.md` - Complete fix documentation
- `/UAT_ISSUES_TRACKER.md` - Issue tracking
- `/FIXES_COMPLETED_2025-11-17.md` - Round 1 fixes

---

**Last Updated:** 2025-11-17 21:25 UTC
**Commit Hash:** `a53672e`
**Status:** ✅ BASELINE APPROVED
