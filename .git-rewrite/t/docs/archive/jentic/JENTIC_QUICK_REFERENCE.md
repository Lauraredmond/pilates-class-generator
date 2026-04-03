# Jentic Quick Reference Guide

**For:** Developers implementing Bassline Pilates integration
**Date:** November 28, 2025

---

## Installation

```bash
# Add to backend/orchestration/requirements.txt
standard-agent==0.1.11      # StandardAgent framework
arazzo-runner==0.9.2        # Arazzo workflow engine
jentic==0.9.5               # Jentic tool marketplace (optional)
litellm==1.74.3             # Multi-provider LLM abstraction
openai==1.100.2             # OpenAI client
pydantic>=2.0               # Data validation
redis>=5.0.1                # For agent memory
```

```bash
# Install
pip install -r requirements.txt
```

---

## Environment Variables

```bash
# .env file for orchestration service

# LLM Configuration
LLM_MODEL=gpt-4                          # or claude-sonnet-4, gemini-2.0-flash-exp
LLM_TEMPERATURE=0.2                      # Lower = more deterministic
OPENAI_API_KEY=sk-proj-...               # Your OpenAI key
ANTHROPIC_API_KEY=sk-ant-...             # If using Claude (optional)

# Jentic Configuration (optional)
JENTIC_AGENT_API_KEY=...                 # For access to 1500+ APIs
JENTIC_FILTER_BY_CREDENTIALS=false       # Only show tools user has creds for

# Bassline Configuration
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJ...

# Memory (optional)
REDIS_URL=redis://localhost:6379         # For conversation history
```

---

## Basic Usage Examples

### 1. Create a StandardAgent

```python
from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner
from agents.tools.base import JustInTimeToolingBase

# Define your custom tools (see Pilates Tool Provider section below)
from .tools.pilates_tools import PilatesToolProvider

# Create agent
agent = StandardAgent(
    llm=LiteLLM(model="gpt-4", temperature=0.2),
    tools=PilatesToolProvider(),
    memory={},  # Simple dict or Redis connection
    reasoner=ReWOOReasoner(
        llm=llm,
        tools=tools,
        memory=memory,
        max_iterations=20,
        max_retries=2
    )
)

# Use agent
result = agent.solve("Create a 60-minute intermediate Pilates class")
print(result.final_answer)
print(result.transcript)  # Full reasoning log
print(result.tool_calls)  # Tools that were used
```

### 2. Create an Arazzo Workflow

```yaml
# generate_class.arazzo.yaml
arazzo: 1.0.0
info:
  title: Pilates Class Generator
  version: 1.0.0

sourceDescriptions:
  - name: pilates_api
    url: ./pilates_api_openapi.yaml

workflows:
  - workflowId: generate_basic_class
    inputs:
      type: object
      properties:
        difficulty:
          type: string
          enum: [beginner, intermediate, advanced]

    steps:
      - stepId: search_movements
        operationId: searchMovements
        parameters:
          - name: difficulty
            in: query
            value: $inputs.difficulty
          - name: limit
            in: query
            value: 10
        outputs:
          movements: $response.body.movements

      - stepId: validate_sequence
        operationId: validateSequence
        parameters:
          - name: movement_ids
            in: body
            value: $steps.search_movements.outputs.movements
        outputs:
          is_valid: $response.body.is_valid
          validation_errors: $response.body.errors

    outputs:
      movements:
        value: $steps.search_movements.outputs.movements
      validation_result:
        value: $steps.validate_sequence.outputs.is_valid
```

```python
# Python code to run workflow
from arazzo_runner import ArazzoRunner

runner = ArazzoRunner.from_arazzo_path("./generate_class.arazzo.yaml")

result = runner.execute_workflow(
    workflow_id="generate_basic_class",
    inputs={"difficulty": "intermediate"}
)

print(result.outputs)      # Final workflow outputs
print(result.step_outputs) # Outputs from each step
```

### 3. Create Custom Tool Provider

```python
# tools/pilates_tools.py
import requests
from agents.tools.base import JustInTimeToolingBase, ToolBase
from typing import List, Dict, Any

class PilatesTool(ToolBase):
    """Wrapper for Bassline API endpoints."""

    def __init__(self, tool_id: str, name: str, description: str, endpoint: str, schema: dict):
        super().__init__(tool_id)
        self.name = name
        self.description = description
        self.endpoint = endpoint
        self.schema = schema

    def get_summary(self) -> str:
        return f"{self.id}: {self.name} - {self.description}"

    def get_details(self) -> str:
        return f"Endpoint: {self.endpoint}\nSchema: {self.schema}"

    def get_parameter_schema(self) -> Dict[str, Any]:
        return self.schema

class PilatesToolProvider(JustInTimeToolingBase):
    """Provides access to Bassline Pilates API."""

    BACKEND_URL = "https://pilates-class-generator-api3.onrender.com"

    TOOLS = [
        PilatesTool(
            tool_id="search_movements",
            name="Search Movements",
            description="Search 34 classical Pilates movements",
            endpoint="/api/movements",
            schema={
                "difficulty": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                "limit": {"type": "integer", "default": 10}
            }
        ),
        # Add more tools...
    ]

    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        """Search tools by query."""
        results = []
        for tool in self.TOOLS:
            if query.lower() in tool.name.lower() or query.lower() in tool.description.lower():
                results.append(tool)
        return results[:top_k]

    def load(self, tool: ToolBase) -> ToolBase:
        """Already fully loaded."""
        return tool

    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """Execute by calling Bassline API."""
        url = f"{self.BACKEND_URL}{tool.endpoint}"
        response = requests.get(url, params=parameters)
        response.raise_for_status()
        return response.json()
```

### 4. Hybrid Agent + Workflow

```python
# main.py - FastAPI orchestration service
from fastapi import FastAPI
from agents.standard_agent import StandardAgent
from arazzo_runner import ArazzoRunner

app = FastAPI()

# Initialize both approaches
agent = StandardAgent(...)
workflow_runner = ArazzoRunner.from_arazzo_path("./workflows/generate_class.arazzo.yaml")

@app.post("/api/generate-class")
async def generate_class(request: dict):
    # Simple task? Use workflow (fast)
    if request.get("use_ai") == False:
        result = workflow_runner.execute_workflow(
            workflow_id="generate_basic_class",
            inputs=request
        )
        return {"method": "workflow", "result": result.outputs}

    # Complex task? Use AI agent (flexible)
    else:
        result = agent.solve(f"Create a {request['difficulty']} Pilates class")
        return {"method": "agent", "result": result.final_answer}
```

---

## StandardAgent API Reference

### Constructor

```python
StandardAgent(
    llm: BaseLLM,                          # LLM instance (required)
    tools: JustInTimeToolingBase,          # Tool provider (required)
    memory: MutableMapping,                # Memory backend (required)
    reasoner: BaseReasoner,                # Reasoning strategy (required)
    goal_preprocessor: BaseGoalPreprocessor = None,  # Optional conversational improvements
    conversation_history_window: int = 5,  # Number of past interactions to remember
    timezone: str | None = None            # Session timezone (IANA format)
)
```

### Main Method

```python
result = agent.solve(goal: str) -> ReasoningResult

# Returns:
class ReasoningResult:
    success: bool              # Did the agent complete successfully?
    final_answer: str          # Final response to user
    transcript: str            # Full reasoning log
    tool_calls: List[dict]     # Tools that were used
    iterations: int            # Number of reasoning steps
```

### Agent State

```python
agent.state  # Returns AgentState enum

# Possible states:
AgentState.READY              # Agent is idle and ready
AgentState.BUSY               # Agent is currently processing
AgentState.NEEDS_ATTENTION    # Agent encountered unrecoverable error
```

---

## Arazzo Runner API Reference

### Constructor

```python
# From Arazzo file
runner = ArazzoRunner.from_arazzo_path(
    arazzo_path: str,              # Path to .arazzo.yaml file
    base_path: str | None = None   # Base path for resolving OpenAPI files
)

# From OpenAPI file only (no workflow)
runner = ArazzoRunner.from_openapi_path(
    openapi_path: str              # Path to OpenAPI spec
)
```

### Execute Workflow

```python
result = runner.execute_workflow(
    workflow_id: str,                          # ID from workflows[].workflowId
    inputs: dict[str, Any] | None = None,      # Workflow input parameters
    runtime_params: RuntimeParams | None = None # Server variables, etc.
) -> WorkflowExecutionResult

# Returns:
class WorkflowExecutionResult:
    status: WorkflowExecutionStatus   # WORKFLOW_COMPLETE or ERROR
    workflow_id: str                  # Which workflow ran
    outputs: dict[str, Any]           # Final workflow outputs
    step_outputs: dict[str, dict]     # Outputs from each step
    inputs: dict[str, Any]            # Original inputs
    error: str | None                 # Error message if failed
```

### Execute Single Operation

```python
result = runner.execute_operation(
    inputs: dict[str, Any],           # Operation parameters
    operation_id: str | None = None,  # operationId from OpenAPI
    operation_path: str | None = None # e.g., "GET /api/movements"
) -> dict[str, Any]

# Returns:
{
    "status_code": 200,
    "headers": {...},
    "body": {...}
}
```

---

## ReWOO Reasoner Configuration

```python
from agents.reasoner.rewoo import ReWOOReasoner

reasoner = ReWOOReasoner(
    llm: BaseLLM,                    # LLM instance
    tools: JustInTimeToolingBase,    # Tool provider
    memory: MutableMapping,          # Memory backend
    max_iterations: int = 20,        # Max reasoning steps before giving up
    max_retries: int = 2,            # Max retries per failed step
    top_k: int = 25                  # Number of candidate tools to consider
)
```

**Reasoning Flow:**

1. **PLAN:** LLM generates step-by-step plan with input/output dependencies
2. **EXECUTE:** Run each step sequentially, storing outputs in memory
3. **REFLECT:** If step fails, LLM analyzes error and proposes fix (retry_params, change_tool, rephrase_step, give_up)

---

## LLM Providers (LiteLLM)

```python
from agents.llm.litellm import LiteLLM

# OpenAI
llm = LiteLLM(model="gpt-4", temperature=0.2)
llm = LiteLLM(model="gpt-4-turbo")
llm = LiteLLM(model="gpt-3.5-turbo")  # Cheaper

# Anthropic
llm = LiteLLM(model="claude-sonnet-4", temperature=0.2)
llm = LiteLLM(model="claude-opus-4")

# Google
llm = LiteLLM(model="gemini-2.0-flash-exp")
llm = LiteLLM(model="gemini-1.5-pro")

# Local models (via Ollama)
llm = LiteLLM(model="ollama/llama2")
```

**All use the same interface:**

```python
# Single-turn prompt
response = llm.prompt("What is 2+2?")

# Multi-turn conversation
response = llm.completion([
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is 2+2?"}
])

# Structured JSON output
response = llm.prompt_to_json("Return {\"sum\": <2+2>}")
# Returns: {"sum": 4}
```

---

## Arazzo Expression Reference

### $inputs

Access workflow input parameters:

```yaml
- stepId: search
  parameters:
    - name: difficulty
      value: $inputs.difficulty    # From workflow inputs
```

### $steps

Access outputs from previous steps:

```yaml
- stepId: validate
  parameters:
    - name: movements
      value: $steps.search.outputs.movements  # Output from "search" step
```

### $workflows

Access outputs from dependency workflows:

```yaml
- stepId: send_email
  parameters:
    - name: class_plan
      value: $workflows.generate_class.outputs.formatted_plan
```

### $response

Access HTTP response from operation:

```yaml
outputs:
  user_email: $response.body.email
  status: $response.statusCode
  headers: $response.headers
```

---

## Common Patterns

### Pattern 1: Simple Workflow Execution

```python
from arazzo_runner import ArazzoRunner

runner = ArazzoRunner.from_arazzo_path("./workflow.arazzo.yaml")
result = runner.execute_workflow("generate_class", {"difficulty": "intermediate"})

if result.status == "workflow_complete":
    print(result.outputs)
else:
    print(f"Error: {result.error}")
```

### Pattern 2: AI Agent with Custom Tools

```python
from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner
from .tools.pilates_tools import PilatesToolProvider

llm = LiteLLM(model="gpt-4")
tools = PilatesToolProvider()

agent = StandardAgent(
    llm=llm,
    tools=tools,
    memory={},
    reasoner=ReWOOReasoner(llm=llm, tools=tools, memory={})
)

result = agent.solve("Create a 60-minute intermediate Pilates class avoiding knee-intensive movements")
print(result.final_answer)
```

### Pattern 3: Hybrid (Workflow + Agent)

```python
from fastapi import FastAPI
from agents.standard_agent import StandardAgent
from arazzo_runner import ArazzoRunner

app = FastAPI()
agent = StandardAgent(...)
runner = ArazzoRunner.from_arazzo_path("./workflow.arazzo.yaml")

@app.post("/generate-class")
async def generate_class(request: dict):
    # Use workflow for standard requests
    if "injury" not in request.get("notes", "").lower():
        result = runner.execute_workflow("generate_basic_class", request)
        return {"method": "workflow", "time": "2s", "result": result.outputs}

    # Use AI agent for complex requests
    else:
        goal = f"Create a {request['difficulty']} class. User notes: {request['notes']}"
        result = agent.solve(goal)
        return {"method": "agent", "time": "15s", "result": result.final_answer}
```

### Pattern 4: Error Handling

```python
from agents.tools.exceptions import ToolError, ToolExecutionError

try:
    result = agent.solve(goal)
    if result.success:
        return {"success": True, "data": result.final_answer}
    else:
        return {"success": False, "error": "Agent failed to complete task"}

except ToolExecutionError as e:
    # Tool API failed
    return {"success": False, "error": f"API error: {e.tool.id}", "details": str(e)}

except Exception as e:
    # Unexpected error
    return {"success": False, "error": "Unexpected error", "details": str(e)}
```

### Pattern 5: Logging and Observability

```python
import logging
from utils.logger import get_logger

logger = get_logger(__name__)

# StandardAgent automatically logs:
# - Each reasoning step
# - Tool selections
# - Parameter generation
# - Reflection decisions

# Access logs:
result = agent.solve(goal)
print(result.transcript)  # Full reasoning log
```

---

## Performance Tips

### 1. Use Workflows for Repetitive Tasks

**Slow (AI reasoning every time):**
```python
result = agent.solve("Create intermediate class")  # 15s, $0.20
```

**Fast (predefined workflow):**
```python
result = runner.execute_workflow("generate_class", {"difficulty": "intermediate"})  # 2s, $0
```

### 2. Cache Tool Results

```python
import functools
from cachetools import TTLCache

cache = TTLCache(maxsize=100, ttl=3600)  # 1 hour cache

@functools.lru_cache(maxsize=128)
def search_movements(difficulty: str, limit: int):
    return requests.get(f"{API_URL}/movements", params={"difficulty": difficulty, "limit": limit}).json()
```

### 3. Use Smaller Models for Simple Tasks

```python
# Expensive
planning_llm = LiteLLM(model="gpt-4")  # $0.03 per 1K tokens

# Cheap
validation_llm = LiteLLM(model="gpt-3.5-turbo")  # $0.001 per 1K tokens

# Use gpt-4 for planning, gpt-3.5-turbo for simple validation
```

### 4. Limit max_iterations

```python
reasoner = ReWOOReasoner(
    max_iterations=10,  # Prevent runaway loops
    max_retries=1       # Limit retry attempts
)
```

---

## Debugging Tips

### 1. Check Reasoning Transcript

```python
result = agent.solve(goal)
print(result.transcript)  # Shows full reasoning process

# Typical transcript:
# Plan generated:
# - Step 1: Search for movements (output: movements)
# - Step 2: Validate sequence (input: movements) (output: is_valid)
#
# Executing step 1: Search for movements
# Tool selected: search_movements
# Parameters generated: {"difficulty": "intermediate", "limit": 10}
# Tool result: [{"id": 1, "name": "The Hundred"}, ...]
#
# Executing step 2: Validate sequence
# ...
```

### 2. Check Tool Calls

```python
print(result.tool_calls)
# [{"tool_id": "search_movements", "summary": "Search Movements - Find Pilates movements"}]
```

### 3. Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Shows:
# - LLM prompts and responses
# - Tool search results
# - Parameter generation
# - Reflection decisions
```

### 4. Test Workflows with CLI

```bash
# Install arazzo-runner CLI
pip install arazzo-runner

# Test workflow
uvx arazzo-runner execute-workflow ./workflow.arazzo.yaml \
  --workflow-id generate_class \
  --inputs '{"difficulty": "intermediate"}' \
  --log-level DEBUG
```

---

## Common Issues

### Issue 1: Agent gives up too early

**Problem:** "Giving-up after 2 retries"

**Solution:** Increase max_retries:
```python
reasoner = ReWOOReasoner(max_retries=3)  # Allow more retry attempts
```

### Issue 2: Tool selection fails

**Problem:** "No suitable tool found for step: ..."

**Solution:** Improve tool descriptions:
```python
PilatesTool(
    tool_id="search_movements",
    name="Search Pilates Movements",
    description="Search the database of 34 classical Pilates movements by difficulty level, muscle group, or movement pattern"  # More detailed
)
```

### Issue 3: Parameter generation fails

**Problem:** "Missing required parameters: ..."

**Solution:** Ensure input data is in memory:
```python
# Bad (data not in memory)
agent.solve("Create a class for user 123")

# Good (data in memory)
agent.memory["user_id"] = "123"
agent.memory["user_preferences"] = {...}
agent.solve("Create a class using the user_preferences in memory")
```

### Issue 4: Workflow fails with missing expression

**Problem:** "Required memory key 'movements' not found"

**Solution:** Check step dependencies:
```yaml
# Bad (movements output not defined)
- stepId: validate
  parameters:
    - name: movements
      value: $steps.search.outputs.movements  # ← search step must output "movements"

# Good (output explicitly defined)
- stepId: search
  outputs:
    movements: $response.body.movements  # ← Explicitly set output key
```

---

## Next Steps

1. **Read JENTIC_REAL_CODE_ANALYSIS.md** for complete architecture
2. **Read JENTIC_CONCEPTS_EXPLAINED.md** for conceptual understanding
3. **Start with simple workflow** (4 steps, no AI)
4. **Add AI agent** for complex cases
5. **Iterate and annotate** as you learn

---

**Document Version:** 1.0
**Last Updated:** November 28, 2025
**Author:** Claude Code
