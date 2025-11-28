# Frontend Integration Guide

## Task 6: Wire Frontend to Orchestration Service

---

## Overview

This guide explains how to update the React frontend to call the new orchestration service instead of (or in addition to) the existing backend.

**Current Flow:**
```
Frontend → Existing Backend → Supabase
```

**New Flow (with Orchestrator):**
```
Frontend → Orchestrator Service → Agent → Arazzo → Existing Backend → Supabase
```

---

## Option 1: Gradual Migration (Recommended)

Keep both endpoints and toggle between them:

### 1. Update API Configuration

**File:** `frontend/src/config.ts` (or similar)

```typescript
export const API_CONFIG = {
  // Existing backend
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL ||
    'https://pilates-class-generator-api3.onrender.com',

  // NEW: Orchestrator service
  ORCHESTRATOR_URL: import.meta.env.VITE_ORCHESTRATOR_URL ||
    'https://bassline-orchestrator.onrender.com',

  // Feature flag: Use new orchestrator or old backend?
  USE_ORCHESTRATOR: import.meta.env.VITE_USE_ORCHESTRATOR === 'true' || false
};
```

### 2. Create Orchestrator Service Client

**File:** `frontend/src/services/orchestratorService.ts` (NEW)

```typescript
import axios from 'axios';
import { API_CONFIG } from '../config';

const orchestratorClient = axios.create({
  baseURL: API_CONFIG.ORCHESTRATOR_URL,
  timeout: 60000, // 60 seconds (agents can be slow)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
orchestratorClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OrchestratorClassRequest {
  user_id: string;
  target_duration_minutes: number;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  focus_areas?: string[];
  include_mcp_research?: boolean;
  strictness_level?: 'strict' | 'guided' | 'autonomous';
}

export interface OrchestratorClassResponse {
  success: boolean;
  data: {
    sequence: any[];
    musicPlaylist: any;
    meditationScript: string;
    totalDuration: number;
  };
  metadata: {
    agent_type: string;
    workflow_version: string;
  };
}

export const OrchestratorService = {
  async generateClass(
    request: OrchestratorClassRequest
  ): Promise<OrchestratorClassResponse> {
    const response = await orchestratorClient.post(
      '/generate-class',
      request
    );
    return response.data;
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await orchestratorClient.get('/health');
    return response.data;
  }
};
```

### 3. Update Class Generation Component

**File:** `frontend/src/components/ClassBuilder/ClassBuilder.tsx`

```typescript
import { OrchestratorService } from '../../services/orchestratorService';
import { classService } from '../../services/classService'; // Existing service
import { API_CONFIG } from '../../config';

const ClassBuilder = () => {
  // ... existing state ...

  const handleGenerateClass = async () => {
    try {
      setLoading(true);

      const request = {
        user_id: user.id,
        target_duration_minutes: duration,
        difficulty_level: difficulty,
        focus_areas: focusAreas,
        strictness_level: 'guided'
      };

      let result;

      // Use orchestrator or existing backend based on feature flag
      if (API_CONFIG.USE_ORCHESTRATOR) {
        console.log('Using new orchestrator service...');
        result = await OrchestratorService.generateClass(request);

        // Transform orchestrator response to match existing format
        setGeneratedClass({
          sequence: result.data.sequence,
          music: result.data.musicPlaylist,
          meditation: result.data.meditationScript,
          totalDuration: result.data.totalDuration
        });
      } else {
        console.log('Using existing backend...');
        // Call existing backend
        result = await classService.generateClass(request);
        setGeneratedClass(result);
      }

      toast.success('Class generated successfully!');
    } catch (error) {
      console.error('Class generation failed:', error);
      toast.error('Failed to generate class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... existing JSX ...
  );
};
```

### 4. Update Environment Variables

**File:** `frontend/.env.development`

```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_ORCHESTRATOR_URL=http://localhost:8001
VITE_USE_ORCHESTRATOR=false  # Start with false for testing
```

**File:** `frontend/.env.production`

```bash
VITE_BACKEND_URL=https://pilates-class-generator-api3.onrender.com
VITE_ORCHESTRATOR_URL=https://bassline-orchestrator.onrender.com
VITE_USE_ORCHESTRATOR=false  # Switch to true when ready
```

### 5. Test Locally

```bash
# Terminal 1: Run existing backend
cd backend
uvicorn api.main:app --reload --port 8000

# Terminal 2: Run orchestrator service
cd orchestrator
uvicorn main:app --reload --port 8001

# Terminal 3: Run frontend
cd frontend
npm run dev
```

Test with orchestrator disabled first:
```bash
VITE_USE_ORCHESTRATOR=false npm run dev
```

Then enable orchestrator:
```bash
VITE_USE_ORCHESTRATOR=true npm run dev
```

---

## Option 2: Direct Replacement (Advanced)

Replace the existing `/generate-class` call entirely:

### Update Existing Service

**File:** `frontend/src/services/classService.ts`

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_ORCHESTRATOR_URL ||
  'https://bassline-orchestrator.onrender.com';

export const classService = {
  async generateClass(params) {
    // Now calls orchestrator instead of old backend
    const response = await axios.post(`${API_URL}/generate-class`, params);
    return response.data;
  }
};
```

No other frontend changes needed - same interface, different backend.

---

## Testing Checklist

- [ ] Health check endpoint responds: `GET /health`
- [ ] Class generation works with valid params
- [ ] Error handling works (try invalid params)
- [ ] Loading states display correctly
- [ ] Generated class renders in playback UI
- [ ] Music integration still works
- [ ] Meditation script displays
- [ ] Sequence timeline renders correctly

---

## Rollback Plan

If orchestrator has issues:

1. **Immediate rollback:**
   ```bash
   # In Netlify environment variables
   VITE_USE_ORCHESTRATOR=false
   ```
   Redeploy frontend - takes ~2 minutes

2. **Partial rollback:**
   Keep orchestrator for new users, use old backend for existing users
   ```typescript
   const useOrchestrator = user.is_beta_tester || user.created_at > '2025-11-28';
   ```

3. **Debugging:**
   - Check orchestrator logs in Render dashboard
   - Compare responses: orchestrator vs old backend
   - Test with different user profiles

---

## Performance Monitoring

### Add Timing Metrics

```typescript
const handleGenerateClass = async () => {
  const startTime = performance.now();

  try {
    const result = await OrchestratorService.generateClass(request);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Class generation took ${duration.toFixed(0)}ms`);

    // Send to analytics
    analytics.track('Class Generated', {
      duration_ms: duration,
      service: 'orchestrator',
      success: true
    });

  } catch (error) {
    // Track errors
    analytics.track('Class Generation Failed', {
      service: 'orchestrator',
      error: error.message
    });
  }
};
```

### Expected Performance

- **Existing Backend:** 3-5 seconds
- **Orchestrator (Phase 1):** 4-7 seconds (slightly slower due to extra layer)
- **Orchestrator (Phase 2 optimized):** 2-4 seconds (with caching)

---

## Deployment to Netlify

### 1. Update Environment Variables

In Netlify dashboard:

**Site settings → Environment variables**

```
VITE_ORCHESTRATOR_URL=https://bassline-orchestrator.onrender.com
VITE_USE_ORCHESTRATOR=false
```

### 2. Deploy

```bash
cd frontend
npm run build
```

Or trigger automatic deployment via GitHub push.

### 3. Enable Orchestrator

Once tested and stable:

```
VITE_USE_ORCHESTRATOR=true
```

Redeploy frontend.

---

## User Experience Improvements

### Add "Powered by AI" Badge

```typescript
{API_CONFIG.USE_ORCHESTRATOR && (
  <div className="ai-badge">
    <Sparkles className="icon" />
    <span>Powered by AI Agents</span>
  </div>
)}
```

### Show Agent Reasoning (Optional)

```typescript
const [agentReasoning, setAgentReasoning] = useState<string | null>(null);

// After class generation:
if (result.metadata?.reasoning) {
  setAgentReasoning(result.metadata.reasoning);
}

// Display in UI:
{agentReasoning && (
  <div className="agent-reasoning">
    <h3>How this class was created:</h3>
    <p>{agentReasoning}</p>
  </div>
)}
```

---

## Future Enhancements

### Multi-Agent Chat Interface

Allow users to refine classes conversationally:

```typescript
const [chatHistory, setChatHistory] = useState([]);

const sendMessage = async (message: string) => {
  const response = await OrchestratorService.chat({
    message,
    context: chatHistory
  });

  setChatHistory([...chatHistory,
    { role: 'user', content: message },
    { role: 'agent', content: response.data.reply }
  ]);
};

// UI:
<ChatInterface
  messages={chatHistory}
  onSend={sendMessage}
  placeholder="Ask me to modify the class..."
/>
```

---

## Support

If you encounter issues:

1. **Check orchestrator health:**
   ```bash
   curl https://bassline-orchestrator.onrender.com/health
   ```

2. **View orchestrator logs:**
   Render dashboard → bassline-orchestrator → Logs

3. **Compare responses:**
   Call both old backend and orchestrator, compare JSON outputs

4. **Rollback if needed:**
   Set `VITE_USE_ORCHESTRATOR=false` and redeploy
