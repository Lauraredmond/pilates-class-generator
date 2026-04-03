# Regression & UAT Test Suite

**Purpose:** Ensure intelligent class planning continues to work correctly after code changes.

---

## Test Scripts

### 1. `test_class_generation.py`
**Role:** UAT/QA/Data Analytics Tester

**Tests:**
- ✅ Warmup variety across 10 classes
- ✅ Overall movement frequency distribution
- ✅ Variety score calculation (target: 60-80%)
- ✅ Difficulty level filtering (Beginner/Intermediate/Advanced)

**Run:**
```bash
cd tests
python3 test_class_generation.py
```

**Expected Results:**
- Warmup NOT 100% same movement (should rotate)
- Variety score >60% (after Phase 2 tracking accumulates)
- Difficulty filtering works correctly

---

### 2. `muscle_usage_test.py`
**Role:** Functional Tester

**Tests:**
- ✅ Consecutive muscle overlap between movements
- ✅ Overall class muscle distribution
- ✅ Identification of overused muscle groups

**Run:**
```bash
cd tests
python3 muscle_usage_test.py
```

**Expected Results:**
- <20% of transitions show >50% muscle overlap
- No muscle group appears in >40% of movements
- Balanced distribution across muscle groups

---

### 3. `check_api_response.py`
**Role:** Integration Tester

**Tests:**
- ✅ API response structure validation
- ✅ Muscle group data presence
- ✅ Teaching cues availability

**Run:**
```bash
cd tests
python3 check_api_response.py
```

**Expected Results:**
- API returns 200 OK
- Movement data includes muscle_groups
- Teaching cues present

---

## Regression Testing Process

**When to Run:** Before every deployment, after any changes to:
- `backend/agents/sequence_agent.py`
- `database/migrations/*`
- Movement or muscle data

**Full Regression Suite:**
```bash
cd tests
python3 test_class_generation.py && \
python3 muscle_usage_test.py && \
python3 check_api_response.py
```

**Expected Output:**
```
✅ PASS: Warmup variety check
✅ PASS: Variety score >60%
✅ PASS: Consecutive muscle overlap <20%
✅ PASS: Difficulty filtering
✅ PASS: API structure validation
```

---

## Test Baselines

### Before Fixes (Session 11)
```
❌ Warmup variety: 100% "The Hundred"
❌ Variety score: 28.3%
❌ Consecutive muscle overlap: 80% of transitions
```

### After Phase 1 Fixes
```
✅ Warmup variety: Rotating (not 100%)
⚠️  Variety score: Still ~28% (needs Phase 2 tracking to accumulate)
✅ Consecutive muscle overlap: <20% of transitions
```

### After Phase 2 Tracking (Expected after 10+ classes)
```
✅ Warmup variety: Rotating
✅ Variety score: 60-80%
✅ Consecutive muscle overlap: <20% of transitions
```

---

## CI/CD Integration

**Add to GitHub Actions (if using):**
```yaml
- name: Run Regression Tests
  run: |
    cd tests
    python3 test_class_generation.py
    python3 muscle_usage_test.py
```

**Add to Pre-Deployment Checklist:**
- [ ] Run full regression suite
- [ ] Verify all tests pass
- [ ] Check variety score is improving over time
- [ ] Review any new warnings or failures

---

## Troubleshooting

### Test Fails: "Connection refused"
**Cause:** Backend not running
**Fix:** Start backend with `uvicorn api.main:app --reload`

### Test Fails: "Variety score still low"
**Cause:** Phase 2 tracking needs time to accumulate data
**Fix:** Normal - generate 10-20 classes to build history

### Test Fails: "High consecutive muscle overlap"
**Cause:** Database may be missing muscle group data
**Fix:** Check `movement_muscles` table has data for all movements

---

Last Updated: 2025-11-19
