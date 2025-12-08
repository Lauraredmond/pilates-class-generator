# Code Changes Required: Use Database Parameters Instead of Hardcoded Values

**Migration:** `015_extend_sequence_rules_for_numeric_parameters.sql`

After running this migration, the following code files need to be updated to query parameters from `sequence_rules` table instead of using hardcoded constants.

---

## 1. Frontend: `frontend/src/services/classAssembly.ts`

### ❌ Current Code (Hardcoded):

```typescript
// Section timing constants (in seconds)
export const SECTION_DURATIONS = {
  PREPARATION: 4 * 60,      // 4 minutes
  WARMUP: 3 * 60,           // 3 minutes
  COOLDOWN: 3 * 60,         // 3 minutes
  MEDITATION: 4 * 60,       // 4 minutes
  HOMECARE: 1 * 60,         // 1 minute
  TOTAL_OVERHEAD: 15 * 60   // Total: 15 minutes
};
```

### ✅ New Code (Database-Driven):

```typescript
// Cache durations (fetch once at app start)
let _cachedSectionDurations: Record<string, number> | null = null;

export async function getSectionDurations(): Promise<Record<string, number>> {
  if (_cachedSectionDurations) {
    return _cachedSectionDurations;
  }

  const token = localStorage.getItem('access_token');
  const response = await axios.get(`${API_BASE_URL}/api/sequence-rules/section-durations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  _cachedSectionDurations = response.data; // { PREPARATION: 240, WARMUP: 180, ... }
  return _cachedSectionDurations;
}

// Use in calculateMovementCount function
export async function calculateMovementCount(totalMinutes: number, avgMovementMinutes: number = 3): Promise<number> {
  const durations = await getSectionDurations();
  const totalOverhead = Object.values(durations).reduce((sum, val) => sum + val, 0);
  const availableMinutes = totalMinutes - (totalOverhead / 60);

  if (availableMinutes <= 0) {
    throw new Error(`Class duration too short. Minimum ${totalOverhead / 60} minutes required.`);
  }

  return Math.floor(availableMinutes / avgMovementMinutes);
}
```

---

## 2. Backend: New API Endpoint `/api/sequence-rules/section-durations`

**Create:** `backend/api/sequence_rules.py` (new file)

```python
from fastapi import APIRouter, Depends
from supabase import Client
from utils.auth import get_current_user
from utils.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/sequence-rules", tags=["sequence-rules"])

@router.get("/section-durations")
async def get_section_durations(
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all section durations from sequence_rules table
    Returns: { PREPARATION: 240, WARMUP: 180, COOLDOWN: 180, MEDITATION: 240, HOMECARE: 60 }
    """
    response = supabase.table('sequence_rules') \
        .select('parameter_key, value_numeric') \
        .like('parameter_key', '%_duration') \
        .execute()

    durations = {}
    for rule in response.data:
        key = rule['parameter_key'].upper().replace('_DURATION', '')
        durations[key] = rule['value_numeric']

    # Calculate total overhead
    durations['TOTAL_OVERHEAD'] = sum(v for k, v in durations.items() if k != 'TOTAL_OVERHEAD')

    return durations


@router.get("/teaching-times")
async def get_teaching_times(
    difficulty_level: str,  # 'Beginner', 'Intermediate', or 'Advanced'
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user)
):
    """
    Get teaching time per movement for given difficulty level
    Returns: { minutes_per_movement: 4, seconds_per_movement: 240 }
    """
    response = supabase.table('sequence_rules') \
        .select('value_numeric') \
        .eq('parameter_key', 'teaching_time_per_movement') \
        .eq('difficulty_level', difficulty_level.title()) \
        .single() \
        .execute()

    seconds = response.data['value_numeric']
    return {
        'minutes_per_movement': seconds / 60,
        'seconds_per_movement': seconds
    }


@router.get("/transition-time")
async def get_transition_time(
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user)
):
    """
    Get standard transition time between movements
    Returns: { minutes: 1, seconds: 60 }
    """
    response = supabase.table('sequence_rules') \
        .select('value_numeric') \
        .eq('parameter_key', 'transition_time') \
        .single() \
        .execute()

    seconds = response.data['value_numeric']
    return {
        'minutes': seconds / 60,
        'seconds': seconds
    }


@router.get("/movement-count-targets")
async def get_movement_count_targets(
    difficulty_level: str,  # 'Beginner', 'Intermediate', or 'Advanced'
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user)
):
    """
    Get target movement count for given difficulty (per 60-minute class)
    Returns: { target: 8, min: 8, max: 12 }
    """
    # Get target for this difficulty
    target_response = supabase.table('sequence_rules') \
        .select('value_numeric') \
        .eq('parameter_key', 'target_movements_per_hour') \
        .eq('difficulty_level', difficulty_level.title()) \
        .single() \
        .execute()

    # Get min/max boundaries (apply to all difficulties)
    min_response = supabase.table('sequence_rules') \
        .select('value_numeric') \
        .eq('parameter_key', 'min_movements_per_hour') \
        .single() \
        .execute()

    max_response = supabase.table('sequence_rules') \
        .select('value_numeric') \
        .eq('parameter_key', 'max_movements_per_hour') \
        .single() \
        .execute()

    return {
        'target': target_response.data['value_numeric'],
        'min': min_response.data['value_numeric'],
        'max': max_response.data['value_numeric']
    }
```

**Register router in `backend/api/main.py`:**

```python
from api.sequence_rules import router as sequence_rules_router

app.include_router(sequence_rules_router)
```

---

## 3. Backend: `backend/orchestrator/tools/sequence_tools.py`

### ❌ Current Code (Hardcoded):

```python
# Teaching time per movement (in minutes) - CRITICAL QUALITY RULE
MINUTES_PER_MOVEMENT = {
    "Beginner": 4,
    "Intermediate": 5,
    "Advanced": 6
}

# Transition time between movements (in minutes)
TRANSITION_TIME_MINUTES = 1
```

### ✅ New Code (Database-Driven):

```python
class SequenceTools:
    """Pilates movement sequencing business logic"""

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        # Cache parameters (fetch once per instance)
        self._cached_teaching_times = None
        self._cached_transition_time = None

    def _get_teaching_time(self, difficulty: str) -> int:
        """Get teaching time per movement for given difficulty (in seconds)"""
        if not self.supabase:
            # Fallback to hardcoded if database unavailable
            return {"Beginner": 240, "Intermediate": 300, "Advanced": 360}.get(difficulty, 240)

        # Cache teaching times (fetch once)
        if not self._cached_teaching_times:
            response = self.supabase.table('sequence_rules') \
                .select('difficulty_level, value_numeric') \
                .eq('parameter_key', 'teaching_time_per_movement') \
                .execute()

            self._cached_teaching_times = {
                row['difficulty_level']: row['value_numeric']
                for row in response.data
            }

        return self._cached_teaching_times.get(difficulty, 240)

    def _get_transition_time(self) -> int:
        """Get standard transition time (in seconds)"""
        if not self.supabase:
            return 60  # Fallback

        if not self._cached_transition_time:
            response = self.supabase.table('sequence_rules') \
                .select('value_numeric') \
                .eq('parameter_key', 'transition_time') \
                .single() \
                .execute()

            self._cached_transition_time = response.data['value_numeric']

        return self._cached_transition_time

    def _build_safe_sequence(
        self,
        movements: List[Dict[str, Any]],
        target_duration: int,
        required_movements: List[str],
        focus_areas: List[str],
        difficulty: str,
        user_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Build sequence following safety rules"""
        sequence = []

        # Get teaching time from database (not hardcoded!)
        teaching_time_seconds = self._get_teaching_time(difficulty)
        minutes_per_movement = teaching_time_seconds / 60

        # Get transition time from database
        transition_time_seconds = self._get_transition_time()
        transition_time_minutes = transition_time_seconds / 60

        # Calculate max movements
        max_movements = int((target_duration + transition_time_minutes) / (minutes_per_movement + transition_time_minutes))

        logger.info(
            f"Building sequence: {target_duration} min / ({minutes_per_movement:.1f} min/movement + {transition_time_minutes} min/transition) "
            f"= max {max_movements} movements"
        )

        # ... rest of method unchanged ...
```

---

## 4. Update Main Application (backend/api/main.py)

**Add startup event to cache parameters:**

```python
@app.on_event("startup")
async def cache_sequence_parameters():
    """Cache sequence planning parameters at startup for performance"""
    logger.info("Caching sequence planning parameters from database...")

    try:
        supabase = get_supabase_client()

        # Cache all section durations
        durations_response = supabase.table('sequence_rules') \
            .select('parameter_key, value_numeric') \
            .like('parameter_key', '%_duration') \
            .execute()

        app.state.section_durations = {
            row['parameter_key']: row['value_numeric']
            for row in durations_response.data
        }

        # Cache teaching times
        teaching_response = supabase.table('sequence_rules') \
            .select('difficulty_level, value_numeric') \
            .eq('parameter_key', 'teaching_time_per_movement') \
            .execute()

        app.state.teaching_times = {
            row['difficulty_level']: row['value_numeric']
            for row in teaching_response.data
        }

        logger.success(f"✅ Cached {len(app.state.section_durations)} section durations and {len(app.state.teaching_times)} teaching times")

    except Exception as e:
        logger.error(f"Failed to cache parameters: {e}")
        logger.warning("Using hardcoded fallback values")
```

---

## Benefits of This Approach

### 1. **Transparency**
- Business stakeholders can see exact timing rules in database
- Clear `business_rationale` column explains WHY each value was chosen

### 2. **Configurability**
- Change section durations without code deployment
- Adjust teaching times based on instructor feedback
- A/B test different timings easily

### 3. **Audit Trail**
- `last_changed_by` tracks who modified parameters
- `updated_at` timestamp shows when changes occurred
- Full history of rule changes preserved

### 4. **Single Source of Truth**
- No more hardcoded constants scattered across frontend/backend
- All planning rules in one `sequence_rules` table
- Code queries database instead of maintaining duplicates

### 5. **Backward Compatibility**
- Code includes fallback to hardcoded values if database unavailable
- Graceful degradation ensures app still works during migrations

---

## Testing After Migration

1. **Run migration in Supabase:**
   ```sql
   -- Run in Supabase SQL Editor
   \i database/migrations/015_extend_sequence_rules_for_numeric_parameters.sql
   ```

2. **Verify data inserted:**
   ```sql
   SELECT rule_number, parameter_key, value_numeric, value_unit, difficulty_level, description
   FROM sequence_rules
   WHERE parameter_key IS NOT NULL
   ORDER BY rule_number;
   ```

3. **Test new API endpoints:**
   ```bash
   # Get section durations
   curl http://localhost:8000/api/sequence-rules/section-durations

   # Get teaching time for Beginner
   curl http://localhost:8000/api/sequence-rules/teaching-times?difficulty_level=Beginner

   # Get transition time
   curl http://localhost:8000/api/sequence-rules/transition-time
   ```

4. **Update frontend/backend code** as shown above

5. **Test class generation** - verify it uses database values

6. **Change a parameter in database** - verify app reflects change without redeployment

---

## Rollback Plan (If Needed)

If migration causes issues:

```sql
-- Remove added columns
ALTER TABLE sequence_rules
    DROP COLUMN IF EXISTS parameter_key,
    DROP COLUMN IF EXISTS value_numeric,
    DROP COLUMN IF EXISTS value_unit,
    DROP COLUMN IF EXISTS difficulty_level,
    DROP COLUMN IF EXISTS business_rationale,
    DROP COLUMN IF EXISTS last_changed_by,
    DROP COLUMN IF EXISTS updated_at;

-- Drop index
DROP INDEX IF EXISTS idx_sequence_rules_parameter_key;

-- Delete new rules (11-22)
DELETE FROM sequence_rules WHERE rule_number >= 11;

-- Restore original Rule 1 description
UPDATE sequence_rules
SET
    parameter_key = NULL,
    value_numeric = NULL,
    value_unit = NULL,
    business_rationale = NULL
WHERE rule_number = 1;
```

Then revert code changes and redeploy with hardcoded values.
