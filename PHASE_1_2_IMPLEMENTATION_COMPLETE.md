# Phase 1 & 2 Implementation Summary

**Date:** 2025-11-19
**Status:** PARTIAL - Phase 1 Complete, Phase 2 Design Complete (needs implementation)

---

## Phase 1: COMPLETED ✅

### 1.1 Rotate Warmup Movements
**File:** `backend/agents/sequence_agent.py:314-336`

**Change:**
```python
# BEFORE: Always returned warmup_movements[0] (The Hundred)
return warmup_movements[0] if warmup_movements else movements[0]

# AFTER: Random selection for variety
if warmup_movements:
    selected = random.choice(warmup_movements)
    logger.info(f"Selected warmup movement: {selected['name']}")
    return selected
```

**Impact:** Fixes the issue where 100% of classes started with "The Hundred"

---

### 1.2 Consecutive Muscle Overlap Validation
**File:** `backend/agents/sequence_agent.py:358-419`

**Change:** Added filtering logic in `_select_next_movement()` to skip movements with >50% muscle overlap with previous movement.

```python
# Get previous movement's muscles
prev_muscles = set(mg['name'] for mg in prev_movement.get('muscle_groups', []))

# Filter candidates
for candidate in available:
    candidate_muscles = set(mg['name'] for mg in candidate.get('muscle_groups', []))
    overlap = prev_muscles & candidate_muscles
    overlap_pct = (len(overlap) / len(candidate_muscles)) * 100

    if overlap_pct < 50:
        filtered_available.append(candidate)
```

**Impact:** Reduces consecutive muscle fatigue from 80% of transitions to expected <20%

---

## Phase 2: DESIGN COMPLETE (Implementation Needed)

### 2.1 Architecture

**Existing Tables:**
- `movement_usage` table already exists in database (lines 158-180 of `database/migrations/002_create_class_planning_schema.sql`)
- `class_history` table already exists for full class tracking

**Strategy:**
1. Query `movement_usage` table to get last usage date for each movement
2. Calculate "days since last used" for each movement
3. Weight selection: `weight = (days_since_last_used + 1) ^ 2`
4. Use weighted random selection instead of pure random
5. Update `movement_usage` table after generating class

---

### 2.2 Required Methods (To Add to SequenceAgent)

#### Method 1: Get Movement Usage Weights
```python
async def _get_movement_usage_weights(
    self,
    user_id: str,
    movements: List[Dict[str, Any]]
) -> Dict[str, float]:
    """
    PHASE 2: Get movement usage weights based on history

    Returns a dict of {movement_id: weight}, where higher weight = prefer this movement
    """
    try:
        from datetime import datetime, date

        # Query movement_usage table for this user
        response = self.supabase.table('movement_usage') \
            .select('movement_id, last_used_date') \
            .eq('user_id', user_id) \
            .execute()

        usage_map = {
            item['movement_id']: item['last_used_date']
            for item in response.data
        }

        # Calculate weights for each movement
        weights = {}
        today = date.today()

        for movement in movements:
            movement_id = movement['id']

            if movement_id in usage_map:
                # Calculate days since last used
                last_used = datetime.fromisoformat(usage_map[movement_id]).date()
                days_since = (today - last_used).days

                # Weight formula: (days + 1) ^ 2
                # 1 day ago = 4, 7 days ago = 64, 14 days ago = 225, 30 days ago = 961
                weight = (days_since + 1) ** 2
            else:
                # Never used before - highest weight
                weight = 10000

            weights[movement_id] = weight

        logger.info(f"Calculated usage weights for {len(weights)} movements")
        return weights

    except Exception as e:
        logger.error(f"Error getting movement usage weights: {e}")
        # Return equal weights if error
        return {m['id']: 1.0 for m in movements}
```

#### Method 2: Update Movement Usage
```python
async def _update_movement_usage(
    self,
    user_id: str,
    sequence: List[Dict[str, Any]]
) -> None:
    """
    PHASE 2: Update movement_usage table after generating class

    Tracks which movements were used and when, for variety enforcement
    """
    try:
        from datetime import date

        today = date.today()

        # Get movement IDs from sequence (skip transitions)
        movement_ids = [
            item['id']
            for item in sequence
            if item.get('type') == 'movement'
        ]

        for movement_id in movement_ids:
            # Try to update existing record
            update_response = self.supabase.table('movement_usage') \
                .update({
                    'last_used_date': today.isoformat(),
                    'usage_count': self.supabase.rpc('increment', {'value': 1}),
                    'updated_at': 'NOW()'
                }) \
                .eq('user_id', user_id) \
                .eq('movement_id', movement_id) \
                .execute()

            # If no rows updated, insert new record
            if not update_response.data:
                self.supabase.table('movement_usage') \
                    .insert({
                        'user_id': user_id,
                        'movement_id': movement_id,
                        'last_used_date': today.isoformat(),
                        'usage_count': 1
                    }) \
                    .execute()

        logger.info(f"Updated movement usage for {len(movement_ids)} movements")

    except Exception as e:
        logger.error(f"Error updating movement usage: {e}")
        # Don't fail class generation if tracking fails
```

---

### 2.3 Integration Points

#### Point 1: Modify `_process_internal()` to update usage
**File:** `backend/agents/sequence_agent.py:88-150`

**Add after line 149 (before return statement):**
```python
# PHASE 2: Update movement usage tracking
await self._update_movement_usage(
    user_id=self.current_user_id,  # Need to store this in __init__ or pass as param
    sequence=sequence
)
```

**Note:** Need to pass `user_id` to `_process_internal()` or store in instance variable.

---

#### Point 2: Modify `_select_next_movement()` to use weighted selection
**File:** `backend/agents/sequence_agent.py:358-419`

**Replace line 419:**
```python
# BEFORE:
return random.choice(available)

# AFTER (PHASE 2):
# Get usage weights (if user_id available)
if hasattr(self, 'current_user_id') and self.current_user_id:
    weights_map = await self._get_movement_usage_weights(
        user_id=self.current_user_id,
        movements=available
    )

    # Weighted random selection
    total_weight = sum(weights_map.values())
    if total_weight > 0:
        import random
        r = random.random() * total_weight
        cumulative = 0
        for movement in available:
            cumulative += weights_map.get(movement['id'], 1.0)
            if r <= cumulative:
                logger.info(
                    f"Selected {movement['name']} (weight: {weights_map.get(movement['id'], 1.0):.1f})"
                )
                return movement

# Fallback to random if weights don't work
return random.choice(available)
```

---

## Phase 3: Database Fixes (Pending)

### 3.1 Fix `is_primary` Flags in movement_muscles Table

**SQL to Run:**
```sql
-- Example: Mark core muscles as primary for "The Hundred"
UPDATE movement_muscles
SET is_primary = true
WHERE muscle_group_name IN ('Core strength', 'Hip flexor strengthening')
  AND movement_id = (SELECT id FROM movements WHERE name = 'The Hundred');

-- TODO: Review each movement and set is_primary correctly
```

**Impact:** Improves data quality, allows better filtering of primary vs secondary muscles

---

### 3.2 Diversify Movement Database

**Action Items:**
1. Review movements where "Scapular Stability" appears (currently 100% of movements)
2. Add more movements with varied muscle targeting
3. Ensure at least 5 movements with minimal scapular engagement
4. Balance muscle group distribution across all movements

---

## Testing Plan

### Regression Tests (After Implementation)

Run these commands to verify fixes:
```bash
# Test 1: Warmup variety
python3 test_class_generation.py

# Expected: Warmup should rotate (not 100% "The Hundred")

# Test 2: Consecutive muscle usage
python3 muscle_usage_test.py

# Expected: <20% of transitions show >50% muscle overlap

# Test 3: Movement variety (after Phase 2)
python3 test_class_generation.py

# Expected: Variety score >60% (currently 28.3%)
```

---

## Implementation Checklist

### Phase 1 ✅
- [x] Rotate warmup movements
- [x] Add consecutive muscle overlap validation

### Phase 2 (In Progress)
- [ ] Add `_get_movement_usage_weights()` method
- [ ] Add `_update_movement_usage()` method
- [ ] Store `user_id` in SequenceAgent instance
- [ ] Modify `_process_internal()` to call `_update_movement_usage()`
- [ ] Modify `_select_next_movement()` to use weighted selection
- [ ] Test with real user IDs
- [ ] Verify movement_usage table updates correctly

### Phase 3 (Pending)
- [ ] Review and fix `is_primary` flags in database
- [ ] Diversify movement library
- [ ] Reduce "Scapular Stability" overuse

---

## Next Steps

1. **Complete Phase 2 implementation** (add the two methods above)
2. **Test with demo user** to verify `movement_usage` table updates
3. **Generate 10 classes** and verify variety score improves from 28.3% to >60%
4. **Run regression tests** to ensure Phase 1 fixes still work
5. **Move test scripts** to `/tests` directory
6. **Document testing process** for CI/CD

---

**Status:** Phase 1 complete, Phase 2 design complete and ready for implementation.
**Estimated Time to Complete Phase 2:** 1-2 hours
