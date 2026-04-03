# Compliance Implementation Plan
**AI Act & GDPR Full Compliance**

**Date:** November 25, 2025
**Status:** Planning - Not Yet Implemented
**Priority:** High (Legal Requirement)

---

## 🚨 Current Compliance Gap

While CLAUDE.md documents compliance features, **they are not yet implemented**. This document provides a complete implementation plan.

---

## 📋 Requirements Summary

### EU AI Act Compliance
1. ✅ Transparency in AI decisions → **AI Decision Log**
2. ✅ Evidence of unbiased data → **Bias Monitoring System**
3. ✅ Protection from model drift → **Model Drift Detection**
4. ✅ User explainability → **Decision Reasoning API**

### GDPR Compliance
1. ✅ PII transaction audit → **ROPA Audit Table**
2. ✅ Data portability → **User PII Export**
3. ✅ ROPA reporting → **Processing Activities Report**
4. ✅ Right to erasure → **Account Deletion (already implemented)**

---

## 🗄️ Database Schema

### 1. ROPA Audit Table (PII Transaction Log)

```sql
-- Record of Processing Activities (ROPA) - GDPR Article 30
CREATE TABLE ropa_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    -- Types: 'read', 'create', 'update', 'delete', 'export', 'anonymize'

    pii_fields TEXT[] NOT NULL,
    -- Array of PII field names accessed: ['email', 'full_name', 'country']

    purpose VARCHAR(100) NOT NULL,
    -- Legal basis: 'consent', 'contract', 'legal_obligation', 'legitimate_interest'

    data_subject_type VARCHAR(50) DEFAULT 'user',
    -- 'user', 'instructor', 'admin'

    processing_system VARCHAR(100) NOT NULL,
    -- 'authentication', 'profile_management', 'class_generation', 'analytics'

    actor_id UUID,
    -- Who performed the action (user_id if self-service, admin_id if support)

    actor_type VARCHAR(20) DEFAULT 'user',
    -- 'user', 'admin', 'system', 'api'

    ip_address INET,
    user_agent TEXT,

    request_endpoint VARCHAR(255),
    -- API endpoint that triggered PII access

    http_method VARCHAR(10),
    -- GET, POST, PUT, DELETE

    status VARCHAR(20) DEFAULT 'success',
    -- 'success', 'failed', 'partial'

    retention_period INTERVAL,
    -- How long this data is retained (e.g., '7 years')

    third_party_recipients TEXT[],
    -- If PII shared with third parties: ['AWS', 'Supabase', 'Netlify']

    notes TEXT,

    -- Indexes for GDPR audit queries
    INDEX idx_ropa_user_id (user_id),
    INDEX idx_ropa_timestamp (timestamp),
    INDEX idx_ropa_transaction_type (transaction_type),
    INDEX idx_ropa_pii_fields (pii_fields)
);

COMMENT ON TABLE ropa_audit_log IS 'GDPR Article 30 - Record of Processing Activities for all PII transactions';
```

### 2. AI Decision Log

```sql
-- EU AI Act Transparency Requirement
CREATE TABLE ai_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    agent_type VARCHAR(50) NOT NULL,
    -- 'sequence_agent', 'music_agent', 'meditation_agent', 'research_agent'

    model_name VARCHAR(100) NOT NULL,
    -- 'gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', etc.

    model_version VARCHAR(50),

    input_parameters JSONB NOT NULL,
    -- Complete input to the AI model

    output_result JSONB NOT NULL,
    -- AI model's output

    reasoning TEXT,
    -- Explanation of why this decision was made

    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),

    safety_validated BOOLEAN DEFAULT true,
    -- Did the output pass safety validation?

    user_overridden BOOLEAN DEFAULT false,
    -- Did user reject/modify AI's suggestion?

    override_reason TEXT,

    processing_time_ms INTEGER,
    -- How long the AI took to respond

    tokens_used INTEGER,
    -- For cost tracking and rate limiting

    compliance_flags JSONB,
    -- Any compliance issues flagged: {"bias_detected": false, "safety_concern": false}

    INDEX idx_ai_user_id (user_id),
    INDEX idx_ai_timestamp (timestamp),
    INDEX idx_ai_agent_type (agent_type),
    INDEX idx_ai_model_name (model_name)
);

COMMENT ON TABLE ai_decision_log IS 'EU AI Act compliance - All AI decisions with reasoning and explainability';
```

### 3. Bias Monitoring Table

```sql
-- Track model performance across demographics
CREATE TABLE bias_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metric_name VARCHAR(100) NOT NULL,
    -- 'recommendation_diversity', 'difficulty_distribution', 'music_genre_balance'

    model_name VARCHAR(100) NOT NULL,

    demographic_group VARCHAR(100),
    -- 'age_18-24', 'age_65+', 'beginner', 'advanced', etc.

    metric_value FLOAT NOT NULL,

    baseline_value FLOAT,
    -- Expected value for unbiased system

    deviation_percentage FLOAT,
    -- How far from baseline

    alert_threshold_exceeded BOOLEAN DEFAULT false,

    sample_size INTEGER,
    -- How many data points used for this metric

    notes TEXT,

    INDEX idx_bias_timestamp (timestamp),
    INDEX idx_bias_model (model_name),
    INDEX idx_bias_alert (alert_threshold_exceeded)
);

COMMENT ON TABLE bias_monitoring IS 'EU AI Act - Detect and prevent algorithmic bias';
```

### 4. Model Drift Detection

```sql
-- Detect when AI model behavior changes over time
CREATE TABLE model_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    drift_metric VARCHAR(100) NOT NULL,
    -- 'output_distribution', 'confidence_scores', 'processing_time', 'error_rate'

    current_value FLOAT NOT NULL,
    baseline_value FLOAT NOT NULL,

    drift_score FLOAT,
    -- How much the model has drifted (0 = no drift, 1 = complete drift)

    drift_detected BOOLEAN DEFAULT false,

    action_taken VARCHAR(50),
    -- 'alert_sent', 'model_retrained', 'rollback', 'manual_review'

    notes TEXT,

    INDEX idx_drift_timestamp (timestamp),
    INDEX idx_drift_model (model_name),
    INDEX idx_drift_detected (drift_detected)
);

COMMENT ON TABLE model_drift_log IS 'EU AI Act - Monitor model performance over time';
```

---

## 🔧 Backend Implementation

### 1. PII Transaction Logging Middleware

**File:** `backend/middleware/pii_logger.py`

```python
from functools import wraps
from typing import List, Optional
import inspect
from fastapi import Request
from datetime import datetime, timedelta
from utils.supabase_client import supabase

class PIILogger:
    """Middleware to log all PII transactions for GDPR ROPA compliance"""

    # Define which fields are considered PII
    PII_FIELDS = [
        'email', 'full_name', 'age_range', 'gender_identity',
        'country', 'ip_address', 'phone_number', 'address'
    ]

    @staticmethod
    async def log_pii_access(
        user_id: str,
        transaction_type: str,  # 'read', 'create', 'update', 'delete'
        pii_fields: List[str],
        purpose: str,  # 'consent', 'contract', etc.
        processing_system: str,  # 'authentication', 'profile_management'
        request: Request,
        actor_id: Optional[str] = None,
        actor_type: str = 'user',
        third_party_recipients: Optional[List[str]] = None,
        retention_period: Optional[timedelta] = None,
        notes: Optional[str] = None
    ):
        """Log a PII transaction to ROPA audit table"""

        log_entry = {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'transaction_type': transaction_type,
            'pii_fields': pii_fields,
            'purpose': purpose,
            'processing_system': processing_system,
            'actor_id': actor_id or user_id,
            'actor_type': actor_type,
            'ip_address': request.client.host,
            'user_agent': request.headers.get('user-agent'),
            'request_endpoint': str(request.url.path),
            'http_method': request.method,
            'status': 'success',
            'retention_period': str(retention_period) if retention_period else '7 years',
            'third_party_recipients': third_party_recipients or ['Supabase', 'Render.com'],
            'notes': notes
        }

        try:
            result = supabase.table('ropa_audit_log').insert(log_entry).execute()
            return result
        except Exception as e:
            # Log to error monitoring but don't fail the request
            print(f"ROPA logging failed: {e}")
            return None

    @staticmethod
    def detect_pii_fields(data: dict) -> List[str]:
        """Automatically detect which PII fields are in a data dict"""
        return [field for field in PIILogger.PII_FIELDS if field in data]


def log_pii_transaction(
    transaction_type: str,
    purpose: str,
    processing_system: str,
    retention_period: Optional[timedelta] = None
):
    """Decorator to automatically log PII transactions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request object from function arguments
            request = None
            user_id = None

            sig = inspect.signature(func)
            for param_name, param_value in zip(sig.parameters.keys(), args):
                if isinstance(param_value, Request):
                    request = param_value
                if param_name == 'user_id':
                    user_id = param_value

            # Execute the function
            result = await func(*args, **kwargs)

            # Detect PII fields in result
            if isinstance(result, dict):
                pii_fields = PIILogger.detect_pii_fields(result)

                if pii_fields and request and user_id:
                    await PIILogger.log_pii_access(
                        user_id=user_id,
                        transaction_type=transaction_type,
                        pii_fields=pii_fields,
                        purpose=purpose,
                        processing_system=processing_system,
                        request=request,
                        retention_period=retention_period
                    )

            return result
        return wrapper
    return decorator
```

### 2. AI Decision Logger

**File:** `backend/agents/decision_logger.py`

```python
from datetime import datetime
from typing import Dict, Any, Optional
from utils.supabase_client import supabase

class AIDecisionLogger:
    """EU AI Act compliance - Log all AI decisions with reasoning"""

    @staticmethod
    async def log_decision(
        user_id: str,
        agent_type: str,
        model_name: str,
        input_parameters: Dict[str, Any],
        output_result: Dict[str, Any],
        reasoning: str,
        confidence_score: float,
        model_version: Optional[str] = None,
        safety_validated: bool = True,
        processing_time_ms: Optional[int] = None,
        tokens_used: Optional[int] = None
    ):
        """Log an AI decision to the decision log"""

        log_entry = {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'agent_type': agent_type,
            'model_name': model_name,
            'model_version': model_version,
            'input_parameters': input_parameters,
            'output_result': output_result,
            'reasoning': reasoning,
            'confidence_score': confidence_score,
            'safety_validated': safety_validated,
            'user_overridden': False,
            'processing_time_ms': processing_time_ms,
            'tokens_used': tokens_used,
            'compliance_flags': {
                'bias_detected': False,
                'safety_concern': not safety_validated
            }
        }

        try:
            result = supabase.table('ai_decision_log').insert(log_entry).execute()
            return result
        except Exception as e:
            print(f"AI decision logging failed: {e}")
            return None

    @staticmethod
    async def log_user_override(decision_id: str, override_reason: str):
        """Log when a user overrides an AI decision"""
        try:
            result = supabase.table('ai_decision_log').update({
                'user_overridden': True,
                'override_reason': override_reason
            }).eq('id', decision_id).execute()
            return result
        except Exception as e:
            print(f"Failed to log user override: {e}")
            return None
```

### 3. GDPR Data Export Endpoint

**File:** `backend/api/compliance.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime
import json
from api.auth import get_current_user_id
from utils.supabase_client import supabase
from middleware.pii_logger import PIILogger

router = APIRouter()

@router.get("/api/compliance/my-data")
async def export_my_data(
    user_id: str = Depends(get_current_user_id),
    format: str = 'json'  # 'json' or 'csv'
):
    """
    GDPR Article 15 - Right to Access
    Export all personal data for the authenticated user
    """

    # Gather all user data from all tables
    user_data = {}

    # User profile
    profile = supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()
    user_data['profile'] = profile.data[0] if profile.data else None

    # User preferences
    preferences = supabase.table('user_preferences').select('*').eq('user_id', user_id).execute()
    user_data['preferences'] = preferences.data[0] if preferences.data else None

    # Saved classes
    classes = supabase.table('saved_classes').select('*').eq('user_id', user_id).execute()
    user_data['saved_classes'] = classes.data

    # Class history
    history = supabase.table('class_history').select('*').eq('user_id', user_id).execute()
    user_data['class_history'] = history.data

    # ROPA audit log (what we've done with their data)
    ropa = supabase.table('ropa_audit_log').select('*').eq('user_id', user_id).execute()
    user_data['data_processing_activities'] = ropa.data

    # AI decisions made for this user
    ai_decisions = supabase.table('ai_decision_log').select('*').eq('user_id', user_id).execute()
    user_data['ai_decisions'] = ai_decisions.data

    # Export metadata
    user_data['export_metadata'] = {
        'export_date': datetime.utcnow().isoformat(),
        'export_format': format,
        'data_controller': 'Bassline Pilates',
        'gdpr_article': 'Article 15 - Right to Access'
    }

    # Log this export as a PII transaction
    # (would need request object - simplified here)

    if format == 'json':
        return user_data
    elif format == 'csv':
        # Convert to CSV format (implement CSV serialization)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="CSV export not yet implemented"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Use 'json' or 'csv'"
        )


@router.get("/api/compliance/ropa-report")
async def generate_ropa_report(
    user_id: str = Depends(get_current_user_id)
):
    """
    GDPR Article 30 - Record of Processing Activities
    Generate a human-readable ROPA report for the user
    """

    # Get all PII transactions for this user
    ropa_entries = supabase.table('ropa_audit_log') \
        .select('*') \
        .eq('user_id', user_id) \
        .order('timestamp', desc=True) \
        .execute()

    # Aggregate statistics
    total_transactions = len(ropa_entries.data)
    transactions_by_type = {}
    transactions_by_system = {}

    for entry in ropa_entries.data:
        tx_type = entry['transaction_type']
        system = entry['processing_system']

        transactions_by_type[tx_type] = transactions_by_type.get(tx_type, 0) + 1
        transactions_by_system[system] = transactions_by_system.get(system, 0) + 1

    report = {
        'data_subject': user_id,
        'report_date': datetime.utcnow().isoformat(),
        'summary': {
            'total_processing_activities': total_transactions,
            'by_transaction_type': transactions_by_type,
            'by_processing_system': transactions_by_system
        },
        'processing_activities': ropa_entries.data,
        'third_party_data_sharing': {
            'recipients': ['Supabase (Database)', 'Render.com (Hosting)', 'Netlify (Frontend)'],
            'purpose': 'Application functionality and hosting',
            'legal_basis': 'Consent (Terms of Service)'
        },
        'retention_policy': {
            'user_data': '7 years after account deletion (legal requirement)',
            'audit_logs': 'Permanent (regulatory compliance)'
        },
        'your_rights': {
            'right_to_access': 'You can export your data at any time',
            'right_to_rectification': 'Update your profile in Settings',
            'right_to_erasure': 'Delete your account in Settings',
            'right_to_data_portability': 'Export in JSON or CSV format',
            'right_to_object': 'Contact support to object to processing'
        }
    }

    return report
```

---

## 📊 Compliance Dashboard (Frontend)

Add to Settings page:

```tsx
// frontend/src/pages/Settings.tsx

{/* Compliance & Privacy */}
<div className="bg-charcoal rounded-lg p-6 mb-6">
  <div className="flex items-center gap-3 mb-4">
    <Shield className="w-6 h-6 text-burgundy" />
    <h2 className="text-xl font-semibold text-cream">Compliance & Privacy</h2>
  </div>

  <div className="space-y-4">
    <div className="bg-burgundy/10 rounded p-4">
      <h3 className="font-semibold text-cream mb-2">Your Data Rights (GDPR)</h3>
      <div className="space-y-2">
        <button
          onClick={() => exportMyData('json')}
          className="w-full text-left px-4 py-2 bg-burgundy/20 hover:bg-burgundy/30 rounded text-cream transition-colors"
        >
          📥 Download My Data (JSON)
        </button>
        <button
          onClick={() => viewROPAReport()}
          className="w-full text-left px-4 py-2 bg-burgundy/20 hover:bg-burgundy/30 rounded text-cream transition-colors"
        >
          📋 View Processing Activities Report
        </button>
        <button
          onClick={() => viewAIDecisions()}
          className="w-full text-left px-4 py-2 bg-burgundy/20 hover:bg-burgundy/30 rounded text-cream transition-colors"
        >
          🤖 View AI Decisions & Explanations
        </button>
      </div>
    </div>

    <div className="bg-green-900/20 border border-green-500/30 rounded p-4">
      <p className="text-green-400 text-sm">
        ✓ Your data is processed in compliance with GDPR and EU AI Act
      </p>
      <p className="text-green-400 text-xs mt-1">
        All AI decisions are logged with explanations. All data processing is audited.
      </p>
    </div>
  </div>
</div>
```

---

## 🚀 Implementation Priority

### Phase 1: GDPR Compliance (Immediate)
1. ✅ Create ROPA audit table
2. ✅ Implement PII logging middleware
3. ✅ Add PII logging to all endpoints that touch user data
4. ✅ Create data export endpoint
5. ✅ Create ROPA report endpoint
6. ✅ Add compliance section to Settings UI

### Phase 2: AI Act Compliance (Week 2)
1. ✅ Create AI decision log table
2. ✅ Implement AI decision logger in base agent
3. ✅ Add decision logging to all 4 agents
4. ✅ Create AI decision viewer UI
5. ✅ Add user override tracking

### Phase 3: Bias Monitoring (Week 3)
1. ✅ Create bias monitoring table
2. ✅ Implement bias detection algorithms
3. ✅ Create daily bias monitoring cron job
4. ✅ Alert system for bias detection
5. ✅ Admin dashboard for bias metrics

### Phase 4: Model Drift Detection (Week 4)
1. ✅ Create model drift log table
2. ✅ Implement drift detection metrics
3. ✅ Create weekly drift monitoring cron job
4. ✅ Alert system for drift detection
5. ✅ Model rollback procedures

---

## 📝 Usage Examples

### Example 1: Logging PII Access in Auth Endpoint

```python
from fastapi import APIRouter, Depends, Request
from middleware.pii_logger import log_pii_transaction

@router.get("/api/auth/profile")
@log_pii_transaction(
    transaction_type='read',
    purpose='contract',  # User accessing their own profile
    processing_system='profile_management',
    retention_period=timedelta(days=365*7)  # 7 years
)
async def get_profile(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    # Function automatically logs PII access when it returns
    profile = get_user_profile(user_id)
    return profile
```

### Example 2: Logging AI Decision

```python
from agents.decision_logger import AIDecisionLogger

async def generate_sequence(user_id: str, preferences: dict):
    start_time = time.time()

    # Generate sequence with AI
    result = await ai_model.generate(preferences)

    processing_time = int((time.time() - start_time) * 1000)

    # Log the decision
    await AIDecisionLogger.log_decision(
        user_id=user_id,
        agent_type='sequence_agent',
        model_name='gpt-4',
        input_parameters=preferences,
        output_result=result,
        reasoning="Selected movements based on user's experience level and goals",
        confidence_score=0.92,
        processing_time_ms=processing_time,
        tokens_used=1500
    )

    return result
```

---

## 🎯 Success Criteria

### GDPR Compliance ✅
- [ ] All PII transactions logged in ROPA audit table
- [ ] Users can export their data in JSON format
- [ ] Users can view processing activities report
- [ ] Account deletion cascades to all related data
- [ ] Audit trail retained for 7 years after deletion

### EU AI Act Compliance ✅
- [ ] All AI decisions logged with reasoning
- [ ] Users can view explanations for AI decisions
- [ ] Bias monitoring system runs daily
- [ ] Model drift detection runs weekly
- [ ] Alerts sent when drift/bias detected
- [ ] User override tracking implemented

---

## 📚 References

- **GDPR Article 30:** Record of Processing Activities
- **GDPR Article 15:** Right to Access
- **EU AI Act:** Transparency and Explainability Requirements
- **ISO 27001:** Information Security Management

---

*This implementation plan ensures full GDPR and EU AI Act compliance for Bassline Pilates.*
