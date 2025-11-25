# Compliance Tables Migration Guide

**Purpose:** Create GDPR and EU AI Act compliance tables in Supabase

---

## 🚀 Quick Start

Run these SQL files **one at a time** in Supabase SQL Editor:

### Step 1: ROPA Audit Log (GDPR Article 30)
1. Open `01_ropa_audit_log.sql`
2. Copy entire contents
3. Go to Supabase Dashboard → SQL Editor → New Query
4. Paste and click **Run**
5. Verify: Should see "ropa_audit_log table created successfully"

### Step 2: AI Decision Log (EU AI Act)
1. Open `02_ai_decision_log.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click **Run**
5. Verify: Should see "ai_decision_log table created successfully"

### Step 3: Bias Monitoring (EU AI Act)
1. Open `03_bias_monitoring.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click **Run**
5. Verify: Should see "bias_monitoring table created successfully"

### Step 4: Model Drift Detection (EU AI Act)
1. Open `04_model_drift_log.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click **Run**
5. Verify: Should see "model_drift_log table created successfully"

---

## ✅ Verification

After running all 4 migrations, run this query to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ropa_audit_log', 'ai_decision_log', 'bias_monitoring', 'model_drift_log')
ORDER BY table_name;

-- Should return 4 rows
```

---

## 📋 What Each Table Does

### 1. `ropa_audit_log` (GDPR Article 30)
**Purpose:** Record of Processing Activities
**Records:** Every time your app reads, creates, updates, or deletes PII
**User Rights:** Users can export this to see how their data has been processed
**Legal Requirement:** GDPR Article 30 - Mandatory for all data controllers

**Example Row:**
```json
{
  "user_id": "123-456",
  "transaction_type": "read",
  "pii_fields": ["email", "full_name"],
  "purpose": "contract",
  "processing_system": "profile_management",
  "timestamp": "2025-11-25T14:30:00Z"
}
```

### 2. `ai_decision_log` (EU AI Act)
**Purpose:** AI Transparency and Explainability
**Records:** Every AI-generated class, music recommendation, meditation script
**User Rights:** Users can see why AI made specific recommendations
**Legal Requirement:** EU AI Act - High-risk AI systems must be explainable

**Example Row:**
```json
{
  "user_id": "123-456",
  "agent_type": "sequence_agent",
  "model_name": "gpt-4",
  "reasoning": "Selected beginner movements due to user's experience level",
  "confidence_score": 0.92,
  "user_overridden": false
}
```

### 3. `bias_monitoring` (EU AI Act)
**Purpose:** Detect algorithmic bias
**Records:** AI performance metrics across demographics
**Admin Use:** Daily checks to ensure AI doesn't discriminate
**Legal Requirement:** EU AI Act - Prevent biased AI decisions

**Example Row:**
```json
{
  "metric_name": "difficulty_distribution",
  "demographic_group": "age_65+",
  "metric_value": 0.45,
  "baseline_value": 0.50,
  "deviation_percentage": -10.0,
  "alert_threshold_exceeded": false
}
```

### 4. `model_drift_log` (EU AI Act)
**Purpose:** Monitor AI model performance over time
**Records:** Changes in AI behavior that might indicate issues
**Admin Use:** Weekly checks to ensure consistent AI quality
**Legal Requirement:** EU AI Act - Ongoing monitoring of AI systems

**Example Row:**
```json
{
  "model_name": "gpt-4",
  "drift_metric": "confidence_scores",
  "current_value": 0.85,
  "baseline_value": 0.90,
  "drift_score": 0.12,
  "drift_detected": false
}
```

---

## 🔒 Security (Row Level Security)

All tables have RLS enabled:

- **ropa_audit_log:** Users can only see their own PII transactions
- **ai_decision_log:** Users can only see their own AI decisions
- **bias_monitoring:** Admin-only access (aggregate data)
- **model_drift_log:** Admin-only access (system metrics)

---

## 🐛 Troubleshooting

### Error: "relation does not exist"
**Cause:** Table wasn't created
**Fix:** Re-run the specific SQL file that failed

### Error: "column does not exist"
**Cause:** Index created before table
**Fix:** Run files in order (01, 02, 03, 04)

### Error: "permission denied"
**Cause:** Insufficient Supabase permissions
**Fix:** Ensure you're logged in as project owner

### No errors but table not visible
**Cause:** Different schema
**Fix:** Check `public` schema in Table Editor

---

## 📊 Next Steps

After creating tables:

1. ✅ **Backend Implementation**
   - Add PII logging middleware to all API endpoints
   - Add AI decision logging to all agents
   - Create compliance API endpoints (`/api/compliance/*`)

2. ✅ **Frontend Implementation**
   - Add compliance dashboard to Settings page
   - Allow users to export their data
   - Show AI decision explanations

3. ✅ **Testing**
   - Verify PII transactions are logged
   - Verify AI decisions are logged
   - Test user data export

4. ✅ **Monitoring**
   - Set up daily bias monitoring cron job
   - Set up weekly drift detection cron job
   - Configure alerts for compliance issues

---

## 📚 Documentation

See `docs/COMPLIANCE_IMPLEMENTATION_PLAN.md` for full implementation details.

---

*Created: November 25, 2025*
*Status: Ready to deploy*
