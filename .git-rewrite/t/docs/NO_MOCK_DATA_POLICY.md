# 🚫 NO MOCK DATA POLICY

**Non-Negotiable Rule for All Development**

## Policy Statement

This application must use **ONLY real data** from approved sources. You must **NEVER** generate, invent, fabricate, or assume any data.

## ❌ Prohibited - Never Do This

**DO NOT create:**
- Mock values
- Placeholder objects
- Fake names, stats, or metrics
- Dummy arrays or collections
- Hard-coded examples
- Seeded "sample data"
- Fabricated JSON structures
- Simulated "working flows"
- Synthetic fallback values
- Assumed or guessed data

**Examples of violations:**
```typescript
// ❌ WRONG - Mock data
const mockStats = { totalClasses: 42, favoriteMovement: 'The Hundred' };
const mockUsers = [{ name: 'John Doe', email: 'john@example.com' }];
const dummyMovements = ['Roll Up', 'The Hundred', 'Teaser'];

// ❌ WRONG - Fabricated fallback
const movement = await fetchMovement(id);
return movement || { name: 'Unknown Movement', duration: 60 }; // Don't invent!

// ❌ WRONG - Placeholder data
const [users, setUsers] = useState([
  { id: 1, name: 'Sample User' }, // Don't seed state!
]);
```

## ✅ Allowed - Only Do This

**Approved data sources:**
1. **Supabase** - The only production database for this application
2. **Future RAG context sources** - Only when explicitly implemented
3. **Playwright / browser automation outputs** - Only when explicitly called and run
4. **Live user inputs** - Real-time data from actual users

**Correct approach:**
```typescript
// ✅ CORRECT - Real data from Supabase
const { data: stats, error } = await supabase
  .from('class_history')
  .select('*')
  .eq('user_id', userId);

// ✅ CORRECT - Show loading state
if (isLoading) {
  return <div>Loading analytics...</div>;
}

// ✅ CORRECT - Show empty state instead of fake data
if (!stats || stats.length === 0) {
  return <div>No data yet. Generate some classes to see your analytics!</div>;
}

// ✅ CORRECT - Render only what exists
return <div>Total Classes: {stats.totalClasses}</div>;
```

## Frontend Components Must

✅ Render **only** the actual data returned from Supabase or other real sources
✅ Show **loading indicators** instead of fabricated objects
✅ Show **empty/no-data states** instead of synthetic fallback values
✅ **Never** embed dummy JSON in components
✅ **Never** simulate "working flows" with fake values

## API Routes & Server Code Must

✅ Fetch data **directly from Supabase**
✅ **Never** return constructed or assumed sample data
✅ Only **transform or map** what actually exists in the query results
✅ **Fail safely** if data is missing
✅ Explicitly **state when a value is unknown** rather than invent it

## If a Feature is Not Yet Implemented

✅ Use `// TODO: Implement this feature` comments
❌ Do **not** generate speculative logic
❌ Do **not** simulate working functionality
❌ Do **not** return placeholder data structures

**Example:**
```typescript
// ✅ CORRECT - Feature not implemented yet
export function PracticeFrequencyChart() {
  return (
    <div className="text-cream/60 text-center py-8">
      Practice frequency chart coming soon.
      {/* TODO: Implement practice frequency tracking in class_history table */}
    </div>
  );
}

// ❌ WRONG - Simulating unimplemented feature
export function PracticeFrequencyChart() {
  const mockData = [60, 45, 0, 75, 60, 90, 30]; // DON'T DO THIS!
  return <LineChart data={mockData} />;
}
```

## Self-Reminder for AI Assistants

Before writing any code, ask yourself:

**"Am I using real data from Supabase, or am I making this up?"**

If the answer is "making this up" → **STOP**
→ Either query real data OR show an empty state
→ Never fabricate, assume, or guess

👉 **This app must use ONLY real data. Never fabricate anything.**

## Enforcement

Any code containing mock/fake/dummy data will be rejected and must be rewritten to use:
1. Real data from approved sources, OR
2. Empty states / loading states / TODO placeholders

No exceptions.

---

**Last Updated:** 2025-11-19
**Applies To:** All developers, AI assistants, and contributors
