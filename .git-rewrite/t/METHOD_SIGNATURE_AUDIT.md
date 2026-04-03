# METHOD SIGNATURE AUDIT
## Comprehensive Review: Registered Parameters vs Actual Method Signatures

**Date:** December 3, 2025
**Purpose:** Identify parameter mismatches before they cause runtime errors

---

## ✅ SEQUENCE TOOLS - **MOSTLY CORRECT**

### Actual Signature (`sequence_tools.py:72`)
```python
def generate_sequence(
    target_duration_minutes: int,              # REQUIRED
    difficulty_level: str = "Beginner",        # Optional, default "Beginner"
    focus_areas: List[str] = None,             # Optional
    required_movements: List[str] = None,      # Optional - NOT REGISTERED
    excluded_movements: List[str] = None,      # Optional - NOT REGISTERED
    user_id: Optional[str] = None              # Optional
) -> Dict[str, Any]:
```

### Registered Parameters (`bassline_tools.py:111`)
- ✓ `target_duration_minutes` (integer, required)
- ✓ `difficulty_level` (string, enum, required)
- ✓ `focus_areas` (array, optional)
- ✓ `user_id` (string, optional)
- ✗ **MISSING:** `required_movements` (array, optional)
- ✗ **MISSING:** `excluded_movements` (array, optional)

### Impact
**LOW** - Missing parameters have defaults, won't cause immediate errors. But agent can't use these features.

---

## ❌ MUSIC TOOLS - **MAJOR MISMATCHES**

### Actual Signature (`music_tools.py:55`)
```python
def select_music(
    class_duration_minutes: int,               # REQUIRED
    energy_curve: List[float] = None,          # Optional - NOT REGISTERED
    preferred_genres: List[str] = None,        # Optional - NOT REGISTERED
    target_bpm_range: tuple = (90, 130)        # Optional - NOT REGISTERED
) -> Dict[str, Any]:
```

### Registered Parameters (`bassline_tools.py:154`)
- ✓ `class_duration_minutes` (integer, required)
- ✗ **MISMATCH:** `energy_level` (number) → Should be `energy_curve` (array of floats)
- ✗ **MISMATCH:** `stylistic_period` (string, enum) → Should be `preferred_genres` (array of strings)
- ✗ **MISSING:** `target_bpm_range` (tuple)

### Impact
**HIGH** - Will cause TypeError when agent tries to call with wrong parameter names!

**Expected Error:**
```
TypeError: select_music() got an unexpected keyword argument 'energy_level'
```

---

## ⚠️ MEDITATION TOOLS - **PARAMETER NAME MISMATCH**

### Actual Signature (`meditation_tools.py:76`)
```python
def generate_meditation(
    duration_minutes: int = 5,                 # Optional
    class_intensity: str = "moderate",         # Optional (values: "low", "moderate", "high")
    focus_theme: str = None,                   # Optional - WRONG NAME REGISTERED
    include_breathing: bool = True             # Optional - NOT REGISTERED
) -> Dict[str, Any]:
```

### Registered Parameters (`bassline_tools.py:198`)
- ✓ `duration_minutes` (integer, required)
- ⚠️ `class_intensity` (string, enum: ["gentle", "moderate", "intense"])
  **ISSUE:** Enum values don't match! Method expects "low"/"moderate"/"high", registered has "gentle"/"moderate"/"intense"
- ✗ **MISMATCH:** `theme` → Should be `focus_theme`
- ✗ **MISSING:** `include_breathing` (boolean)

### Impact
**MEDIUM** - Parameter name mismatch (`theme` vs `focus_theme`) will cause TypeError. Enum value mismatch will cause validation errors.

**Expected Error:**
```
TypeError: generate_meditation() got an unexpected keyword argument 'theme'
```

---

## ❌ RESEARCH TOOLS - **COMPLETELY WRONG**

### Actual Signature (`research_tools.py:47`)
```python
def research(
    research_type: str,                        # REQUIRED - NOT REGISTERED!
    movement_name: str = None,                 # Optional
    target_muscles: List[str] = None,          # Optional - NOT REGISTERED
    duration_minutes: int = 5,                 # Optional - NOT REGISTERED
    trimester: int = 2,                        # Optional - NOT REGISTERED
    injury_type: str = "strain",               # Optional - NOT REGISTERED
    injury_location: str = "lower_back",       # Optional - NOT REGISTERED
    trusted_sources_only: bool = True          # Optional - NOT REGISTERED
) -> Dict[str, Any]:
```

### Registered Parameters (`bassline_tools.py:237`)
- ✓ `movement_name` (string, required)
- ✗ **MISSING REQUIRED:** `research_type` (string, REQUIRED!) ← **CRITICAL**
- ✗ **WRONG:** `condition` (doesn't exist in method)
- ✗ **WRONG:** `query_type` (doesn't exist in method)
- ✗ **MISSING:** `target_muscles` (array)
- ✗ **MISSING:** `duration_minutes` (integer)
- ✗ **MISSING:** `trimester` (integer)
- ✗ **MISSING:** `injury_type` (string)
- ✗ **MISSING:** `injury_location` (string)
- ✗ **MISSING:** `trusted_sources_only` (boolean)

### Impact
**CRITICAL** - Missing required parameter `research_type` will cause immediate TypeError!

**Expected Error:**
```
TypeError: research() missing 1 required positional argument: 'research_type'
```

---

## SUMMARY OF ISSUES

### Critical (Will Cause Immediate Errors)
1. ❌ **ResearchTools:** Missing required parameter `research_type`
2. ❌ **MusicTools:** Parameter names don't match (`energy_level` vs `energy_curve`, `stylistic_period` vs `preferred_genres`)
3. ❌ **MeditationTools:** Parameter name mismatch (`theme` vs `focus_theme`)

### High Priority (Missing Functionality)
4. ⚠️ **All Tools:** Many optional parameters not registered (agent can't use these features)
5. ⚠️ **MeditationTools:** Enum values don't match ("gentle"/"intense" vs "low"/"high")

### Low Priority (Documentation)
6. ℹ️ **SequenceTools:** Missing `required_movements` and `excluded_movements` parameters (have defaults, won't error)

---

## RECOMMENDED FIXES

### Priority 1: Fix Critical Errors (Prevents Deployment)
- [ ] Fix ResearchTools parameter registration
- [ ] Fix MusicTools parameter names
- [ ] Fix MeditationTools parameter name

### Priority 2: Complete Parameter Coverage (After Deployment Works)
- [ ] Add missing optional parameters to all tools
- [ ] Fix enum value mismatches
- [ ] Test with actual agent calls

---

## NEXT STEPS

**Immediate Action:** Fix the 3 critical parameter mismatches to prevent TypeError during agent initialization.

**After Fix:** Deploy and test end-to-end to verify all tools work correctly.
