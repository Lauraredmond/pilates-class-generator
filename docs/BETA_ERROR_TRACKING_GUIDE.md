# Beta Error Tracking System - Usage Guide

**Version:** 1.0
**Created:** 2025-11-28
**Purpose:** Make technical debt visible and transparent during beta/MVP phase

---

## Overview

The Beta Error Tracking System provides **transparency into known bugs** that are bypassed to maintain app functionality during development and beta testing.

Instead of silently hiding errors, this system:
- ✅ **Logs all bypassed errors** to a database
- ✅ **Shows notifications to beta users** when issues occur
- ✅ **Provides admin dashboard** to monitor technical debt
- ✅ **Tracks fix status** for each issue
- ✅ **Generates reports** on error frequency and impact

**Philosophy:** *Make the inelegance visible, not invisible.*

---

## System Components

### 1. Database Layer (`database/migrations/004_beta_error_tracking.sql`)

**Tables:**
- `beta_errors` - Logs each bypassed error with full context
- `beta_error_stats` (view) - Aggregated statistics

**Key Fields:**
- `error_type` - Classification (e.g., `KEYERROR_BYPASS`)
- `severity` - Impact level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `status` - Current state (`ACTIVE`, `INVESTIGATING`, `FIXED`)
- `was_bypassed` - Boolean flag indicating error was suppressed
- `bypass_reason` - Explanation of why bypass was necessary
- `occurrence_count` - Number of times this error has occurred
- `user_notified` - Whether user saw a notification

**Functions:**
- `log_beta_error()` - Upsert function for logging errors (deduplicates)

### 2. Backend API (`backend/api/beta_errors.py`)

**Endpoints:**

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/beta-errors` | GET | List all beta errors | Admin only |
| `/api/beta-errors/stats` | GET | Get aggregated statistics | Admin only |
| `/api/beta-errors/{id}` | GET | Get error details | Admin only |
| `/api/beta-errors/{id}/status` | PATCH | Update error status | Admin only |
| `/api/beta-errors/count/active` | GET | Count active errors | Admin only |

**Example Usage:**
```python
# Get all active KEYERROR_BYPASS errors
GET /api/beta-errors?status=ACTIVE&error_type=KEYERROR_BYPASS

# Mark error as fixed
PATCH /api/beta-errors/{id}/status
{
  "status": "FIXED",
  "fix_commit_hash": "abc123",
  "fix_notes": "Fixed data serialization issue"
}
```

### 3. Frontend Notification (`frontend/src/components/BetaErrorNotification.tsx`)

**Component:** `<BetaErrorNotification />`

**Props:**
- `errorType` - Type of error (e.g., "KEYERROR_BYPASS")
- `message` - Human-readable error description
- `severity` - Visual styling based on impact
- `onClose` - Callback when user dismisses
- `showDetails` - Whether to show expandable tech details

**Features:**
- Non-intrusive notification in bottom-right corner
- Expandable technical details for power users
- Clear "BETA" badge to set expectations
- Helpful explanations of what happened
- Assurance that data is safe

**Example Usage:**
```typescript
<BetaErrorNotification
  errorType="KEYERROR_BYPASS"
  message="Response serialization issue bypassed"
  severity="MEDIUM"
  onClose={() => console.log('Dismissed')}
/>
```

### 4. Backend Logging (`backend/api/agents.py`)

**Integration Example:**
```python
except KeyError as e:
    import traceback

    # Log to beta_errors table
    supabase.rpc('log_beta_error', {
        'p_error_type': 'KEYERROR_BYPASS',
        'p_severity': 'MEDIUM',
        'p_endpoint': '/api/agents/generate-sequence',
        'p_error_message': f"KeyError: {str(e)}",
        'p_stack_trace': traceback.format_exc(),
        'p_user_id': user_id,
        'p_request_data': request.dict(),
        'p_response_data': result,
        'p_was_bypassed': True,
        'p_bypass_reason': 'Sequence generation succeeded but response serialization failed',
        'p_user_notified': True
    }).execute()

    # Return successful result anyway
    return result
```

---

## Usage Workflows

### For Developers: Logging a New Beta Error

**Scenario:** You discover a bug but need to bypass it to ship MVP

**Steps:**

1. **Add bypass logic in code:**
   ```python
   try:
       # Normal code path
       result = do_something()
   except KnownBugError as e:
       # Log to beta_errors table
       log_beta_error(
           error_type='KNOWN_BUG_TYPE',
           severity='MEDIUM',
           ...
       )
       # Bypass: return result anyway
       return fallback_result
   ```

2. **Create bug report:**
   - Copy `/docs/BUG_REPORT_001_MODAL_KEYERROR.md` as template
   - Fill in all sections (symptoms, root cause, fix plan)
   - Reference commit hash

3. **Add TODO comment:**
   ```python
   # TODO: Remove bypass after fixing #123
   # See /docs/BUG_REPORT_XXX.md
   ```

4. **Create GitHub issue:**
   - Label: `technical-debt`, `bug`, `beta-only`
   - Link to bug report document
   - Add to "Before Production" milestone

### For Beta Testers: Understanding Notifications

**When you see a beta notification:**

1. **Don't panic** - Your action succeeded!
2. **Read the message** - Understand what was bypassed
3. **Expand details** (optional) - See technical information
4. **Verify your data** - Check that everything saved correctly
5. **Dismiss notification** - It's automatically logged

**What to report:**
- ✅ If data is missing or incorrect after notification
- ✅ If notification appears frequently
- ❌ The notification itself (already logged)

### For Admins: Monitoring Beta Errors

**Daily workflow:**

1. **Check active count:**
   ```
   GET /api/beta-errors/count/active
   ```

2. **Review new errors:**
   ```
   GET /api/beta-errors?status=ACTIVE&limit=10
   ```

3. **Prioritize by severity:**
   - `CRITICAL` - Fix immediately
   - `HIGH` - Fix before next deploy
   - `MEDIUM` - Fix before production
   - `LOW` - Technical debt backlog

4. **Track progress:**
   ```
   PATCH /api/beta-errors/{id}/status
   {
     "status": "INVESTIGATING"
   }
   ```

5. **Mark as fixed:**
   ```
   PATCH /api/beta-errors/{id}/status
   {
     "status": "FIXED",
     "fix_commit_hash": "abc123",
     "fix_notes": "Rewrote serialization logic"
   }
   ```

**Weekly review:**
- Check `beta_error_stats` view
- Identify patterns (same error type recurring)
- Schedule fixes for high-frequency errors
- Verify fixes are working (occurrence_count should drop)

---

## Error Severity Guidelines

### CRITICAL
- **Data loss or corruption**
- **Security vulnerability**
- **Complete feature failure**
- **Action:** Fix immediately, deploy hotfix

### HIGH
- **Partial data loss**
- **Multiple users affected**
- **Core feature degraded**
- **Action:** Fix within 24-48 hours

### MEDIUM
- **Feature works with workaround**
- **Isolated to specific scenarios**
- **User can complete task**
- **Action:** Fix before production launch

### LOW
- **Cosmetic issue**
- **Rare edge case**
- **No user impact**
- **Action:** Technical debt backlog

---

## Example: The Modal KeyError Issue

### How It Was Handled

**Step 1: Bug Discovered**
- Modal not appearing
- KeyError during response serialization
- Sequence generation succeeding but not returning

**Step 2: Bypass Implemented** (Commit b120fac)
```python
except KeyError as e:
    # Log to beta_errors table
    log_beta_error(...)

    # Return successful result anyway
    if result.get('success'):
        return result
```

**Step 3: Documentation Created**
- `docs/BUG_REPORT_001_MODAL_KEYERROR.md`
- Comprehensive analysis of root cause
- Fix plan outlined

**Step 4: Transparency Enabled**
- Backend logs error to `beta_errors` table
- Frontend shows notification to user
- Admin dashboard shows error count

**Step 5: Fix Scheduled**
- Added to "Before Production" milestone
- Tracked in `beta_errors` table
- Status: `ACTIVE` → `INVESTIGATING` → `FIXED`

---

## Database Queries for Analysis

### Most Frequent Errors
```sql
SELECT
    error_type,
    COUNT(*) as occurrences,
    SUM(occurrence_count) as total_hits,
    MAX(last_occurred_at) as last_seen
FROM beta_errors
WHERE status = 'ACTIVE'
GROUP BY error_type
ORDER BY total_hits DESC;
```

### Users Most Affected
```sql
SELECT
    user_id,
    COUNT(DISTINCT error_type) as unique_errors,
    SUM(occurrence_count) as total_errors
FROM beta_errors
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_errors DESC
LIMIT 10;
```

### Bypass Rate by Endpoint
```sql
SELECT
    endpoint,
    COUNT(*) as total_errors,
    SUM(CASE WHEN was_bypassed THEN 1 ELSE 0 END) as bypassed,
    ROUND(
        100.0 * SUM(CASE WHEN was_bypassed THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) as bypass_pct
FROM beta_errors
GROUP BY endpoint
ORDER BY bypass_pct DESC;
```

### Errors Fixed Over Time
```sql
SELECT
    DATE(fixed_at) as fix_date,
    COUNT(*) as errors_fixed,
    STRING_AGG(DISTINCT error_type, ', ') as types_fixed
FROM beta_errors
WHERE status = 'FIXED'
    AND fixed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(fixed_at)
ORDER BY fix_date DESC;
```

---

## Integration with Existing Systems

### With Analytics Dashboard
```typescript
// Show beta error count in admin header
const { data: errorCount } = useBetaErrors();

<div className="admin-header">
  <span className="beta-error-badge">
    {errorCount.active_count} Active Issues
  </span>
</div>
```

### With Logging System
```python
# Enhance existing logger with beta error context
logger.error(
    f"KeyError in endpoint: {e}",
    extra={
        'beta_error_id': beta_error_id,
        'was_bypassed': True
    }
)
```

### With Monitoring (Future)
```python
# Send to Sentry/DataDog with beta_error context
sentry_sdk.capture_exception(
    e,
    tags={
        'beta_error': True,
        'bypassed': True,
        'severity': 'MEDIUM'
    }
)
```

---

## Removal Plan (When Ready for Production)

### Phase 1: Fix All Active Errors
1. Query: `SELECT * FROM beta_errors WHERE status = 'ACTIVE'`
2. Fix each error properly
3. Remove bypass code
4. Mark as `FIXED` in database
5. Verify occurrence_count stops increasing

### Phase 2: Remove System (Optional)
- **Keep database table** - Historical record useful
- **Remove frontend notifications** - Not needed in production
- **Keep admin endpoints** - Useful for post-launch monitoring
- **Archive bypass code** - Keep in git history

### Phase 3: Production Monitoring
- Transition to proper error tracking (Sentry, Rollbar, etc.)
- Keep `beta_errors` as reference
- Monitor for same errors reappearing
- Use data to improve test coverage

---

## Best Practices

### DO ✅
- **Document every bypassed error**
- **Show notifications to beta users**
- **Review weekly**
- **Prioritize by severity**
- **Fix before production**
- **Update status as you work**

### DON'T ❌
- **Bypass errors silently**
- **Ignore high-severity issues**
- **Remove tracking prematurely**
- **Ship to production with active bypasses**
- **Use this for normal error handling**
- **Treat as permanent solution**

---

## Support

**Questions about the system:**
- See `/docs/BUG_REPORT_001_MODAL_KEYERROR.md` for example
- Check database schema in `004_beta_error_tracking.sql`
- Review code in `backend/api/beta_errors.py`

**Found a bug in the bug tracker:**
- Create GitHub issue (very meta!)
- Label: `bug-tracker`, `meta`

---

**Remember:** This system exists to make technical debt *visible*, not *invisible*. Use it as a tool for transparency and prioritization, not as an excuse to ignore problems.
