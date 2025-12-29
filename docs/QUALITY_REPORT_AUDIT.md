# Quality Report Consistency Audit

**Date:** December 29, 2025
**Purpose:** Ensure QA Report and Sequencing Report use identical logic for all rules
**Critical:** Reports must match exactly for credibility

---

## Executive Summary

**Status:** ✅ **CRITICAL FIX APPLIED** - Ready for testing (December 29, 2025)

**Key Fix:** Updated `pass_status` calculation to check BOTH Rule 1 AND Rule 2 (commit `77696c8e`)

| Aspect | QA Report (class_quality_log) | Sequencing Report (class_sequencing_reports) | Match? |
|--------|------------------------------|---------------------------------------------|--------|
| **Data Source** | `sequence` (movements only) | `movements_snapshot` filtered to movements | ✅ MATCH |
| **Rule 1 Formula** | `(overlap / next_muscles) * 100` | `(overlap / next_muscles) * 100` | ✅ MATCH |
| **Rule 1 Threshold** | ≥ 50% = FAIL | ≥ 50% = FAIL | ✅ MATCH |
| **Rule 1 Default** | `mg.get('name', '')` | `mg.get('name', '')` | ✅ MATCH |
| **Rule 2 Formula** | `(count / total_movements) * 100` | `(count / len(sequence)) * 100` | ✅ MATCH |
| **Rule 2 Threshold** | ≥ 40% = FAIL | ≥ 40% = FAIL | ✅ MATCH |
| **Rule 2 Default** | `'other'` | `'other'` | ✅ MATCH |
| **Rule 2 Data** | Reads from sequence objects | Reads from sequence objects | ✅ MATCH |
| **Rule 3 Logic** | Historical lookback (class_movements) | Historical lookback (NOT IN REPORT) | ⚠️ MISMATCH (informational only) |
| **pass_status Logic** | N/A (uses separate rule fields) | **NOW CHECKS RULE 1 + RULE 2** | ✅ **FIXED** (commit 77696c8e) |

---

## Rule 1: Consecutive Muscle Overlap

### QA Report (`sequence_tools.py` lines 177-202)

```python
# CALCULATE RULE 1 COMPLIANCE: Consecutive muscle overlap
rule1_pass = True
rule1_max_overlap = 0.0
rule1_failed_pairs = []

for i in range(len(sequence) - 1):
    curr = sequence[i]
    next_mov = sequence[i + 1]

    curr_muscles = set(mg.get('name', '') for mg in curr.get('muscle_groups', []))
    next_muscles = set(mg.get('name', '') for mg in next_mov.get('muscle_groups', []))

    if curr_muscles and next_muscles:
        overlap = curr_muscles & next_muscles
        overlap_pct = (len(overlap) / len(next_muscles)) * 100  # ← FORMULA

        if overlap_pct > rule1_max_overlap:
            rule1_max_overlap = overlap_pct

        if overlap_pct >= 50:  # ← THRESHOLD
            rule1_pass = False
            rule1_failed_pairs.append({
                'from': curr.get('name'),
                'to': next_mov.get('name'),
                'overlap_pct': round(overlap_pct, 1)
            })

# Saves to class_quality_log table:
# - rule1_muscle_repetition_pass (boolean)
# - rule1_max_consecutive_overlap_pct (float)
# - rule1_failed_pairs (JSON array)
```

### Sequencing Report (`muscle_overlap_analyzer.py` lines 75-103)

```python
# Section 2: Consecutive Overlap Analysis (CSV format)
overlap_results = []
for i in range(len(sequence) - 1):
    current = sequence[i]
    next_mov = sequence[i + 1]

    current_muscles = set(mg.get('name', '') for mg in current.get('muscle_groups', []))
    next_muscles = set(mg.get('name', '') for mg in next_mov.get('muscle_groups', []))

    if current_muscles and next_muscles:
        overlap = current_muscles & next_muscles
        overlap_count = len(overlap)
        overlap_pct = (overlap_count / len(next_muscles)) * 100  # ← FORMULA (MATCHES)

        shared_str = '; '.join(sorted(overlap)) if overlap else 'None'
        pass_fail = "✅ PASS" if overlap_pct < 50 else "❌ FAIL"  # ← THRESHOLD (MATCHES)

        overlap_results.append({
            'current': current_name,
            'next': next_name,
            'overlap_pct': overlap_pct,
            'pass': overlap_pct < 50
        })

# Summary section (lines 109-130):
if overlap_results:
    total_pairs = len(overlap_results)
    passed = sum(1 for r in overlap_results if r['pass'])
    failed = total_pairs - passed

    if failed > 0:
        lines.append(f"\n### ❌ **FAILURES DETECTED:** {failed} consecutive pair(s) exceed 50% overlap threshold")
    else:
        lines.append("\n### ✅ **ALL CHECKS PASSED:** No consecutive movements exceed 50% overlap")
```

**Verdict:** ✅ **FORMULAS MATCH** (after commit a3bb3308)

---

## Rule 2: Movement Family Balance

### QA Report (`sequence_tools.py` lines 204-212)

```python
# CALCULATE RULE 2 COMPLIANCE: Family balance
family_balance = self._calculate_family_balance(sequence)  # ← Uses sequence (movements only)
rule2_pass = all(pct < self.MAX_FAMILY_PERCENTAGE for pct in family_balance.values())  # < 40%
rule2_max_family = max(family_balance.values()) if family_balance else 0.0
rule2_overrepresented = [
    {'family': family, 'pct': round(pct, 1)}
    for family, pct in family_balance.items()
    if pct >= self.MAX_FAMILY_PERCENTAGE  # ≥ 40% = FAIL
]

# _calculate_family_balance() definition (lines 826-858):
def _calculate_family_balance(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
    family_counts = {}
    total_movements = len(sequence)  # ← Movements only (transitions already filtered)

    if total_movements == 0:
        return {}

    for movement in sequence:
        family = movement.get("movement_family", "other")  # ← DEFAULT VALUE
        if family not in family_counts:
            family_counts[family] = 0
        family_counts[family] += 1

    # Convert to percentages
    family_percentages = {
        family: (count / total_movements) * 100  # ← FORMULA
        for family, count in family_counts.items()
    }

    return family_percentages

# Saves to class_quality_log table:
# - rule2_family_balance_pass (boolean)
# - rule2_max_family_pct (float)
# - rule2_overrepresented_families (JSON array)
```

### Sequencing Report (`muscle_overlap_analyzer.py` lines 175-221)

```python
# Section 4b: Movement Family Balance Analysis
family_counts = {}
for movement in sequence:  # ← Uses sequence (movements only)
    family = movement.get('movement_family', 'other')  # ← DEFAULT VALUE (FIXED: was 'unknown')
    if family not in family_counts:
        family_counts[family] = 0
    family_counts[family] += 1

# Convert to percentages
family_percentages = {
    family: (count / len(sequence) * 100) if len(sequence) > 0 else 0  # ← FORMULA (MATCHES)
    for family, count in family_counts.items()
}

# Check for overrepresented families (>40%)
MAX_FAMILY_PERCENTAGE = 40.0  # ← THRESHOLD (MATCHES)
overrepresented_families = [
    (family, pct) for family, pct in family_percentages.items()
    if pct >= MAX_FAMILY_PERCENTAGE  # ≥ 40% = FAIL
]

# Display family distribution table
for family, count in sorted(family_counts.items(), key=lambda x: x[1], reverse=True):
    pct = family_percentages[family]
    pass_fail = "✅ PASS" if pct < MAX_FAMILY_PERCENTAGE else "❌ FAIL"
    lines.append(f"{family},{count},{pct:.1f}%,{pass_fail}")

# Summary
if overrepresented_families:
    lines.append(f"### ❌ **RULE 2 VIOLATION:** {len(overrepresented_families)} family/families exceed 40% threshold\n")
else:
    lines.append("### ✅ **RULE 2 PASSED:** All movement families are below 40% threshold\n")
```

**Verdict:** ✅ **FORMULAS MATCH** (after commits 7b13b9f1 + 31f5aea5)

---

## Rule 3: Repertoire Coverage

### QA Report (`sequence_tools.py` lines 214-240)

```python
# CALCULATE RULE 3 COMPLIANCE: Repertoire coverage
# Query historical data to check coverage
history_response = self.supabase.table('class_movements') \
    .select('movement_id') \
    .eq('user_id', user_id) \
    .execute()

unique_movements_all_time = len(set(row['movement_id'] for row in history_response.data)) if history_response.data else 0

# Check if any muscle groups are underutilized
# (This would require more complex logic - simplified for now)
rule3_pass = True  # Assume pass unless specific thresholds violated
rule3_underutilized_muscles = []  # Could be calculated from historical muscle balance

# Calculate stalest movement (days since last used)
rule3_stalest_days = 0
if history_response.data:
    # Find oldest class_generated_at timestamp
    oldest_class = min(
        (datetime.fromisoformat(row.get('class_generated_at', timestamp_now).replace('Z', '+00:00')).date()
         for row in history_response.data if row.get('class_generated_at')),
        default=date.today()
    )
    rule3_stalest_days = (date.today() - oldest_class).days

# Saves to class_quality_log table:
# - rule3_repertoire_coverage_pass (boolean - currently always True)
# - rule3_unique_movements_count (integer)
# - rule3_underutilized_muscles (JSON array - currently empty)
# - rule3_stalest_movement_days (integer)
```

### Sequencing Report (`muscle_overlap_analyzer.py` lines 91-151)

```python
# Section 6: Historical Movement Coverage Analysis (NEW - user requested)
if user_id and supabase_client:
    lines.append("## Historical Movement Coverage Analysis\n")
    lines.append("**Goal:** Track which movements you've practiced and identify gaps in your repertoire.\n")
    lines.append("**Note:** This analyzes your ENTIRE Pilates journey from day 1.\n")

    movement_coverage = _check_historical_movement_coverage(user_id, sequence, supabase_client)

    # Displays:
    # - Total Unique Movements Practiced
    # - Total Classes Analyzed
    # - Days since first class
    # - NEW MOVEMENTS (never practiced before)
    # - RARELY PRACTICED (< 3 times)
    # - STALEST MOVEMENTS (not practiced recently)
    # - CLASSICAL REPERTOIRE GAPS (classical movements never practiced)
```

**Verdict:** ❌ **CRITICAL MISMATCH**

**Issues:**
1. **QA Report:** Calculates `rule3_pass` (always True - no threshold enforcement)
2. **Sequencing Report:** Shows detailed historical movement coverage but NO pass/fail status
3. **QA Report:** Tracks `unique_movements_all_time` and `stalest_days`
4. **Sequencing Report:** Tracks `never_practiced`, `rarely_practiced`, `stale_movements`, `repertoire_gaps`
5. **Different metrics** - Cannot reconcile between reports

**Recommendation:** Rule 3 needs alignment on:
- What metrics define "pass" vs "fail"?
- Should sequencing report show Rule 3 pass/fail status?
- Should QA report track same detailed metrics as sequencing report?

---

## ❌ CRITICAL ISSUE: pass_status Field Mismatch

### Problem

The `class_sequencing_reports` table has a `pass_status` field that is calculated DIFFERENTLY from the markdown report content.

### QA Report Logic (No pass_status field - uses individual rule fields)

```python
# class_quality_log table stores:
rule1_muscle_repetition_pass: boolean
rule2_family_balance_pass: boolean
rule3_repertoire_coverage_pass: boolean
overall_pass: boolean  # AND of all 3 rules
```

### Sequencing Report Database Field Logic (`analytics.py` lines 2444-2471)

```python
# WRONG LOGIC: Only checks Rule 1, ignores Rule 2 and Rule 3
fail_count = 0
for i in range(len(movements) - 1):
    current_muscles = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
    next_muscles = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
    shared = current_muscles.intersection(next_muscles)

    if current_muscles and next_muscles:
        overlap_pct = (len(shared) / len(next_muscles) * 100) if next_muscles else 0
        if overlap_pct >= 50:
            fail_count += 1  # ← ONLY COUNTS RULE 1 FAILURES

pass_status = (fail_count == 0)  # ← WRONG: Should check Rule 2 and Rule 3 too!
```

### Sequencing Report Markdown Content Logic

```python
# Rule 1 Summary (lines 124-130):
if failed > 0:
    lines.append(f"\n### ❌ **FAILURES DETECTED:** {failed} consecutive pair(s) exceed 50% overlap threshold")
else:
    lines.append("\n### ✅ **ALL CHECKS PASSED:** No consecutive movements exceed 50% overlap")

# Rule 2 Summary (lines 209-219):
if overrepresented_families:
    lines.append(f"### ❌ **RULE 2 VIOLATION:** {len(overrepresented_families)} family/families exceed 40% threshold\n")
else:
    lines.append("### ✅ **RULE 2 PASSED:** All movement families are below 40% threshold\n")
```

**Verdict:** ❌ **CRITICAL MISMATCH**

The `pass_status` field in the database only checks Rule 1, but the markdown content shows pass/fail for both Rule 1 AND Rule 2.

This means:
- **Scenario:** Class fails Rule 2 (family balance) but passes Rule 1
- **Database:** `pass_status = TRUE` (only checked Rule 1)
- **Markdown:** Shows "❌ RULE 2 VIOLATION"
- **Result:** Database says PASS, report says FAIL → **CREDIBILITY DESTROYED**

---

## Fixes Required

### Fix 1: Update `pass_status` Calculation to Include ALL Rules ✅ **APPLIED**

**Status:** ✅ **COMPLETED** - Applied in commit `77696c8e` (December 29, 2025)

**Location:** `/Users/lauraredmond/Documents/Bassline/Projects/MVP2/backend/api/analytics.py` lines 2444-2486 (background task) and lines 2691-2731 (on-demand endpoint)

**Before (WRONG):**
```python
# Only checks Rule 1
fail_count = 0
for i in range(len(movements) - 1):
    # ... overlap calculation ...
    if overlap_pct >= 50:
        fail_count += 1

pass_status = (fail_count == 0)  # ← WRONG
```

**After (CORRECT - NOW APPLIED):**
```python
# Check BOTH Rule 1 AND Rule 2
# Rule 1: Consecutive Muscle Overlap
rule1_fail_count = 0
for i in range(len(movements) - 1):
    current_muscles = set(mg.get('name', '') for mg in movements[i].get('muscle_groups', []))
    next_muscles = set(mg.get('name', '') for mg in movements[i + 1].get('muscle_groups', []))
    shared = current_muscles.intersection(next_muscles)

    if current_muscles and next_muscles:
        overlap_pct = (len(shared) / len(next_muscles) * 100) if next_muscles else 0
        if overlap_pct >= 50:
            rule1_fail_count += 1

# Rule 2: Movement Family Balance
family_counts = {}
for movement in movements:
    family = movement.get('movement_family', 'other')  # Use 'other' to match QA report
    if family not in family_counts:
        family_counts[family] = 0
    family_counts[family] += 1

# Check if any family exceeds 40% threshold
MAX_FAMILY_PERCENTAGE = 40.0
rule2_pass = True
rule2_fail_count = 0
if movements:
    for family, count in family_counts.items():
        family_pct = (count / len(movements)) * 100
        if family_pct >= MAX_FAMILY_PERCENTAGE:
            rule2_pass = False
            rule2_fail_count += 1

# Overall pass status: BOTH Rule 1 AND Rule 2 must pass
pass_status = (rule1_fail_count == 0 and rule2_pass)

# Total fail count for database (Rule 1 failures + Rule 2 violations)
fail_count = rule1_fail_count + rule2_fail_count
```

**Implementation Details:**
- Applied to both background task (automatic report generation after class creation)
- Applied to on-demand endpoint (manual report download from Settings → Developer Tools)
- Ensures consistent pass_status calculation across all code paths
- Database field now matches markdown report content exactly

### Fix 2: Add Rule 2 Fail Count to Database

**Current Schema:**
```sql
CREATE TABLE class_sequencing_reports (
    pass_status BOOLEAN,
    fail_count INTEGER  -- Only Rule 1 failures
);
```

**Recommended Schema:**
```sql
ALTER TABLE class_sequencing_reports
ADD COLUMN rule1_fail_count INTEGER DEFAULT 0,
ADD COLUMN rule2_fail_count INTEGER DEFAULT 0,
ADD COLUMN overall_pass_status BOOLEAN;

-- Update existing logic to populate:
-- rule1_fail_count: Number of consecutive pairs with ≥50% overlap
-- rule2_fail_count: Number of families with ≥40% representation (0 or 1+ depending on violations)
-- overall_pass_status: TRUE only if BOTH rules pass
```

### Fix 3: Standardize on "Overall Pass Status"

Both reports should use the same definition:

**QA Report:** Already uses `overall_pass = rule1_pass AND rule2_pass AND rule3_pass`

**Sequencing Report:** Should use `overall_pass_status = rule1_pass AND rule2_pass`

(Note: Rule 3 is not validated in sequencing report - it's purely historical analysis)

---

## Verification Checklist

After fixes are applied, verify:

- [ ] Generate new class in dev environment
- [ ] Download sequencing report
- [ ] Check `pass_status` in `class_sequencing_reports` table
- [ ] Check markdown content (Rule 1 and Rule 2 summaries)
- [ ] Check `overall_pass` in `class_quality_log` table
- [ ] Verify all three match:
  - [ ] Database `pass_status` = Markdown "✅ ALL CHECKS PASSED" or "❌ FAILURES"
  - [ ] Database `pass_status` = QA `overall_pass` (excluding Rule 3)
  - [ ] Rule 1 results match between both reports
  - [ ] Rule 2 results match between both reports

---

## Audit Date: December 29, 2025

**Next Steps:**
1. Apply Fix 1 (update pass_status calculation)
2. Apply Fix 2 (add rule columns to database)
3. Run verification checklist
4. User confirms: Reports must match exactly for credibility
