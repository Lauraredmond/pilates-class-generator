# Continuation Notes - Coach Sport Pages Enhancement

## Current Task: Mirror "Pilates for Hurlers" JSX Functionality

### What Needs to be Done:
Implement tab-based interface with Library/Session Builder for all 3 sport pages (GAA, Soccer, Rugby)

### Core Features to Implement:

#### 1. Tab Navigation
- Two tabs: "Library" and "Session Builder"
- Library shows exercises with checkboxes
- Session Builder shows selected exercises

#### 2. Library Tab Features:
- **Checkbox Selection**: Each exercise has checkbox to select/deselect
- **Expandable Details**: Click exercise name to expand showing:
  - Pilates technique description
  - Sport-specific connection (hurling/soccer/rugby relevance)
  - U12 modifications (if available)
  - Muscle groups targeted
- Keep existing search and filter functionality

#### 3. Session Builder Tab:
- Display list of selected exercises
- Shows exercise name and category
- Simple list for now (no reordering/duration/saving)

### Implementation Status:
- ✅ All 3 pages have Bassline branding
- ✅ Search and filters working
- ✅ Star ratings implemented
- ⏳ Need to add: Tab system, checkboxes, session builder

### Files to Update:
1. `/frontend/src/pages/coach/sport/GAASport.tsx`
2. `/frontend/src/pages/coach/sport/SoccerSport.tsx`
3. `/frontend/src/pages/coach/sport/RugbySport.tsx`

### Key State Management:
```typescript
const [activeTab, setActiveTab] = useState<'library' | 'session'>('library');
const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
```

### Implementation Order:
1. GAASport.tsx first (complete implementation)
2. Copy pattern to SoccerSport.tsx
3. Copy pattern to RugbySport.tsx

### Database Migration Still Needed:
Run `/database/migrations/005_add_relevance_score.sql` in Supabase

### Last Git Status:
- Branch: dev
- Last commit: "fix(coach): Redesign sport pages with Bassline branding and improved layout"
- All changes pushed to GitHub