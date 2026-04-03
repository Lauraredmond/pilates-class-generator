# LLM Toggle Implementation Guide

**Feature:** Allow users to toggle between Direct API calls (fast, cheap) and AI Agent reasoning (intelligent, costly)

**Purpose:** Cost control - LLM calls can cost $0.12-0.15 per class, so users should be able to opt-out.

---

## Architecture Overview

```
Frontend (Settings Page)
    ↓
User Preference: "Use AI Agent" (true/false)
    ↓
Supabase user_preferences table
    ↓
Backend API receives: { use_agent: boolean }
    ↓
Route to:
  - AI Agent (Jentic StandardAgent) if true
  - Direct sequence generation if false
```

---

## Database Schema

Add column to existing `user_preferences` table:

```sql
ALTER TABLE user_preferences
ADD COLUMN use_ai_agent BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_preferences.use_ai_agent IS
'Whether to use AI agent for class generation (costly but intelligent) or direct API calls (fast but basic)';
```

---

## Backend Implementation

### 1. Update Preferences Model

**File:** `backend/models/user.py`

```python
class UserPreferences(BaseModel):
    # ... existing fields ...
    use_ai_agent: bool = False  # Default to cheaper direct API
```

### 2. Create Router Function

**File:** `backend/api/classes.py`

```python
from orchestrator.agent.bassline_agent import BasslinePilatesCoachAgent

@router.post("/api/classes/generate")
async def generate_class(
    user_id: str,
    duration: int = 30,
    difficulty: str = "Beginner",
    use_agent: bool = False,  # ← Toggle parameter
    db: Session = Depends(get_db)
):
    """
    Generate a Pilates class.

    Args:
        use_agent: If True, use AI agent with LLM reasoning (costly but intelligent)
                   If False, use direct sequence generation (fast but basic)
    """

    if use_agent:
        # Use Jentic StandardAgent (LLM reasoning)
        agent = BasslinePilatesCoachAgent()
        goal = f"Create a {duration}-minute {difficulty} Pilates class"
        result = agent.solve(goal)

        return {
            "class_plan": result.final_answer,
            "method": "ai_agent",
            "iterations": result.iterations,
            "success": result.success,
            "cost_estimate": "$0.12-0.15"  # Approximate GPT-4 cost
        }
    else:
        # Use direct API (existing logic)
        sequence = generate_sequence_direct(
            difficulty=difficulty,
            duration=duration,
            db=db
        )

        return {
            "class_plan": sequence,
            "method": "direct_api",
            "cost_estimate": "$0.00"
        }
```

---

## Frontend Implementation

### 1. Add Toggle to Settings Page

**File:** `frontend/src/pages/Settings.tsx`

```typescript
import { Switch } from '@/components/ui/switch';

function Settings() {
  const [useAiAgent, setUseAiAgent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load preference from API
  useEffect(() => {
    loadUserPreferences().then(prefs => {
      setUseAiAgent(prefs.use_ai_agent);
    });
  }, []);

  // Save preference
  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      await updateUserPreference('use_ai_agent', enabled);
      setUseAiAgent(enabled);
      toast.success('Preference saved');
    } catch (error) {
      toast.error('Failed to save preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h3>Class Generation</h3>

      <div className="setting-item">
        <div className="setting-info">
          <label htmlFor="ai-agent-toggle">
            Use AI Agent for Class Generation
          </label>
          <p className="text-sm text-gray-600">
            Enable intelligent AI reasoning for class creation.
            <strong>Note:</strong> This uses GPT-4 and costs approximately
            $0.12-0.15 per class. Disable to use faster, free direct API calls.
          </p>
        </div>

        <Switch
          id="ai-agent-toggle"
          checked={useAiAgent}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
      </div>

      {useAiAgent && (
        <div className="alert alert-info">
          <p><strong>AI Agent Enabled</strong></p>
          <p>
            Your classes will be generated using advanced AI reasoning with GPT-4.
            This provides more intelligent and adaptive class planning, but incurs
            OpenAI API costs.
          </p>
          <p className="text-sm mt-2">
            Estimated cost: $0.12-0.15 per class generated
          </p>
        </div>
      )}
    </div>
  );
}
```

### 2. Update Class Generation Call

**File:** `frontend/src/services/classService.ts`

```typescript
export async function generateClass(params: {
  userId: string;
  duration: number;
  difficulty: string;
}): Promise<ClassPlan> {
  // Get user preference
  const preferences = await getUserPreferences(params.userId);

  const response = await api.post('/api/classes/generate', {
    user_id: params.userId,
    duration: params.duration,
    difficulty: params.difficulty,
    use_agent: preferences.use_ai_agent  // ← Pass toggle value
  });

  return response.data;
}
```

---

## User Experience

### Default (Direct API - Free)

```
User clicks "Generate Class"
  ↓
Backend: Direct sequence generation
  ↓
Response time: <1 second
Cost: $0.00
Quality: Basic, rule-based
```

### With AI Agent (Enabled - Paid)

```
User clicks "Generate Class"
  ↓
Backend: Jentic StandardAgent + GPT-4
  ↓
Response time: 15-20 seconds
Cost: ~$0.12-0.15
Quality: Intelligent, adaptive, reflects on errors
```

---

## Cost Management

### Budget Alerts

Add to Settings page:

```typescript
<div className="cost-estimate">
  <h4>Estimated Monthly Cost</h4>
  {useAiAgent ? (
    <div>
      <p>If you generate 100 classes per month with AI Agent:</p>
      <p className="text-2xl font-bold">$12-15/month</p>
      <p className="text-sm text-gray-600">
        OpenAI GPT-4 API charges
      </p>
    </div>
  ) : (
    <div>
      <p className="text-2xl font-bold text-green-600">$0/month</p>
      <p className="text-sm text-gray-600">
        Direct API calls are free
      </p>
    </div>
  )}
</div>
```

### Usage Tracking

```typescript
// Track agent usage for billing
interface AgentUsage {
  userId: string;
  classesGenerated: number;
  totalCost: number;
  period: string; // "2025-11"
}
```

---

## Implementation Steps

1. ✅ **Database:** Add `use_ai_agent` column to `user_preferences`
2. ✅ **Backend:** Add routing logic to class generation endpoint
3. ✅ **Frontend:** Add toggle to Settings page
4. ✅ **Frontend:** Update class generation service to pass flag
5. ✅ **Testing:** Test both paths work correctly
6. ✅ **Documentation:** Add cost warnings to UI

---

## Future Enhancements

1. **Usage quotas:** "You have 10 free AI generations per month"
2. **Hybrid mode:** Use AI for complex requests, direct for simple ones
3. **Cost breakdown:** Show exact costs per generation
4. **Budget limits:** "Stop using AI agent when monthly cost exceeds $X"
5. **Model selection:** Let users choose gpt-3.5-turbo (cheaper) vs gpt-4-turbo (better)

---

## Testing

### Test Case 1: Direct API (Default)

```bash
curl -X POST http://localhost:8000/api/classes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "duration": 30,
    "difficulty": "Beginner",
    "use_agent": false
  }'

# Expected: Fast response (<1s), no LLM calls
```

### Test Case 2: AI Agent (Opt-in)

```bash
curl -X POST http://localhost:8000/api/classes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "duration": 30,
    "difficulty": "Beginner",
    "use_agent": true
  }'

# Expected: Slow response (15-20s), LLM calls in logs, $0.12-0.15 cost
```

---

## Conclusion

This toggle gives users **control over costs** while maintaining access to both:
- **Fast, free basic generation** (default)
- **Intelligent, costly AI generation** (opt-in)

Users can make informed decisions about when to use expensive LLM reasoning vs. simple rule-based logic.
