# Bassline Pilates Orchestration Service

**Jentic-powered AI orchestration service for Pilates class generation**

## Overview

This is a standalone FastAPI service that orchestrates AI agents using Jentic's StandardAgent and Arazzo Engine to generate complete Pilates classes.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│  https://basslinemvp.netlify.app                           │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP POST /orchestrate/generate-class
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Orchestration Service (FastAPI + Jentic)                  │
│  - BasslinePilatesCoachAgent extends StandardAgent         │
│  - Arazzo Engine executes assemble_pilates_class_v1.yaml   │
│  - Calls existing Bassline API endpoints                    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP calls via Arazzo workflow
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Existing Backend API (FastAPI)                             │
│  https://pilates-class-generator-api3.onrender.com         │
│  - /api/agents/generate-sequence                            │
│  - /api/agents/select-music                                 │
│  - /api/agents/create-meditation                            │
│  - /api/agents/research-cues                                │
│  - /api/classes (create class plan)                         │
└─────────────────────────────────────────────────────────────┘
```

## Jentic Integration

### StandardAgent Pattern

This service implements Jentic's StandardAgent pattern:

```python
from standard_agent import StandardAgent, ReWOOReasoner

class BasslinePilatesCoachAgent(StandardAgent):
    """
    JENTIC PATTERN: Extends StandardAgent base class
    BASSLINE CUSTOM: Pilates domain expertise
    """
    def __init__(self):
        llm = OpenAILLM(model="gpt-4")
        reasoner = ReWOOReasoner(llm=llm, tools=tools, system_prompt="...")
        memory = {}
        super().__init__(llm=llm, reasoner=reasoner, tools=tools, memory=memory)

    def solve(self, goal: str) -> Dict:
        """
        JENTIC PATTERN: Single entry point for agent interaction
        BASSLINE CUSTOM: Validates Pilates safety rules
        """
        return super().solve(goal)
```

### Arazzo Workflow Execution

The service uses Arazzo Engine to execute declarative workflows:

```python
from arazzo_engine import ArazzoEngine

# Load workflow definition
workflow = ArazzoEngine.load("../config/assemble_pilates_class_v1.arazzo.yaml")

# Execute workflow with inputs
result = await workflow.execute({
    "user_id": "abc123",
    "target_duration_minutes": 60,
    "difficulty_level": "Intermediate"
})
```

## Installation

```bash
# Install dependencies
cd orchestration-service
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys
```

## Configuration

### Environment Variables

```bash
# OpenAI API (for StandardAgent LLM)
OPENAI_API_KEY=sk-...

# Anthropic API (alternative LLM)
ANTHROPIC_API_KEY=sk-ant-...

# Existing Bassline API
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com
BASSLINE_API_KEY=...

# Orchestration Service
PORT=8001
HOST=0.0.0.0
LOG_LEVEL=info
```

## Running

### Development

```bash
# Start server
uvicorn app.main:app --reload --port 8001

# Health check
curl http://localhost:8001/health

# Generate class
curl -X POST http://localhost:8001/orchestrate/generate-class \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "abc123",
    "target_duration_minutes": 60,
    "difficulty_level": "Intermediate"
  }'
```

### Production (Render)

Deployed to: https://bassline-orchestration.onrender.com (TBD)

```bash
# Render will run:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## API Endpoints

### `POST /orchestrate/generate-class`

Generate complete Pilates class using Arazzo workflow.

**Request:**
```json
{
  "user_id": "abc123",
  "target_duration_minutes": 60,
  "difficulty_level": "Intermediate",
  "focus_areas": ["Core", "Legs"],
  "include_music": true,
  "include_meditation": true,
  "include_research": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "class_plan_id": "uuid-...",
    "sequence": { ... },
    "music": { ... },
    "meditation": { ... },
    "metadata": {
      "workflow_id": "assemble_pilates_class_v1",
      "orchestration_engine": "Jentic Arazzo Engine",
      "total_processing_time_ms": 3450
    }
  }
}
```

### `GET /health`

Health check endpoint.

### `GET /agent/info`

Get information about BasslinePilatesCoachAgent.

## Project Structure

```
orchestration-service/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── api/
│   │   ├── orchestrate.py      # Orchestration endpoints
│   │   └── health.py           # Health check
│   └── models/
│       └── requests.py         # Request/response models
├── agents/
│   ├── bassline_agent.py       # BasslinePilatesCoachAgent (extends StandardAgent)
│   └── base.py                 # Base agent utilities
├── tools/
│   ├── api_tools.py            # Tools for calling Bassline API
│   └── validation_tools.py     # Pilates safety validation tools
├── config/
│   ├── agent_config.yaml       # Agent configuration
│   └── workflow_config.yaml    # Workflow settings
├── tests/
│   ├── test_agent.py
│   └── test_orchestration.py
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
├── Dockerfile                  # Docker container
└── README.md                   # This file
```

## Dependencies

### Jentic Libraries (Open Source)

```bash
# Standard Agent (MIT License)
pip install jentic-standard-agent

# Arazzo Engine (MIT License)
pip install jentic-arazzo-engine
```

### Other Dependencies

```bash
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
httpx>=0.25.0
python-dotenv>=1.0.0
loguru>=0.7.0
```

## Educational Goals

This service is designed to help Bassline understand Jentic's architecture:

1. **StandardAgent Pattern**: Learn modular AI agent design
2. **Arazzo Workflow DSL**: Understand declarative orchestration
3. **ReWOO Reasoning**: Study Plan→Execute→Reflect loop
4. **Tool Registry**: See how agents interact with APIs
5. **Platform Gravity**: Experience open-source → commercial pathway

### Code Annotations

All code includes extensive comments showing:
- **JENTIC PATTERN**: What comes from Jentic libraries
- **BASSLINE CUSTOM**: What we've added for Pilates domain

Example:
```python
# ============================================
# JENTIC STANDARD AGENT PATTERN
# ============================================
from standard_agent import StandardAgent

class BasslinePilatesCoachAgent(StandardAgent):
    """
    JENTIC PATTERN: Inherit from StandardAgent
    BASSLINE CUSTOM: Pilates domain logic
    """
    pass

# ============================================
# BASSLINE CUSTOMIZATION
# ============================================
def validate_sequence_safety(movements):
    """
    BASSLINE CUSTOM: Domain-specific validation
    NOT from Jentic - our Pilates expertise
    """
    pass
```

## Testing

```bash
# Run tests
pytest tests/ -v

# Test agent
pytest tests/test_agent.py -v

# Test orchestration
pytest tests/test_orchestration.py -v

# Test with real API calls
pytest tests/test_integration.py -v --runlive
```

## Deployment

### Render Configuration

**Service Name**: bassline-orchestration
**Type**: Web Service
**Build Command**: `pip install -r requirements.txt`
**Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
**Environment**: Python 3.11

**Environment Variables** (set in Render dashboard):
- `OPENAI_API_KEY`
- `BASSLINE_API_URL`
- `BASSLINE_API_KEY`

## Future Enhancements

### Phase 2: Full Data Model
- 6-section class structure (preparation, warm-up, main, transitions, cool-down, closing)
- Movement levels (L1 → L2 → L3 → Full)
- Enhanced Arazzo workflow V2

### Phase 3: Multi-modal Delivery
- Audio narration (ElevenLabs, OpenAI TTS)
- Visual demonstrations (video/images)
- Multi-modal preferences

## License

Proprietary - Bassline Pilates

## Jentic Libraries License

- **jentic-standard-agent**: MIT License
- **jentic-arazzo-engine**: MIT License

See: https://github.com/jentic/
