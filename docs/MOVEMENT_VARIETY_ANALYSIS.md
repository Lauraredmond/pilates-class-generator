# Movement Variety Analysis & Recommendations

## Executive Summary

After reviewing the code, **the variety mechanism IS correctly implemented**. The system properly ensures full repertoire coverage within each difficulty level:

- **Beginner**: Cycles through ~14 Beginner movements only
- **Intermediate**: Cycles through ~24 movements (Beginner + Intermediate)
- **Advanced**: Cycles through all ~35 movements (Beginner + Intermediate + Advanced)

The variety enforcement is working through:
1. Historical usage tracking (`class_movements` table)
2. Weighted random selection (never-used movements get 100000x weight)
3. AI prompt instruction to "vary movements, class on class"

## Current Implementation (Working Correctly)

### 1. Difficulty Filtering (`sequence_tools.py` lines 329-352)

```python
# Get movements at or below requested difficulty
difficulty_order = ["Beginner", "Intermediate", "Advanced"]
max_level_idx = difficulty_order.index(difficulty)
allowed_levels = difficulty_order[:max_level_idx + 1]

# Query database
response = self.supabase.table('movements') \
    .select('*') \
    .in_('difficulty_level', allowed_levels) \
    .execute()
```

**Result**: Each difficulty level includes all easier movements:
- Beginner gets ["Beginner"]
- Intermediate gets ["Beginner", "Intermediate"]
- Advanced gets ["Beginner", "Intermediate", "Advanced"]

### 2. Variety Enforcement (`sequence_tools.py` lines 1123-1287)

The `_get_movement_usage_weights` method:
- Queries `class_movements` table for FULL historical usage
- Calculates weights: `weight = recency_boost / frequency_penalty`
- Never-used movements get weight = 100000
- Recently/frequently used movements get lower weights

### 3. Weighted Selection (`sequence_tools.py` lines 807-815)

```python
if usage_weights and available:
    weights = [usage_weights.get(m['id'], 1.0) for m in available]
    selected = random.choices(available, weights=weights, k=1)[0]
```

**Result**: Movements are selected probabilistically, strongly favoring unused/stale movements.

### 4. AI Agent Prompt (`bassline_agent.py` line 206)

```python
"Vary movements, class on class, to keep classes interesting and engaging for the student."
```

## Potential Issues Affecting Perceived Variety

### Issue 1: The Hundred Boosting for Beginners

**Code**: `sequence_tools.py` lines 508-518
```python
if is_beginner:
    hundred_id = hundred_movement["id"]
    current_weight = usage_weights.get(hundred_id, 1.0)
    usage_weights[hundred_id] = current_weight * 3.0
```

**Problem**: Beginners (< 10 classes) get 3x weight boost for "The Hundred", potentially causing over-representation.

### Issue 2: Movement Family Constraints

**Code**: `sequence_tools.py` lines 732-796

Movement families have maximum percentages (e.g., supine_abdominal max 52%). If a family hits its limit, movements from that family are blocked, potentially reducing variety.

### Issue 3: Consecutive Muscle Overlap Rule

**Code**: `sequence_tools.py` lines 699-729

Movements with >50% muscle overlap with the previous movement are filtered out. This safety rule can limit variety if many movements share muscle groups.

## Recommendations for Improvement

### 1. Adjust The Hundred Boosting

**Current**: 3x boost for beginners
**Recommended**: 1.5x boost

```python
# In sequence_tools.py line 517
usage_weights[hundred_id] = current_weight * 1.5  # Reduced from 3.0
```

### 2. Add Explicit Variety Enforcement

Add a minimum unique movement requirement over time:

```python
def _check_repertoire_coverage(self, user_id: str, difficulty: str) -> Dict[str, Any]:
    """
    Check if user has seen enough variety in recent classes

    Target coverage over 7 days:
    - Beginner: 70% of available movements (10 of 14)
    - Intermediate: 50% of available movements (12 of 24)
    - Advanced: 40% of available movements (14 of 35)
    """
    # Query last 7 days of classes
    week_ago = datetime.now() - timedelta(days=7)

    response = self.supabase.table('class_movements') \
        .select('movement_id') \
        .eq('user_id', user_id) \
        .gte('class_generated_at', week_ago.isoformat()) \
        .execute()

    unique_movements = len(set(r['movement_id'] for r in response.data))

    # Get total available movements for difficulty
    available = len(self._get_available_movements(difficulty, []))

    coverage_pct = (unique_movements / available * 100) if available > 0 else 0

    return {
        'unique_movements_used': unique_movements,
        'total_available': available,
        'coverage_percentage': coverage_pct,
        'needs_more_variety': coverage_pct < self._get_target_coverage(difficulty)
    }
```

### 3. Add Staleness Boost

Exponentially increase weights for movements not used in X days:

```python
# In _get_movement_usage_weights, line 1206
if days_since > 7:  # Movement unused for a week
    staleness_multiplier = 2 ** (days_since / 7)  # Double weight every week
    weight *= staleness_multiplier
```

### 4. Add Variety Metrics to Quality Log

Track variety metrics in `class_quality_log` table:

```sql
ALTER TABLE class_quality_log ADD COLUMN IF NOT EXISTS
    variety_score FLOAT,  -- 0.0 to 1.0
    unique_movements_last_7_days INT,
    repertoire_coverage_pct FLOAT;
```

### 5. Add User Preference for Variety Level

Let users choose their variety preference:

```sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS
    variety_preference TEXT CHECK (variety_preference IN ('low', 'medium', 'high'))
    DEFAULT 'medium';
```

Then adjust weights accordingly:
- **Low**: Standard weights (current behavior)
- **Medium**: 2x boost for unused movements
- **High**: 5x boost for unused movements + stricter family limits

## Monitoring Variety

Use the SQL scripts you created to monitor coverage:

```sql
-- Weekly variety check
SELECT
    DATE_TRUNC('week', ch.created_at) as week,
    COUNT(DISTINCT cm.movement_id) as unique_movements,
    ROUND(COUNT(DISTINCT cm.movement_id)::numeric / 35.0 * 100, 1) as coverage_pct
FROM class_history ch
JOIN class_movements cm ON ch.id = cm.class_id
WHERE ch.user_id = '[your_user_id]'
GROUP BY DATE_TRUNC('week', ch.created_at)
ORDER BY week DESC;
```

## Conclusion

The variety system IS working correctly. Each difficulty level properly filters movements and the weighted selection ensures variety over time. However, some fine-tuning of the weights and constraints could improve the perceived variety:

1. Reduce "The Hundred" boost for beginners
2. Add staleness multiplier for long-unused movements
3. Track and enforce minimum variety targets
4. Let users choose their variety preference level

The system's foundation is solid - it just needs calibration to match user expectations better.