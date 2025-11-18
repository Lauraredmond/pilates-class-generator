# Class Builder - Component Architecture

## Component Hierarchy

```
ClassBuilder (Page)
├── DndContext (Drag & Drop Provider)
│   ├── MovementLibrary
│   │   ├── Search Input
│   │   ├── Difficulty Filters
│   │   ├── Muscle Group Filters
│   │   └── DraggableMovementCard[] (mapped from movements)
│   │
│   ├── SequenceCanvas
│   │   ├── SortableContext
│   │   │   └── SortableSequenceItem[] (mapped from currentClass.movements)
│   │   │       ├── Drag Handle
│   │   │       ├── Sequence Number
│   │   │       ├── Movement Info
│   │   │       └── Delete Button
│   │   ├── Duration Counter
│   │   └── Warning Messages
│   │
│   ├── ClassDetailsPanel
│   │   ├── Class Name Input
│   │   ├── Duration Display (auto-calculated)
│   │   ├── Difficulty Display (auto-detected)
│   │   ├── Notes Textarea
│   │   ├── Save Button
│   │   ├── Clear Button
│   │   └── Quick Stats Card
│   │
│   ├── MuscleBalanceTracker
│   │   ├── MuscleBar (Core)
│   │   ├── MuscleBar (Legs)
│   │   ├── MuscleBar (Arms)
│   │   ├── MuscleBar (Back)
│   │   ├── MuscleBar (Full Body)
│   │   └── Warning/Success Alert
│   │
│   └── AIGenerationPanel
│       ├── Strictness Selector
│       │   ├── Strict Option
│       │   ├── Guided Option
│       │   └── Autonomous Option
│       ├── Generate Sequence Button
│       ├── Select Music Button
│       ├── Create Meditation Button
│       ├── Research Cues Button
│       └── Info Box
│
└── DragOverlay (Visual feedback during drag)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│  movementsApi.getAll() → Fetches all movements              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store (Global State)              │
│                                                              │
│  State:                          Actions:                    │
│  • movements: Movement[]         • setMovements()           │
│  • currentClass: ClassPlan       • addMovementToSequence()  │
│  • isLoading: boolean            • removeMovement()         │
│  • toast: ToastMessage           • reorderSequence()        │
│                                  • updateClassDetails()     │
│                                  • calculateMuscleBalance() │
│                                  • clearSequence()          │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
               ↓                           ↓
    ┌──────────────────┐       ┌──────────────────────┐
    │ MovementLibrary  │       │   SequenceCanvas     │
    │                  │       │                      │
    │ Reads:           │       │ Reads:               │
    │ • movements      │       │ • currentClass       │
    │                  │       │                      │
    │ Writes:          │       │ Writes:              │
    │ (none - display  │       │ • removeMovement()   │
    │  only, drag src) │       │ • reorderSequence()  │
    └──────────────────┘       └──────────────────────┘
               │                           ↑
               │   (drag & drop event)     │
               └───────────────────────────┘
                  addMovementToSequence()

    ┌──────────────────────┐  ┌──────────────────────────┐
    │ ClassDetailsPanel    │  │  MuscleBalanceTracker    │
    │                      │  │                          │
    │ Reads:               │  │ Reads:                   │
    │ • currentClass       │  │ • currentClass           │
    │                      │  │                          │
    │ Writes:              │  │ Writes:                  │
    │ • updateClassDetails │  │ • calculateMuscleBalance │
    │ • clearSequence      │  │   (computed, no write)   │
    └──────────────────────┘  └──────────────────────────┘

    ┌──────────────────────┐
    │  AIGenerationPanel   │
    │                      │
    │ Reads:               │
    │ • (none yet)         │
    │                      │
    │ Writes:              │
    │ • showToast()        │
    │ (placeholder for API)│
    └──────────────────────┘
```

## State Management Flow

### Adding a Movement to Sequence

```typescript
// User drags movement from library to canvas

1. DraggableMovementCard
   ↓ (user drags)
   useDraggable({ id: movement.id, data: movement })

2. SequenceCanvas (drop zone)
   ↓ (user drops)
   useDroppable({ id: 'sequence-canvas' })

3. ClassBuilder (handles drop)
   ↓
   handleDragEnd(event) {
     if (event.over.id === 'sequence-canvas') {
       addMovementToSequence(movement)
     }
   }

4. Zustand Store
   ↓
   addMovementToSequence: (movement) => {
     const newMovements = [
       ...currentClass.movements,
       { ...movement, sequenceIndex: currentClass.movements.length }
     ];
     set({ currentClass: { ...currentClass, movements: newMovements } });
   }

5. All components re-render with updated currentClass
   • SequenceCanvas shows new movement
   • ClassDetailsPanel updates duration
   • MuscleBalanceTracker recalculates percentages
```

### Reordering Sequence

```typescript
// User drags movement within sequence

1. SortableSequenceItem
   ↓ (user drags)
   useSortable({ id: `sequence-${movement.sequenceIndex}` })

2. ClassBuilder (handles reorder)
   ↓
   handleDragEnd(event) {
     const fromIndex = parseInt(event.active.id.split('-')[1]);
     const toIndex = parseInt(event.over.id.split('-')[1]);
     reorderSequence(fromIndex, toIndex);
   }

3. Zustand Store
   ↓
   reorderSequence: (fromIndex, toIndex) => {
     const newMovements = [...currentClass.movements];
     const [movedItem] = newMovements.splice(fromIndex, 1);
     newMovements.splice(toIndex, 0, movedItem);
     // Re-index all movements
     const reindexed = newMovements.map((m, i) => ({
       ...m,
       sequenceIndex: i
     }));
     set({ currentClass: { ...currentClass, movements: reindexed } });
   }

4. SequenceCanvas re-renders with new order
```

### Calculating Muscle Balance

```typescript
// Runs automatically when currentClass changes

1. MuscleBalanceTracker renders
   ↓
   const balance = useMemo(() => calculateMuscleBalance(), [currentClass]);

2. Zustand Store
   ↓
   calculateMuscleBalance: () => {
     const balance = { core: 0, legs: 0, arms: 0, back: 0, fullBody: 0 };

     currentClass.movements.forEach((movement) => {
       movement.primary_muscles.forEach((muscle) => {
         // Count muscle occurrences
         if (muscle.includes('core')) balance.core++;
         else if (muscle.includes('leg')) balance.legs++;
         // ... etc
       });
     });

     // Convert to percentages
     return {
       core: Math.round((balance.core / total) * 100),
       // ... etc
     };
   }

3. MuscleBalanceTracker displays bars
   • Each bar shows percentage
   • Warning appears if any > 40%
```

## Key Design Patterns

### 1. Container/Presenter Pattern
- **Container:** ClassBuilder (handles logic, API, state)
- **Presenters:** All child components (display only, minimal logic)

### 2. Compound Components
- Card + CardHeader + CardBody + CardTitle
- Used consistently across all components

### 3. Custom Hooks (from Zustand)
- `useStore((state) => state.property)` - Selector pattern
- Prevents unnecessary re-renders

### 4. Drag & Drop Abstraction
- @dnd-kit handles all drag logic
- Components just use hooks (useDraggable, useDroppable, useSortable)
- No manual event handling needed

### 5. Derived State
- Duration: calculated from movements array
- Difficulty: calculated from movement difficulties
- Muscle balance: calculated from primary muscles
- Never stored directly, always computed

## Component Communication

### Parent → Child (Props)
```typescript
// ClassBuilder passes nothing (components read from store)
<MovementLibrary /> // Reads from useStore
<SequenceCanvas />  // Reads from useStore
```

### Child → Parent (Callbacks via Store)
```typescript
// Components call store actions directly
const removeMovement = useStore((state) => state.removeMovementFromSequence);
removeMovement(index); // Updates store → triggers re-renders
```

### Sibling → Sibling (via Store)
```typescript
// MovementLibrary adds movement
addMovementToSequence(movement);

// SequenceCanvas automatically updates (store subscription)
// MuscleBalanceTracker automatically updates (store subscription)
// ClassDetailsPanel automatically updates (store subscription)
```

## Performance Optimizations

### 1. Memoization
```typescript
// Only recalculate when dependencies change
const filteredMovements = useMemo(() => {
  return movements.filter(/* ... */);
}, [movements, searchTerm, difficultyFilter, muscleFilter]);
```

### 2. Zustand Selectors
```typescript
// Only re-render when specific state changes
const movements = useStore((state) => state.movements);
// Component won't re-render if other store properties change
```

### 3. CSS Transitions
```typescript
// Hardware-accelerated transforms
className="transition-smooth" // Defined in tailwind.config
// Uses: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### 4. Conditional Rendering
```typescript
// Don't render until data exists
{movements.length > 0 ? (
  <MovementList />
) : (
  <EmptyState />
)}
```

## Error Handling Strategy

### 1. API Failures
```typescript
try {
  const response = await movementsApi.getAll();
  setMovements(response.data);
} catch (error) {
  console.error('Failed to fetch movements:', error);
  showToast('Failed to load movements. Using mock data.', 'error');
  setMovements(mockData); // Fallback
}
```

### 2. User Input Validation
- Save button disabled when no movements
- Clear button disabled when no currentClass
- Time limit warning when exceeding 60 minutes
- Muscle imbalance warning when >40%

### 3. Drag & Drop Edge Cases
```typescript
if (!over) return; // No drop target
if (!movement) return; // Invalid movement
if (activeIndex === overIndex) return; // No change needed
```

## Styling Architecture

### 1. Tailwind Utility Classes
```typescript
className="bg-burgundy-dark/30 border border-cream/20 rounded-lg"
// Uses: opacity modifiers, color variables, consistent spacing
```

### 2. CSS Custom Properties (from design system)
```css
--burgundy: hsl(355, 100%, 25%);
--cream: hsl(35, 70%, 95%);
--card-texture: /* gradient definition */
```

### 3. Responsive Design
```typescript
className="grid grid-cols-1 lg:grid-cols-12 gap-4"
// Mobile: stack, Desktop: 12-column grid
```

### 4. Hover States
```typescript
className="hover:border-cream/40 hover:shadow-glow transition-smooth"
// Consistent hover effects across all interactive elements
```

## Testing Strategy (When Implemented)

### Unit Tests
```typescript
// Test store actions
describe('addMovementToSequence', () => {
  it('should add movement with sequenceIndex', () => {
    // ... test implementation
  });
});

// Test component rendering
describe('MovementLibrary', () => {
  it('should render all movements', () => {
    // ... test implementation
  });
});
```

### Integration Tests
```typescript
// Test drag-and-drop flow
describe('ClassBuilder drag and drop', () => {
  it('should add movement to sequence on drop', () => {
    // Drag movement from library
    // Drop on canvas
    // Assert movement appears in sequence
  });
});
```

### E2E Tests
```typescript
// Test complete user flow
describe('Building a class', () => {
  it('should create and save a complete class', () => {
    // Navigate to class builder
    // Search for movements
    // Drag movements to canvas
    // Fill in class details
    // Click save
    // Assert success toast appears
  });
});
```

## Accessibility Considerations

### Keyboard Navigation
```typescript
// All interactive elements focusable
<button tabIndex={0}>...</button>

// Could add keyboard drag-and-drop:
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // Add movement
  }
}}
```

### Screen Reader Support
```typescript
// Semantic HTML
<label htmlFor="class-name">Class Name</label>
<input id="class-name" />

// Could add aria-labels:
<button aria-label="Remove movement from sequence">
  <TrashIcon />
</button>
```

### Focus Management
```typescript
// After adding movement, could focus on it:
useEffect(() => {
  if (justAdded) {
    sequenceItemRef.current?.focus();
  }
}, [justAdded]);
```

## Future Enhancements

### 1. Undo/Redo
```typescript
// Could add history to store
interface AppState {
  history: ClassPlan[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}
```

### 2. Auto-Save
```typescript
// Debounced save to localStorage
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('draft-class', JSON.stringify(currentClass));
  }, 1000);
  return () => clearTimeout(timer);
}, [currentClass]);
```

### 3. Keyboard Shortcuts
```typescript
// Global shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### 4. Validation Rules
```typescript
// Could add sequencing rule validation
const validateSequence = (movements: Movement[]) => {
  // Check spinal progression (flexion before extension)
  // Check warm-up first
  // Check cool-down last
  return { valid: boolean, errors: string[] };
};
```

## Summary

The class builder architecture follows modern React patterns with:
- **Centralized state** via Zustand
- **Compound components** for consistency
- **Drag & drop** via @dnd-kit
- **Responsive design** via Tailwind
- **Type safety** via TypeScript
- **Performance** via memoization and selectors

All components are loosely coupled, highly testable, and follow the existing MVP design system exactly.
