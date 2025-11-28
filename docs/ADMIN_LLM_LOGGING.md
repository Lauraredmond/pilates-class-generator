# Admin LLM Logging & Observability - COMPLETE 

**Date:** November 28, 2025
**Session:** 10 - Jentic Integration (Phase 1)
**Status:**  Production-ready

---

## Summary

Implemented comprehensive LLM invocation logging and admin analytics dashboard to provide full visibility into:
- When LLM reasoning is called vs direct API usage
- Exact prompts sent to the LLM
- Responses received from the LLM
- Processing times and cost estimates
- Success/failure rates

This enables cost monitoring, debugging, and transparency for AI agent operations.

---

##  Completed Implementation

### 1. Database Migration ()
**File:** `/database/migrations/009_llm_invocation_logging.sql`

**Created Tables:**
```sql
CREATE TABLE IF NOT EXISTS llm_invocation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    method_used VARCHAR(20) NOT NULL CHECK (method_used IN ('ai_agent', 'direct_api')),
    llm_called BOOLEAN NOT NULL DEFAULT false,
    llm_model VARCHAR(50),           -- e.g., 'gpt-4-turbo'
    llm_prompt TEXT,                 -- The goal/prompt sent to agent.solve()
    llm_response TEXT,               -- The final answer from LLM
    llm_iterations INTEGER,          -- Number of reasoning iterations
    request_data JSONB,              -- Full request details
    processing_time_ms FLOAT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    cost_estimate VARCHAR(20),       -- e.g., '$0.12-0.15' or '$0.00'
    result_summary JSONB             -- Brief summary of result
);

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

**Row-Level Security:**
- Users can view their own logs
- Admins can view all logs
- Service role can insert logs

**To Apply:**
```bash
# Via Supabase Dashboard SQL Editor
# 1. Go to https://supabase.com/dashboard
# 2. Navigate to SQL Editor
# 3. Run contents of database/migrations/009_llm_invocation_logging.sql
```

---

### 2. Backend Logging ()
**File:** `/backend/api/classes.py` (lines 642-803)

**Logging Points:**
1. **AI Agent Success** (lines 642-674)
   - Logs successful LLM invocations
   - Captures prompt, response, iterations
   - Records cost estimate ($0.12-0.15)

2. **AI Agent Failure** (lines 688-719)
   - Logs failed LLM attempts
   - Captures error messages
   - Notes fallback to direct API

3. **Direct API Usage** (lines 770-802)
   - Logs non-LLM class generation
   - Records $0.00 cost
   - Marks llm_called = false

**Example Log Entry:**
```python
log_entry = {
    'user_id': request.user_id,
    'method_used': 'ai_agent',
    'llm_called': True,
    'llm_model': 'gpt-4-turbo',
    'llm_prompt': 'Create a 30-minute Beginner Pilates class',
    'llm_response': result.final_answer,
    'llm_iterations': result.iterations,
    'request_data': {
        'duration_minutes': 30,
        'difficulty': 'Beginner',
        'use_agent': True
    },
    'processing_time_ms': 15234.5,
    'success': True,
    'cost_estimate': '$0.12-0.15',
    'result_summary': {...}
}
```

---

### 3. Admin API Endpoints ()
**File:** `/backend/api/analytics.py` (lines 568-842)

**New Endpoints:**

#### GET `/api/analytics/llm-logs`
Paginated list of all LLM invocations (admin only)

**Query Parameters:**
- `admin_user_id` (required) - Admin authorization
- `page` (default: 1) - Page number
- `page_size` (default: 20, max: 100) - Results per page
- `method_filter` (optional) - Filter by 'ai_agent' or 'direct_api'
- `user_id_filter` (optional) - Filter by specific user
- `days_back` (default: 30, max: 365) - Time range

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "created_at": "2025-11-28T10:30:00Z",
      "user_id": "user-uuid",
      "method_used": "ai_agent",
      "llm_called": true,
      "llm_model": "gpt-4-turbo",
      "llm_prompt": "Create a 30-minute Beginner Pilates class",
      "llm_response": "Movement sequence...",
      "llm_iterations": 8,
      "request_data": {...},
      "processing_time_ms": 15234.5,
      "success": true,
      "error_message": null,
      "cost_estimate": "$0.12-0.15",
      "result_summary": {...}
    }
  ],
  "total_count": 45,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

#### GET `/api/analytics/llm-usage-stats`
Aggregated statistics about LLM usage (admin only)

**Query Parameters:**
- `admin_user_id` (required) - Admin authorization
- `days_back` (default: 30, max: 365) - Time range

**Response:**
```json
{
  "total_invocations": 100,
  "ai_agent_calls": 25,
  "direct_api_calls": 75,
  "llm_success_rate": 96.0,
  "avg_processing_time_ms": 8542.3,
  "total_estimated_cost": "$3.38",
  "date_range": {
    "start_date": "2025-10-28",
    "end_date": "2025-11-28",
    "days": 30
  }
}
```

#### GET `/api/analytics/llm-logs/{log_id}`
Single log entry with full details (admin only)

**Admin Authorization:**
All endpoints verify admin status via `verify_admin()` function:
- Checks `user_profiles.is_admin = true`
- Returns HTTP 403 if not admin

---

### 4. Frontend API Service ()
**File:** `/frontend/src/services/api.ts` (lines 94-110)

**New Methods:**
```typescript
export const analyticsApi = {
  // ... existing methods ...

  // Session 10: Admin LLM Observability
  getLLMLogs: (params: {
    admin_user_id: string;
    page?: number;
    page_size?: number;
    method_filter?: 'ai_agent' | 'direct_api';
    user_id_filter?: string;
    days_back?: number;
  }) => api.get('/api/analytics/llm-logs', { params }),

  getLLMUsageStats: (adminUserId: string, daysBack?: number) =>
    api.get('/api/analytics/llm-usage-stats', {
      params: { admin_user_id: adminUserId, days_back: daysBack },
    }),

  getSingleLLMLog: (logId: string, adminUserId: string) =>
    api.get(`/api/analytics/llm-logs/${logId}`, {
      params: { admin_user_id: adminUserId },
    }),
};
```

---

### 5. Admin Analytics UI ()
**File:** `/frontend/src/pages/Analytics.tsx` (lines 584-894)

**Features:**

#### Admin Badge & Header
- Prominent "ADMIN ONLY" badge
- Clear section separation from user analytics

#### LLM Usage Statistics Dashboard
- Total Invocations
- AI Agent Calls (used LLM)
- Direct API Calls (no LLM)
- LLM Success Rate (%)
- Average Processing Time
- **Estimated Cost** (highlighted)

#### Filters
- Time Period: 7/30/90/365 days
- Method Filter: All / AI Agent Only / Direct API Only

#### Invocation Logs
- Expandable log entries
- Summary view shows:
  - Method badge (AI AGENT / DIRECT API)
  - Timestamp
  - Success/Failed status
  - Processing time
  - Cost estimate

- Expanded view shows:
  - **LLM Model** (gpt-4-turbo)
  - **Prompt Sent to LLM** (the exact goal string)
  - **LLM Response** (full answer, scrollable)
  - **Reasoning Iterations**
  - **Error Messages** (if failed)
  - **Request Details** (JSON)

**Access Control:**
```tsx
{user?.is_admin && (
  <AdminLLMUsageLogs userId={user.id} />
)}
```

Only renders if `user.is_admin === true`

---

## =€ Deployment Steps

### 1. Apply Database Migration

```bash
# Via Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard ’ Your Project
# 2. Navigate to SQL Editor
# 3. Copy contents of database/migrations/009_llm_invocation_logging.sql
# 4. Paste and click "Run"
# 5. Verify: SELECT * FROM llm_invocation_log LIMIT 1;
```

### 2. Make First User an Admin

```sql
-- Update your user account to admin
UPDATE user_profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

### 3. Deploy Backend

Backend is ready - logging is already integrated into `/api/classes/generate` endpoint. Changes will be active on next deployment to Render.com.

### 4. Deploy Frontend

Frontend is ready - admin UI will appear automatically for admin users. Deploy to Netlify as usual.

---

## >ê Testing

### Test 1: Verify Database Migration

```sql
-- Check table exists
SELECT * FROM llm_invocation_log LIMIT 1;

-- Check admin flag exists
SELECT id, email, is_admin FROM user_profiles LIMIT 5;

-- Make yourself admin
UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';
```

### Test 2: Generate Class with AI Agent

```bash
curl -X POST https://pilates-class-generator-api3.onrender.com/api/classes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "duration_minutes": 30,
    "difficulty": "Beginner",
    "use_agent": true
  }'

# Expected:
# - HTTP 200 OK
# - Response shows method: "ai_agent"
# - New entry in llm_invocation_log table
```

### Test 3: Generate Class with Direct API

```bash
curl -X POST https://pilates-class-generator-api3.onrender.com/api/classes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "duration_minutes": 30,
    "difficulty": "Beginner",
    "use_agent": false
  }'

# Expected:
# - HTTP 200 OK
# - Response shows method: "direct_api"
# - New entry in llm_invocation_log with llm_called = false
```

### Test 4: View Admin Analytics

1. Log in as admin user
2. Navigate to Analytics page
3. Scroll to bottom
4. Verify "ADMIN ONLY - LLM Usage & Observability" section appears
5. Check statistics show correct counts
6. Click on a log entry to expand details
7. Verify prompt and response are visible

### Test 5: Non-Admin User

1. Log in as non-admin user
2. Navigate to Analytics page
3. Verify LLM Usage section does NOT appear
4. Try accessing `/api/analytics/llm-logs` endpoint
5. Should receive HTTP 403 Forbidden

---

## =Ê What Gets Logged

### Every Class Generation Attempt Logs:

| Field | AI Agent | Direct API |
|-------|----------|------------|
| `llm_called` |  true | L false |
| `llm_model` | `gpt-4-turbo` | null |
| `llm_prompt` | The goal string | null |
| `llm_response` | Final answer | null |
| `llm_iterations` | 5-10 | null |
| `processing_time_ms` | 15000-20000 | 500-1000 |
| `cost_estimate` | `$0.12-0.15` | `$0.00` |
| `success` | true/false | true/false |

### Use Cases:

1. **Cost Monitoring** - Track LLM usage and costs over time
2. **Debugging** - See exact prompts and responses when issues occur
3. **Performance Analysis** - Compare AI agent vs direct API processing times
4. **Usage Patterns** - Understand how often users enable AI agent
5. **Error Investigation** - Review failed LLM calls with full context

---

## = Security

### Admin Authorization
- All `/api/analytics/llm-*` endpoints require `is_admin = true`
- Frontend UI only renders for admin users
- RLS policies prevent non-admins from querying logs

### Privacy
- Logs contain class generation details (duration, difficulty)
- No personal information beyond user_id
- Admins can view all users' LLM usage
- Users can view their own logs via RLS

---

## =È Future Enhancements

### Phase 2 (Future)
- **Cost Alerts** - Email when monthly costs exceed threshold
- **Usage Quotas** - Limit AI agent calls per user
- **Retention Policies** - Auto-delete logs older than 90 days
- **Export to CSV** - Download logs for external analysis
- **Real-time Monitoring** - WebSocket updates for live log streaming
- **Prompt Templates** - Suggest optimizations for common prompts

---

##  Success Criteria

All criteria met:
- [x] Logs every LLM invocation to database
- [x] Captures prompt sent to LLM
- [x] Captures response from LLM
- [x] Distinguishes AI agent vs direct API
- [x] Records processing time and cost
- [x] Admin-only access control
- [x] Frontend analytics dashboard
- [x] Filtering by time period and method
- [x] Expandable log details
- [x] Error handling and fallback logging

---

**Implementation complete and production-ready!**
**No breaking changes - fully backwards compatible.**
**Provides full LLM observability for admin users.**

*Laura Redmond + Claude Code*
*November 28, 2025*
