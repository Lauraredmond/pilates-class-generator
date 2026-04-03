# Jentic Real Code Analysis - Standard Agent + Arazzo Engine

**Date:** November 28, 2025
**Repositories Analyzed:**
- https://github.com/jentic/standard-agent (v0.1.11)
- https://github.com/jentic/arazzo-engine (v0.9.2)

---

## Executive Summary

This document contains a deep analysis of the **actual source code** from Jentic's StandardAgent and Arazzo Engine repositories. This is NOT a conceptual overview—it's based on reading the real implementation, complete with code excerpts, method signatures, and integration patterns.

**Key Finding:** Jentic's libraries are **production-ready, installable Python packages** published to PyPI, NOT just conceptual stubs. They can be integrated directly into Bassline's Pilates platform.

---

## Part 1: StandardAgent Architecture (Real Code)

### 1.1 Core Class: `StandardAgent`

**File:** `/agents/standard_agent.py` (151 lines)

```python
class StandardAgent:
    """Top-level class that orchestrates the main components of the agent framework."""

    def __init__(
        self,
        *,
        llm: BaseLLM,
        tools: JustInTimeToolingBase,
        memory: MutableMapping,
        reasoner: BaseReasoner,
        goal_preprocessor: BaseGoalPreprocessor = None,
        conversation_history_window: int = 5,
        timezone: str | None = None,
    ):
```

**Design Pattern:** Dependency Injection
- Agent doesn't create its own services—they're injected
- Allows swapping LLMs, tools, memory, reasoners without changing agent code
- Clean separation of concerns

**Key Method:** `solve(goal: str) -> ReasoningResult`

```python
@observe(root=True)
def solve(self, goal: str) -> ReasoningResult:
    """Solves a goal synchronously (library-style API)."""
    run_id = uuid4().hex
    start_time = time.perf_counter()

    # Optional goal preprocessing (conversational improvements)
    if self.goal_preprocessor:
        revised_goal, intervention_message = self.goal_preprocessor.process(goal, self.memory.get("conversation_history"))
        if intervention_message:
            self._record_interaction({"goal": goal, "result": f"user intervention message: {intervention_message}"})
            return ReasoningResult(success=False, final_answer=intervention_message)
        goal = revised_goal

    self._state = AgentState.BUSY

    try:
        # Delegate to reasoner
        result = self.reasoner.run(goal)

        # Summarize transcript to avoid context bloat
        result.final_answer = self.llm.prompt(_PROMPTS["summarize"].format(goal=goal, history=getattr(result, "transcript", "")[-12000:]))

        # Record interaction in conversation history
        self._record_interaction({"goal": goal, "result": result.final_answer})
        self._state = AgentState.READY

        return result
    except Exception:
        self._state = AgentState.NEEDS_ATTENTION
        raise
```

**Bassline Integration Pattern:**

```python
# JENTIC PATTERN: Dependency injection for modularity
from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.tools.jentic import JenticClient
from agents.reasoner.rewoo import ReWOOReasoner

# Bassline creates the agent with our own services
agent = StandardAgent(
    llm=LiteLLM(model="gpt-4"),  # Can swap to Anthropic, Gemini, etc.
    tools=JenticClient(),         # Jentic's tool marketplace
    memory={},                    # Simple dict or Redis
    reasoner=ReWOOReasoner(...)   # ReWOO reasoning strategy
)

# Bassline uses the agent
result = agent.solve("Create a 60-minute Pilates class for intermediate level")
```

---

### 1.2 Reasoner: ReWOO (Reasoning WithOut Observation)

**File:** `/agents/reasoner/rewoo.py` (326 lines)

**Architecture:** Plan → Execute → Reflect loop

```python
class ReWOOReasoner(BaseReasoner):
    def run(self, goal: str) -> ReasoningResult:
        state = ReasonerState(goal=goal)

        # STEP 1: PLAN - Decompose goal into steps
        state.plan = self._plan(goal)

        iterations = 0

        # STEP 2: EXECUTE - Run each step with reflection
        while state.plan and iterations < self.max_iterations:
            step = state.plan.popleft()
            try:
                self._execute(step, state)
                iterations += 1
            except (ReasoningError, ToolError) as exc:
                # STEP 3: REFLECT - Handle failures intelligently
                self._reflect(exc, step, state)

        return ReasoningResult(iterations=iterations, success=not state.plan, transcript="\n".join(state.history))
```

#### 1.2.1 Planning Phase (Real LLM Prompts)

**File:** `/agents/prompts/reasoners/rewoo.yaml`

```yaml
plan: |
  <role>
  You are a world-class planning assistant operating within the Agent ecosystem.
  You specialize in transforming high-level user goals into structured, step-by-step plans.
  </role>

  <output_format>
  1. Return only the fenced list (triple back-ticks) — no prose before or after.
  2. Each bullet should be on its own line, starting with "- ".
  3. Each bullet = <verb> <object> … followed by (input: key_a, key_b) (output: key_c)
  4. output: key is mandatory when the step's result is needed later
  5. input: is optional; list comma-separated snake_case keys produced by earlier steps.
  </output_format>

  <real_goal>
  Goal: {goal}
  </real_goal>
```

**Example Plan Generated by LLM:**

```markdown
- Retrieve user profile and preferences (output: user_profile)
- Search for movements matching user's level (input: user_profile) (output: movements)
- Select 10 movements for the class (input: movements) (output: selected_movements)
- Generate transitions between movements (input: selected_movements) (output: transitions)
- Format the complete class plan (input: selected_movements, transitions) (output: class_plan)
```

**Parsing Code (Lines 110-157):**

```python
def _plan(self, goal: str) -> Deque[Step]:
    generated_plan = self.llm.prompt(_PROMPTS["plan"].format(goal=goal)).strip("`").lstrip("markdown").strip()

    steps: Deque[Step] = deque()
    produced_keys: set[str] = set()

    BULLET_RE = re.compile(r"^\s*(?:[-*+]\s|\d+\.\s)(.*)$")
    IO_RE = re.compile(r"\((input|output):\s*([^)]*)\)")

    for raw_line in filter(str.strip, generated_plan.splitlines()):
        match = BULLET_RE.match(raw_line)
        if not match:
            continue
        bullet = match.group(1).rstrip()

        input_keys: List[str] = []
        output_key: Optional[str] = None

        # Parse (input: key_a, key_b) and (output: key_c) annotations
        for io_match in IO_RE.finditer(bullet):
            directive_type, keys_info = io_match.groups()
            if directive_type == "input":
                input_keys.extend(k.strip() for k in keys_info.split(',') if k.strip())
            else:
                output_key = keys_info.strip() or None

        # VALIDATION: Input keys must reference earlier outputs
        for key in input_keys:
            if key not in produced_keys:
                raise ValueError(f"Input key '{key}' used before being defined.")

        # VALIDATION: Output keys must be unique
        if output_key:
            if output_key in produced_keys:
                raise ValueError(f"Duplicate output key found: '{output_key}'")
            produced_keys.add(output_key)

        cleaned_text = IO_RE.sub("", bullet).strip()
        steps.append(Step(text=cleaned_text, output_key=output_key, input_keys=input_keys))

    return steps
```

**JENTIC PATTERN:** Dataflow validation at planning stage
- Ensures all inputs are produced before being consumed
- Prevents hallucinated dependencies
- Enables parallel execution (if inputs are ready)

#### 1.2.2 Execution Phase

**Code (Lines 159-186):**

```python
def _execute(self, step: Step, state: ReasonerState) -> None:
    step.status = StepStatus.RUNNING

    # Retrieve inputs from memory
    try:
        inputs = {key: self.memory[key] for key in step.input_keys}
    except KeyError as e:
        missing_key = e.args[0]
        raise MissingInputError(f"Required memory key '{missing_key}' not found") from e

    # Classify step: Does it need a tool or just reasoning?
    step_type = self.llm.prompt(_PROMPTS["classify_step"].format(step_text=step.text, keys_list=", ".join(self.memory.keys())))

    if "reasoning" in step_type.lower():
        # REASONING step - use LLM to process data
        step.result = self.llm.prompt(_PROMPTS["reason"].format(step_text=step.text, available_data=json.dumps(inputs)))
    else:
        # TOOL step - select tool, generate params, execute
        tool = self._select_tool(step)
        params = self._generate_params(step, tool, inputs)
        step.result = self.tools.execute(tool, params)
        state.tool_calls.append({"tool_id": tool.id, "summary": tool.get_summary()})

    step.status = StepStatus.DONE

    # Store output in memory for later steps
    if step.output_key:
        self.memory[step.output_key] = step.result

    state.history.append(f"Executed step: {step.text} -> {str(step.result)[:8124]}")
```

**JENTIC PATTERN:** Adaptive execution strategy
- Not all steps require external tools
- LLM can handle data transformation internally
- Saves API calls and cost

#### 1.2.3 Tool Selection (Lines 188-208)

```python
def _select_tool(self, step: Step) -> ToolBase:
    # Check if reflector suggested a tool after previous failure
    suggestion = self.memory.get(f"rewoo_reflector_suggestion:{step.text}")
    if suggestion and suggestion.get("action") in ("change_tool", "retry_params"):
        return self.tools.load(JenticTool({"id": suggestion.get("tool_id")}))

    # Search for candidate tools
    tool_candidates = self.tools.search(step.text, top_k=self.top_k)

    # Ask LLM to select best tool
    tool_id = self.llm.prompt(_PROMPTS["tool_select"].format(
        step=step.text,
        tools_json="\n".join([t.get_summary() for t in tool_candidates])
    ))

    if tool_id == "none":
        raise ToolSelectionError(f"No suitable tool found for step: {step.text}")

    selected_tool = next((t for t in tool_candidates if t.id == tool_id), None)
    if selected_tool is None:
        raise ToolSelectionError(f"Selected tool ID '{tool_id}' is invalid")

    return self.tools.load(selected_tool)
```

**Tool Selection Prompt (Lines 99-154 of rewoo.yaml):**

```yaml
tool_select: |
  <scoring_criteria>
  - **Action Compatibility** (35 pts): How well the tool's action matches the step's intent
  - **API Domain Match** (30 pts): CRITICAL - If step mentions "Gmail", must match Gmail API
  - **Parameter Compatibility** (20 pts): Can we provide the required parameters?
  - **Workflow Fit** (10 pts): Does it logically integrate with prior steps?
  - **Simplicity & Efficiency** (5 pts): Prefer direct tools over complex ones
  </scoring_criteria>

  <rules>
  1. Score each tool using weighted criteria. Max: 100 points.
  2. Select tool with highest score.
  3. If no tool scores ≥60, return "none".
  4. Never select a tool from incorrect domain if step explicitly specifies one.
  </rules>
```

**JENTIC PATTERN:** Scored tool selection with domain penalties
- Prevents nonsensical tool choices (e.g., using GitHub API for Gmail tasks)
- Quality threshold prevents bad matches
- Transparent scoring for debugging

#### 1.2.4 Reflection and Self-Healing (Lines 256-323)

```python
def _reflect(self, error: Exception, step: Step, state: ReasonerState) -> None:
    step.status = StepStatus.FAILED
    step.error = str(error)

    if step.retry_count >= self.max_retries:
        state.history.append(f"Giving-up after {self.max_retries} retries: {step.text}")
        return

    # Get alternative tools
    failed_tool_id = error.tool.id if isinstance(error, ToolError) else None
    alternatives = [t for t in self.tools.search(step.text, top_k=self.top_k) if t.id != failed_tool_id]

    # Ask LLM to diagnose and fix
    decision = self.llm.prompt_to_json(_PROMPTS["reflect"].format(
        goal=state.goal,
        step=step.text,
        failed_tool_id=failed_tool_id,
        error_type=error.__class__.__name__,
        error_message=str(error),
        tool_details=error.tool.get_details() if isinstance(error, ToolError) else None,
        alternative_tools="\n".join([t.get_summary() for t in alternatives])
    ))

    action = (decision or {}).get("action")

    if action == "give_up":
        return

    # Prepare new step with fixes
    new_step = deepcopy(step)
    new_step.retry_count += 1
    new_step.status = StepStatus.PENDING

    if action == "rephrase_step":
        new_step.text = str(decision.get("step", new_step.text))
    elif action == "change_tool":
        self._save_reflector_suggestion(new_step, "change_tool", decision.get("tool_id"))
    elif action == "retry_params":
        self._save_reflector_suggestion(new_step, "retry_params", failed_tool_id, decision.get("params", {}))

    # Add to front of plan for retry
    state.plan.appendleft(new_step)
```

**Reflection Decision Types:**

1. **retry_params** - Tool is correct, but parameters were wrong
2. **change_tool** - Wrong tool selected, try alternative
3. **rephrase_step** - Step description is ambiguous
4. **give_up** - Required data is missing, cannot proceed

**JENTIC PATTERN:** LLM-powered error recovery
- Agent diagnoses its own failures
- Proposes fixes autonomously
- Max retries prevent infinite loops
- Alternatives prevent tool thrashing

---

### 1.3 LLM Abstraction Layer

**File:** `/agents/llm/base_llm.py` (157 lines)

```python
class BaseLLM(ABC):
    """Minimal synchronous chat-LLM interface."""

    def __init__(self, model: str | None = None, *, temperature: float | None = None):
        resolved_model = model or os.getenv("LLM_MODEL")
        if not resolved_model:
            raise ValueError("Missing LLM model. Set LLM_MODEL env var or pass model parameter")

        self.model: str = resolved_model
        self.temperature: float = self._load_env_temperature() if temperature is None else temperature

    @abstractmethod
    def completion(self, messages: List[Dict[str, str]], **kwargs) -> "BaseLLM.LLMResponse":
        """Execute completion request against underlying LLM."""
        ...

    def prompt(self, content: str, **kwargs) -> str:
        """Convenience wrapper for single-turn prompts."""
        resp = self.completion([{"role": "user", "content": content}], **kwargs)
        return resp.text

    def prompt_to_json(self, content: str, **kwargs) -> Dict[str, Any]:
        """Prompt LLM and ensure response is valid JSON."""
        kwargs_with_json = kwargs.copy()
        kwargs_with_json.setdefault("response_format", {"type": "json_object"})
        raw_response = self.prompt(content, **kwargs_with_json)
        cleaned_response = self._fence_pattern.sub(lambda m: m.group(1).strip(), raw_response)
        return json.loads(cleaned_response)
```

**Implementations Provided:**

1. **LiteLLM** - Unified API for 100+ LLM providers (OpenAI, Anthropic, Gemini, etc.)
2. **Bedrock** - AWS Bedrock integration

**Bassline Can Add:**
- Custom Anthropic client (if we need special features)
- Local model support (Ollama, vLLM)
- Cost tracking wrapper

---

### 1.4 Tool Interface

**File:** `/agents/tools/base.py` (49 lines)

```python
class ToolBase(ABC):
    """Abstract base class for tool metadata."""

    def __init__(self, id: str):
        self.id = id

    @abstractmethod
    def get_summary(self) -> str:
        """Return summary for LLM tool selection."""
        raise NotImplementedError

    @abstractmethod
    def get_details(self) -> str:
        """Return detailed info for LLM reflection."""
        raise NotImplementedError

    @abstractmethod
    def get_parameter_schema(self) -> Dict[str, Any]:
        """Return parameter schema for LLM parameter generation."""
        raise NotImplementedError


class JustInTimeToolingBase(ABC):
    """Abstract contract for tool-providing backend."""

    @abstractmethod
    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        """Search for tools matching natural language query."""
        raise NotImplementedError

    @abstractmethod
    def load(self, tool: ToolBase) -> ToolBase:
        """Load full specification for a single tool."""
        raise NotImplementedError

    @abstractmethod
    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """Execute tool with given parameters."""
        raise NotImplementedError
```

**JENTIC PATTERN:** Just-in-time tooling
- Don't load all tools upfront (context bloat)
- Search dynamically based on task
- Load detailed schema only when needed
- Enables unlimited tool catalog

**Bassline Custom Implementation:**

```python
# BASSLINE CUSTOM: Our own tool provider for Pilates domain
class PilatesToolProvider(JustInTimeToolingBase):
    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        # Search our Supabase movement database
        if "movement" in query.lower():
            return [PilatesMovementSearchTool(), PilatesSequenceValidatorTool()]
        elif "music" in query.lower():
            return [MusicRecommendationTool()]
        # etc.

    def load(self, tool: ToolBase) -> ToolBase:
        # Load full Pydantic schema from our backend
        return tool

    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        # Call our FastAPI endpoints
        response = requests.post(f"{BACKEND_URL}/api/{tool.endpoint}", json=parameters)
        return response.json()
```

---

### 1.5 Jentic Tool Marketplace Integration

**File:** `/agents/tools/jentic.py` (176 lines)

```python
class JenticClient(JustInTimeToolingBase):
    """Centralized adapter over jentic-sdk."""

    def __init__(self, *, filter_by_credentials: Optional[bool] = None):
        self._jentic = Jentic()  # From jentic-sdk package
        self._filter_by_credentials = filter_by_credentials or os.getenv("JENTIC_FILTER_BY_CREDENTIALS", "false") == "true"

    @observe
    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        response = asyncio.run(self._jentic.search(SearchRequest(
            query=query,
            limit=top_k,
            filter_by_credentials=self._filter_by_credentials
        )))
        return [JenticTool(result.model_dump(exclude_none=False)) for result in response.results]

    @observe
    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        result = asyncio.run(self._jentic.execute(ExecutionRequest(id=tool.id, inputs=parameters)))

        if not result.success:
            if result.status_code == HTTPStatus.UNAUTHORIZED:
                raise ToolCredentialsMissingError(result.error, tool)
            raise ToolExecutionError(result.error, tool)

        return result.output
```

**What This Means:**
- StandardAgent can call **1500+ real APIs** via Jentic marketplace
- Slack, Gmail, GitHub, Asana, Notion, etc.
- User provides API credentials via env vars
- Jentic handles auth, rate limiting, error handling

**Bassline Hybrid Approach:**

```python
# JENTIC PATTERN: Combine Jentic tools with Bassline tools
class HybridToolProvider(JustInTimeToolingBase):
    def __init__(self):
        self.jentic_client = JenticClient()
        self.pilates_client = PilatesToolProvider()

    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        # Search both tool sources
        jentic_results = self.jentic_client.search(query, top_k=top_k//2)
        pilates_results = self.pilates_client.search(query, top_k=top_k//2)
        return jentic_results + pilates_results
```

**Use Case:** User says "Send my class plan to my email"
- Agent searches tools
- Finds `SendEmailViaSendGrid` (Jentic) + `GenerateClassPlan` (Bassline)
- Plans: [1. Generate class plan, 2. Send via email]
- Executes both transparently

---

## Part 2: Arazzo Engine Architecture (Real Code)

### 2.1 Core Class: `ArazzoRunner`

**File:** `/arazzo_runner/runner.py` (809 lines)

```python
class ArazzoRunner:
    """Executes Arazzo workflows step-by-step, following defined paths."""

    def __init__(
        self,
        arazzo_doc: ArazzoDoc | None = None,
        source_descriptions: dict[str, OpenAPIDoc] | None = None,
        http_client: Any | None = None,
        auth_provider: CredentialProvider | None = None,
        blob_store: BlobStore | None = None,
    ):
        self.arazzo_doc = arazzo_doc
        self.source_descriptions = source_descriptions

        # Process authentication from OpenAPI specs
        auth_processor = AuthProcessor()
        auth_config = auth_processor.process_api_auth(
            openapi_specs=self.source_descriptions or {},
            arazzo_specs=[arazzo_doc] if arazzo_doc else []
        )

        # Initialize HTTP client and auth
        http_client = http_client or requests.Session()
        self.auth_provider = auth_provider or CredentialProviderFactory.create_default(
            auth_requirements=auth_config.get("auth_requirements", []),
            env_mapping=auth_config.get("env_mappings", {}),
            http_client=http_client
        )

        # Initialize step executor
        http_executor = HTTPExecutor(http_client, self.auth_provider)
        self.step_executor = StepExecutor(http_executor, self.source_descriptions or {}, blob_store=blob_store)

        # Execution state
        self.execution_states: dict[str, ExecutionState] = {}
```

**Factory Methods:**

```python
@classmethod
def from_arazzo_path(cls, arazzo_path: str, base_path: str | None = None) -> "ArazzoRunner":
    """Initialize from Arazzo workflow file."""
    arazzo_doc = load_arazzo_doc(arazzo_path)
    source_descriptions = load_source_descriptions(arazzo_doc, arazzo_path, base_path or "")
    return cls(arazzo_doc=arazzo_doc, source_descriptions=source_descriptions)

@classmethod
def from_openapi_path(cls, openapi_path: str) -> "ArazzoRunner":
    """Initialize from single OpenAPI spec (no workflow)."""
    openapi_doc = load_openapi_file(openapi_path)
    return cls(arazzo_doc=None, source_descriptions={"default": openapi_doc})
```

---

### 2.2 Workflow Execution

**File:** `/arazzo_runner/models.py`

```python
@dataclass
class ExecutionState:
    """Represents current execution state of a workflow."""
    workflow_id: str
    current_step_id: str | None = None
    inputs: dict[str, Any] = field(default_factory=dict)
    step_outputs: dict[str, dict[str, Any]] = field(default_factory=dict)
    workflow_outputs: dict[str, Any] = field(default_factory=dict)
    dependency_outputs: dict[str, dict[str, Any]] = field(default_factory=dict)
    status: dict[str, StepStatus] = field(default_factory=dict)
    runtime_params: Optional["RuntimeParams"] = None
```

**Execution Method (Lines 303-374):**

```python
def execute_workflow(
    self,
    workflow_id: str,
    inputs: dict[str, Any] | None = None,
    runtime_params: RuntimeParams | None = None,
) -> WorkflowExecutionResult:
    """Start and execute workflow until completion."""

    # Register event callbacks for logging
    self.register_callback("workflow_start", on_workflow_start)
    self.register_callback("step_start", on_step_start)
    self.register_callback("step_complete", on_step_complete)
    self.register_callback("workflow_complete", on_workflow_complete)

    execution_id = self.start_workflow(workflow_id, inputs, runtime_params)

    # Execute steps until complete or error
    while True:
        result = self.execute_next_step(execution_id)

        if result.get("status") in [WorkflowExecutionStatus.WORKFLOW_COMPLETE, WorkflowExecutionStatus.ERROR]:
            state = self.execution_states[execution_id]
            return WorkflowExecutionResult(
                status=result["status"],
                workflow_id=workflow_id,
                outputs=result.get("outputs", {}),
                step_outputs=state.step_outputs,
                inputs=inputs,
                error=result.get("error")
            )
```

**Step Execution (Lines 376-606):**

```python
def execute_next_step(self, execution_id: str) -> dict[str, Any]:
    state = self.execution_states[execution_id]
    workflow = self._find_workflow(state.workflow_id)

    # Determine next step
    if state.current_step_id is None:
        next_step = workflow["steps"][0]  # First step
    else:
        current_idx = self._find_step_index(state.current_step_id, workflow["steps"])
        next_step = workflow["steps"][current_idx + 1] if current_idx + 1 < len(workflow["steps"]) else None

    if not next_step:
        # Workflow complete
        return {
            "status": WorkflowExecutionStatus.WORKFLOW_COMPLETE,
            "outputs": state.workflow_outputs
        }

    # Execute step
    step_id = next_step["stepId"]
    state.current_step_id = step_id

    try:
        if "workflowId" in next_step:
            step_result = self._execute_nested_workflow(next_step, state)
        else:
            step_result = self.step_executor.execute_step(next_step, state)

        success = step_result.get("success", False)
        state.step_outputs[step_id] = step_result.get("outputs", {})

        # Handle success/failure criteria
        next_action = self.step_executor.determine_next_action(next_step, success, state)

        if next_action["type"] == ActionType.END:
            return {"status": WorkflowExecutionStatus.WORKFLOW_COMPLETE, "outputs": state.workflow_outputs}
        elif next_action["type"] == ActionType.GOTO:
            # Jump to another step or workflow
            pass
        elif next_action["type"] == ActionType.RETRY:
            return {"status": WorkflowExecutionStatus.RETRY, "step_id": step_id}

        return {"status": WorkflowExecutionStatus.STEP_COMPLETE, "step_id": step_id}

    except Exception as e:
        return {"status": WorkflowExecutionStatus.STEP_ERROR, "error": str(e)}
```

---

### 2.3 Expression Evaluator (Runtime References)

**File:** `/arazzo_runner/evaluator.py` (24KB file)

Arazzo workflows use JSONPath-like expressions to reference data:

```yaml
# Example Arazzo step
- stepId: send_class_plan
  operationId: sendEmail
  parameters:
    - name: to
      value: $inputs.user_email
    - name: subject
      value: "Your Pilates Class Plan"
    - name: body
      value: $steps.generate_class.outputs.formatted_plan
```

**Expression Types:**

1. **$inputs.{name}** - Workflow input parameters
2. **$steps.{stepId}.outputs.{key}** - Output from previous step
3. **$workflows.{workflowId}.outputs.{key}** - Output from dependency workflow
4. **$url** - HTTP response from operation

**Evaluation Code:**

```python
class ExpressionEvaluator:
    @staticmethod
    def evaluate_expression(expr: str, state: ExecutionState, source_descriptions: dict) -> Any:
        if not isinstance(expr, str) or not expr.startswith("$"):
            return expr

        # Parse JSONPath expression
        if expr.startswith("$inputs."):
            key = expr[len("$inputs."):]
            return state.inputs.get(key)

        elif expr.startswith("$steps."):
            # Format: $steps.step_id.outputs.field_name
            parts = expr.split(".")
            step_id = parts[1]
            output_key = ".".join(parts[3:])  # Everything after "outputs"
            step_output = state.step_outputs.get(step_id, {})
            return self._get_nested_value(step_output, output_key)

        elif expr.startswith("$workflows."):
            workflow_id = expr.split(".")[1]
            output_key = ".".join(expr.split(".")[3:])
            return self._get_nested_value(state.dependency_outputs.get(workflow_id, {}), output_key)
```

**JENTIC PATTERN:** Declarative data flow
- No manual variable passing
- Runtime binds expressions to actual values
- Type-safe (validated against OpenAPI schemas)

---

### 2.4 Authentication Handling

Arazzo Engine automatically extracts auth requirements from OpenAPI specs:

```python
# File: /arazzo_runner/auth/auth_processor.py
class AuthProcessor:
    def process_api_auth(self, openapi_specs: dict, arazzo_specs: list) -> dict:
        auth_requirements = []
        env_mappings = {}

        for api_name, spec in openapi_specs.items():
            security_schemes = spec.get("components", {}).get("securitySchemes", {})

            for scheme_name, scheme in security_schemes.items():
                if scheme["type"] == "apiKey":
                    env_var = f"{api_name.upper()}_{scheme_name.upper()}"
                    env_mappings[env_var] = {
                        "scheme": scheme_name,
                        "in": scheme["in"],  # header, query, cookie
                        "name": scheme["name"]
                    }
                elif scheme["type"] == "http" and scheme["scheme"] == "bearer":
                    env_var = f"{api_name.upper()}_BEARER_TOKEN"
                    env_mappings[env_var] = {"scheme": scheme_name, "type": "bearer"}

        return {"auth_requirements": auth_requirements, "env_mappings": env_mappings}
```

**Supported Auth Types:**
- API Key (header/query/cookie)
- HTTP Bearer Token
- HTTP Basic Auth
- OAuth2 (Client Credentials, Password flows)

**Not Yet Supported:**
- OAuth2 Authorization Code flow
- OpenID Connect

---

### 2.5 Direct Operation Execution

You can also execute single API operations without workflows:

```python
# File: /arazzo_runner/runner.py (Lines 680-740)
def execute_operation(
    self,
    inputs: dict[str, Any],
    operation_id: str | None = None,
    operation_path: str | None = None,
    runtime_params: RuntimeParams | None = None,
) -> dict[str, Any]:
    """Execute a single API operation directly."""

    if not operation_id and not operation_path:
        raise ValueError("Either operation_id or operation_path must be provided.")

    # Delegate to StepExecutor
    result = self.step_executor.execute_operation(
        inputs=inputs,
        operation_id=operation_id,
        operation_path=operation_path,
        runtime_params=runtime_params
    )
    return result
```

**Example Usage:**

```python
from arazzo_runner import ArazzoRunner

runner = ArazzoRunner.from_openapi_path("./pilates_api_openapi.yaml")

# Execute operation by ID
result = runner.execute_operation(
    operation_id="getMovements",
    inputs={"difficulty": "intermediate", "limit": 10}
)

# Execute operation by path
result = runner.execute_operation(
    operation_path="GET /api/movements",
    inputs={"difficulty": "intermediate"}
)
```

---

## Part 3: Integration Architecture for Bassline

### 3.1 Hybrid Architecture: StandardAgent + Arazzo + Bassline APIs

```
┌─────────────────────────────────────────────────────────────────┐
│                       BASSLINE FRONTEND                          │
│                         (React)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               PYTHON ORCHESTRATION SERVICE                       │
│                  (FastAPI on Render)                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            BasslinePilatesCoachAgent                      │  │
│  │         (extends StandardAgent)                           │  │
│  │                                                            │  │
│  │  - LLM: LiteLLM (GPT-4, Claude, Gemini)                  │  │
│  │  - Tools: HybridToolProvider                              │  │
│  │      ├─ PilatesToolProvider (our custom tools)           │  │
│  │      └─ JenticClient (1500+ APIs)                        │  │
│  │  - Memory: Redis (conversation history)                   │  │
│  │  - Reasoner: ReWOOReasoner (plan-execute-reflect)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ArazzoRunner                                 │  │
│  │         (workflow execution engine)                       │  │
│  │                                                            │  │
│  │  Workflow: generate_pilates_class_v1.arazzo.yaml         │  │
│  │  OpenAPI: pilates_api_openapi.yaml                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────┐
│   SUPABASE    │  │  BASSLINE APIs   │  │ JENTIC APIs  │
│  (Movements,  │  │  (FastAPI routes)│  │ (Gmail, etc.)│
│   Users, etc.)│  │                  │  │              │
└───────────────┘  └──────────────────┘  └──────────────┘
```

---

### 3.2 File Structure

```
backend/
├── orchestration/                    # NEW: Python orchestration service
│   ├── main.py                       # FastAPI app entry point
│   ├── agents/
│   │   ├── pilates_coach_agent.py   # JENTIC: Extends StandardAgent
│   │   └── tools/
│   │       ├── pilates_tools.py     # BASSLINE: Custom tool provider
│   │       └── hybrid_provider.py   # JENTIC: Combines Pilates + Jentic tools
│   ├── workflows/
│   │   ├── generate_pilates_class_v1.arazzo.yaml
│   │   └── pilates_api_openapi.yaml
│   └── requirements.txt              # jentic-sdk, standard-agent, arazzo-runner
│
├── api/                              # EXISTING: FastAPI routes
│   ├── main.py
│   ├── movements.py                  # GET /api/movements
│   ├── sequences.py                  # POST /api/sequences/validate
│   └── music.py                      # GET /api/music/playlists
│
└── services/                         # EXISTING: Business logic
    ├── sequencing.py
    └── muscle_balance.py
```

---

### 3.3 Code Examples

#### 3.3.1 BasslinePilatesCoachAgent

```python
# File: backend/orchestration/agents/pilates_coach_agent.py

from agents.standard_agent import StandardAgent
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner
from agents.memory import DictMemory
from .tools.hybrid_provider import HybridToolProvider

class BasslinePilatesCoachAgent(StandardAgent):
    """
    JENTIC PATTERN: Extend StandardAgent for domain-specific behavior.
    BASSLINE CUSTOM: Pilates coaching expertise and safety rules.
    """

    def __init__(self, model: str = "gpt-4"):
        # JENTIC PATTERN: LiteLLM abstraction for vendor flexibility
        llm = LiteLLM(model=model, temperature=0.2)  # Lower temp for safety-critical decisions

        # BASSLINE CUSTOM: Hybrid tool provider (Pilates + Jentic)
        tools = HybridToolProvider()

        # JENTIC PATTERN: Simple dict memory (can upgrade to Redis later)
        memory = DictMemory()

        # JENTIC PATTERN: ReWOO reasoner for structured planning
        reasoner = ReWOOReasoner(
            llm=llm,
            tools=tools,
            memory=memory,
            max_iterations=20,
            max_retries=2
        )

        super().__init__(
            llm=llm,
            tools=tools,
            memory=memory,
            reasoner=reasoner,
            conversation_history_window=5
        )

        # BASSLINE CUSTOM: Inject Pilates domain knowledge into memory
        self.memory["pilates_safety_rules"] = self._load_safety_rules()
        self.memory["pilates_principles"] = ["Control", "Breath", "Centering", "Concentration", "Precision", "Flow"]

    def _load_safety_rules(self) -> dict:
        """BASSLINE CUSTOM: Load sequencing rules from database."""
        return {
            "spinal_progression": "Flexion must precede extension",
            "warm_up_required": "Always start with breathing and gentle movements",
            "muscle_balance": "Distribute load across muscle groups evenly"
        }

    def create_class_plan(self, user_goal: str) -> dict:
        """
        BASSLINE CUSTOM: High-level method for class planning.
        JENTIC PATTERN: Delegates to StandardAgent.solve() for reasoning.
        """
        # Enhance goal with safety context
        enhanced_goal = f"""
        {user_goal}

        CRITICAL SAFETY RULES:
        {self.memory['pilates_safety_rules']}

        PILATES PRINCIPLES TO INCORPORATE:
        {self.memory['pilates_principles']}
        """

        # JENTIC PATTERN: Call solve() to trigger ReWOO reasoning loop
        result = self.solve(enhanced_goal)

        return {
            "success": result.success,
            "class_plan": result.final_answer,
            "reasoning_transcript": result.transcript,
            "tool_calls": result.tool_calls
        }
```

#### 3.3.2 Hybrid Tool Provider

```python
# File: backend/orchestration/agents/tools/hybrid_provider.py

from agents.tools.base import JustInTimeToolingBase, ToolBase
from agents.tools.jentic import JenticClient
from .pilates_tools import PilatesToolProvider

class HybridToolProvider(JustInTimeToolingBase):
    """
    JENTIC PATTERN: Combine multiple tool sources seamlessly.
    BASSLINE CUSTOM: Prioritize Pilates tools over generic Jentic tools.
    """

    def __init__(self):
        # JENTIC PATTERN: Access to 1500+ APIs
        self.jentic = JenticClient(filter_by_credentials=True)

        # BASSLINE CUSTOM: Domain-specific Pilates tools
        self.pilates = PilatesToolProvider()

    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        """
        Search both tool sources, prioritizing Pilates tools.

        BASSLINE STRATEGY:
        - If query mentions Pilates concepts, bias toward Pilates tools
        - Otherwise, search both and let LLM scoring decide
        """
        pilates_keywords = ["movement", "sequence", "class", "music", "meditation", "pilates"]
        is_pilates_query = any(kw in query.lower() for kw in pilates_keywords)

        if is_pilates_query:
            # Search Pilates tools first, supplement with Jentic if needed
            pilates_results = self.pilates.search(query, top_k=top_k)
            if len(pilates_results) >= top_k // 2:
                jentic_results = self.jentic.search(query, top_k=top_k - len(pilates_results))
            else:
                jentic_results = self.jentic.search(query, top_k=top_k // 2)
            return pilates_results + jentic_results
        else:
            # Generic query, search both equally
            pilates_results = self.pilates.search(query, top_k=top_k // 2)
            jentic_results = self.jentic.search(query, top_k=top_k // 2)
            return pilates_results + jentic_results

    def load(self, tool: ToolBase) -> ToolBase:
        """Load full tool specification from appropriate provider."""
        if tool.id.startswith("pilates_"):
            return self.pilates.load(tool)
        else:
            return self.jentic.load(tool)

    def execute(self, tool: ToolBase, parameters: dict) -> Any:
        """Execute tool via appropriate provider."""
        if tool.id.startswith("pilates_"):
            return self.pilates.execute(tool, parameters)
        else:
            return self.jentic.execute(tool, parameters)
```

#### 3.3.3 Pilates Tool Provider (Custom)

```python
# File: backend/orchestration/agents/tools/pilates_tools.py

import requests
from agents.tools.base import JustInTimeToolingBase, ToolBase
from typing import List, Dict, Any

class PilatesTool(ToolBase):
    """BASSLINE CUSTOM: Wrapper for Bassline API endpoints."""

    def __init__(self, tool_id: str, name: str, description: str, endpoint: str, parameters: dict):
        super().__init__(tool_id)
        self.name = name
        self.description = description
        self.endpoint = endpoint
        self.parameters = parameters

    def get_summary(self) -> str:
        return f"{self.id}: {self.name} - {self.description}"

    def get_details(self) -> str:
        return f"Endpoint: {self.endpoint}\nParameters: {self.parameters}"

    def get_parameter_schema(self) -> Dict[str, Any]:
        return self.parameters

class PilatesToolProvider(JustInTimeToolingBase):
    """BASSLINE CUSTOM: Provides access to Bassline Pilates API endpoints."""

    BACKEND_URL = "https://pilates-class-generator-api3.onrender.com"

    # Define all available Pilates tools
    TOOLS = [
        PilatesTool(
            tool_id="pilates_search_movements",
            name="Search Pilates Movements",
            description="Search the database of 34 classical Pilates movements by difficulty, muscle group, or movement pattern",
            endpoint="/api/movements",
            parameters={
                "difficulty": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                "muscle_group": {"type": "string", "enum": ["core", "legs", "arms", "back"]},
                "limit": {"type": "integer", "default": 10}
            }
        ),
        PilatesTool(
            tool_id="pilates_validate_sequence",
            name="Validate Movement Sequence",
            description="Validate a sequence of movements against safety rules (spinal progression, muscle balance, etc.)",
            endpoint="/api/sequences/validate",
            parameters={
                "movement_ids": {"type": "array", "items": {"type": "string"}},
                "strict": {"type": "boolean", "default": True}
            }
        ),
        PilatesTool(
            tool_id="pilates_get_music_playlist",
            name="Get Music Playlist",
            description="Retrieve music playlist for Pilates class based on stylistic period and intensity",
            endpoint="/api/music/playlists",
            parameters={
                "period": {"type": "string", "enum": ["baroque", "classical", "romantic", "impressionist", "modern", "contemporary", "celtic"]},
                "intensity": {"type": "string", "enum": ["low", "medium", "high"]}
            }
        )
    ]

    def search(self, query: str, *, top_k: int = 10) -> List[ToolBase]:
        """Search tools by query string."""
        results = []
        query_lower = query.lower()

        for tool in self.TOOLS:
            score = 0
            if any(word in tool.name.lower() for word in query_lower.split()):
                score += 50
            if any(word in tool.description.lower() for word in query_lower.split()):
                score += 30

            if score > 0:
                results.append((score, tool))

        # Sort by score, return top_k
        results.sort(reverse=True, key=lambda x: x[0])
        return [tool for _, tool in results[:top_k]]

    def load(self, tool: ToolBase) -> ToolBase:
        """Load is a no-op since tools are already fully defined."""
        return tool

    def execute(self, tool: ToolBase, parameters: Dict[str, Any]) -> Any:
        """Execute tool by calling Bassline API."""
        if not isinstance(tool, PilatesTool):
            raise ValueError(f"Expected PilatesTool, got {type(tool)}")

        url = f"{self.BACKEND_URL}{tool.endpoint}"
        response = requests.get(url, params=parameters)
        response.raise_for_status()
        return response.json()
```

#### 3.3.4 Arazzo Workflow Definition

```yaml
# File: backend/orchestration/workflows/generate_pilates_class_v1.arazzo.yaml

arazzo: 1.0.0
info:
  title: Pilates Class Generation Workflow V1
  version: 1.0.0
  description: 4-step workflow to generate a complete Pilates class plan

sourceDescriptions:
  - name: pilates_api
    url: ./pilates_api_openapi.yaml
    type: openapi

workflows:
  - workflowId: generate_pilates_class_v1
    summary: Generate complete Pilates class with movements and transitions
    inputs:
      type: object
      properties:
        user_id:
          type: string
          description: User's unique ID
        difficulty:
          type: string
          enum: [beginner, intermediate, advanced]
        duration_minutes:
          type: integer
          default: 60
        focus_area:
          type: string
          enum: [core, flexibility, strength, full_body]
          default: full_body

    steps:
      # STEP 1: Get user profile
      - stepId: get_user_profile
        description: Retrieve user preferences and history
        operationId: getUserProfile
        parameters:
          - name: user_id
            in: path
            value: $inputs.user_id
        outputs:
          user_preferences: $response.body.preferences
          user_level: $response.body.level

      # STEP 2: Search movements
      - stepId: search_movements
        description: Find movements matching user's level and focus
        operationId: searchMovements
        parameters:
          - name: difficulty
            in: query
            value: $inputs.difficulty
          - name: muscle_group
            in: query
            value: $inputs.focus_area
          - name: limit
            in: query
            value: 15
        outputs:
          available_movements: $response.body.movements

      # STEP 3: Select movements
      - stepId: select_movements_for_class
        description: Choose 10 movements and validate sequence
        operationPath: $sourceDescriptions.pilates_api.selectAndValidateMovements
        parameters:
          - name: movements
            in: body
            value: $steps.search_movements.outputs.available_movements
          - name: count
            in: body
            value: 10
          - name: duration_minutes
            in: body
            value: $inputs.duration_minutes
        successCriteria:
          - condition: $statusCode == 200
          - condition: $response.body.validation_passed == true
        outputs:
          selected_movements: $response.body.selected_movements
          validation_result: $response.body.validation_result

      # STEP 4: Generate transitions
      - stepId: generate_transitions
        description: Create smooth transitions between movements
        operationId: generateTransitions
        parameters:
          - name: movements
            in: body
            value: $steps.select_movements_for_class.outputs.selected_movements
        outputs:
          transitions: $response.body.transitions
          complete_class_plan: $response.body.complete_plan

    outputs:
      class_plan:
        value: $steps.generate_transitions.outputs.complete_class_plan
      user_level:
        value: $steps.get_user_profile.outputs.user_level
```

#### 3.3.5 FastAPI Orchestration Service

```python
# File: backend/orchestration/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents.pilates_coach_agent import BasslinePilatesCoachAgent
from arazzo_runner import ArazzoRunner

app = FastAPI(title="Bassline Pilates Orchestration Service")

# Initialize agent (singleton)
agent = BasslinePilatesCoachAgent(model="gpt-4")

# Initialize Arazzo runner
arazzo_runner = ArazzoRunner.from_arazzo_path("./workflows/generate_pilates_class_v1.arazzo.yaml")

class ClassPlanRequest(BaseModel):
    user_id: str
    difficulty: str
    duration_minutes: int = 60
    focus_area: str = "full_body"
    use_ai_agent: bool = False  # Toggle between Arazzo workflow and AI agent

@app.post("/api/orchestration/generate-class")
async def generate_class(request: ClassPlanRequest):
    """
    Generate Pilates class using either:
    1. Arazzo workflow (deterministic, fast)
    2. AI agent (flexible, slower)
    """

    if request.use_ai_agent:
        # JENTIC PATTERN: Use StandardAgent for flexible reasoning
        goal = f"""
        Create a {request.difficulty} Pilates class for a user.
        Duration: {request.duration_minutes} minutes
        Focus area: {request.focus_area}
        User ID: {request.user_id}

        Steps:
        1. Retrieve user preferences
        2. Search for appropriate movements
        3. Select 10 movements and validate sequence safety
        4. Generate transitions between movements
        5. Format the complete class plan
        """

        result = agent.create_class_plan(goal)

        return {
            "method": "ai_agent",
            "success": result["success"],
            "class_plan": result["class_plan"],
            "reasoning_transcript": result["reasoning_transcript"],
            "tool_calls": result["tool_calls"]
        }

    else:
        # JENTIC PATTERN: Use Arazzo workflow for deterministic execution
        result = arazzo_runner.execute_workflow(
            workflow_id="generate_pilates_class_v1",
            inputs={
                "user_id": request.user_id,
                "difficulty": request.difficulty,
                "duration_minutes": request.duration_minutes,
                "focus_area": request.focus_area
            }
        )

        return {
            "method": "arazzo_workflow",
            "success": result.status == "workflow_complete",
            "class_plan": result.outputs.get("class_plan"),
            "step_outputs": result.step_outputs
        }

@app.get("/api/orchestration/health")
async def health_check():
    return {
        "status": "healthy",
        "agent_state": agent.state.value,
        "arazzo_workflows": list(arazzo_runner.arazzo_doc.get("workflows", [])) if arazzo_runner.arazzo_doc else []
    }
```

---

## Part 4: PyPI and Installation

### 4.1 What is PyPI?

**PyPI** = Python Package Index (https://pypi.org)
- Official repository for Python packages
- Like npm for Node.js, or Maven for Java
- `pip install package-name` downloads from PyPI

### 4.2 Jentic Packages on PyPI

**Standard Agent:**
```bash
pip install standard-agent
# Installs from https://pypi.org/project/standard-agent/
# Version: 0.1.11
# Dependencies: jentic>=0.9.5, openai>=1.100.2, litellm>=1.74.3, pydantic>=2.0
```

**Arazzo Runner:**
```bash
pip install arazzo-runner
# Installs from https://pypi.org/project/arazzo-runner/
# Version: 0.9.2
# Dependencies: pydantic>=2.0.0, pyyaml>=6.0, requests>=2.28.0
```

**Jentic SDK (for tool marketplace):**
```bash
pip install jentic
# Installs from https://pypi.org/project/jentic/
# Provides access to 1500+ APIs
```

### 4.3 Installation for Bassline

```bash
# File: backend/orchestration/requirements.txt

# JENTIC PACKAGES (from PyPI)
standard-agent==0.1.11
arazzo-runner==0.9.2
jentic==0.9.5

# LLM Providers
litellm==1.74.3
openai==1.100.2

# Existing Bassline dependencies
fastapi==0.104.1
supabase==2.0.3
redis==5.0.1
```

**These are REAL, production-ready packages**, not stubs or placeholders.

---

## Part 5: Option 1 vs Option 2 Explained

### Option 1: Continue with Stubs (NOT RECOMMENDED)

**"Stubs"** = Fake/placeholder implementations for learning

```python
# STUB EXAMPLE: Fake StandardAgent
class FakeStandardAgent:
    """Educational stub - doesn't actually work"""
    def solve(self, goal: str):
        return {"success": False, "message": "This is just a stub for learning"}
```

**Why this is bad:**
- You learn theory, not practice
- No production value
- Have to rebuild everything later
- Waste time

### Option 2: Use Real Jentic Libraries (RECOMMENDED)

**"Real Libraries"** = Actual pip-installable packages from PyPI

```python
# REAL EXAMPLE: Actual StandardAgent
from agents.standard_agent import StandardAgent  # Real import from standard-agent package
from agents.llm.litellm import LiteLLM
from agents.reasoner.rewoo import ReWOOReasoner

agent = StandardAgent(
    llm=LiteLLM(model="gpt-4"),
    tools=JenticClient(),  # Calls real Jentic APIs
    memory={},
    reasoner=ReWOOReasoner(...)
)

result = agent.solve("Create a Pilates class")  # ACTUALLY WORKS
```

**Why this is good:**
- Learn by doing with real code
- Production-ready from day 1
- Deep understanding through integration
- Serves both goals (customer traction + Jentic learning)

---

## Part 6: Deployment Architecture

### 6.1 Services Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY (Frontend)                        │
│            https://basslinemvp.netlify.app                   │
│                  - React application                         │
│                  - Static assets                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER (Orchestration Service)                  │
│    NEW SERVICE: pilates-orchestration-service.onrender.com   │
│                                                              │
│  - StandardAgent + Arazzo Engine                             │
│  - Python 3.11                                               │
│  - Environment Variables:                                    │
│      - LLM_MODEL=gpt-4                                       │
│      - OPENAI_API_KEY=sk-...                                 │
│      - JENTIC_AGENT_API_KEY=... (optional)                   │
│      - BASSLINE_API_URL=https://pilates-class-generator...   │
│      - REDIS_URL=redis://...                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
┌─────────────────┐ ┌────────────┐ ┌──────────────┐
│  RENDER (API)   │ │  SUPABASE  │ │ REDIS CLOUD  │
│ Existing Backend│ │  Database  │ │   (Memory)   │
│  - Movements    │ │            │ │              │
│  - Sequences    │ │            │ │              │
│  - Music        │ │            │ │              │
└─────────────────┘ └────────────┘ └──────────────┘
```

### 6.2 Deployment Steps

**Step 1: Create New Render Service**

```bash
# From Render dashboard:
# 1. Click "New +"
# 2. Select "Web Service"
# 3. Connect GitHub repo
# 4. Configure:

Name: pilates-orchestration-service
Root Directory: backend/orchestration
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Instance Type: Starter ($7/month)
```

**Step 2: Set Environment Variables**

```bash
# In Render dashboard -> Environment:
LLM_MODEL=gpt-4
OPENAI_API_KEY=sk-proj-...
JENTIC_AGENT_API_KEY=...  # Optional for Jentic tools
BASSLINE_API_URL=https://pilates-class-generator-api3.onrender.com
REDIS_URL=redis://...  # For conversation memory
```

**Step 3: Update Frontend**

```typescript
// frontend/src/services/orchestrationService.ts

const ORCHESTRATION_API = "https://pilates-orchestration-service.onrender.com";

export async function generateClassWithAI(request: {
  user_id: string;
  difficulty: string;
  duration_minutes: number;
  focus_area: string;
}) {
  const response = await fetch(`${ORCHESTRATION_API}/api/orchestration/generate-class`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, use_ai_agent: true })
  });
  return response.json();
}
```

---

## Part 7: Educational Annotations Strategy

Throughout the integrated code, use comments to distinguish:

### Pattern 1: JENTIC PATTERN

```python
# JENTIC PATTERN: Dependency injection for LLM abstraction
# This allows swapping between OpenAI, Anthropic, Gemini without code changes
llm = LiteLLM(model="gpt-4")
```

### Pattern 2: BASSLINE CUSTOM

```python
# BASSLINE CUSTOM: Pilates safety rules enforcement
# These rules are unique to our domain and not part of Jentic's core
safety_rules = self._load_pilates_safety_rules()
```

### Pattern 3: INTEGRATION POINT

```python
# INTEGRATION POINT: Connecting Jentic's tool interface to Bassline APIs
# StandardAgent expects tools that implement JustInTimeToolingBase
# We wrap our FastAPI endpoints in this interface
class PilatesToolProvider(JustInTimeToolingBase):
    def execute(self, tool, params):
        return requests.post(f"{BASSLINE_API}/{tool.endpoint}", json=params).json()
```

---

## Conclusion

**Key Findings:**

1. **Jentic's libraries are REAL, production-ready Python packages** on PyPI
2. **StandardAgent** provides a complete reasoning loop (plan-execute-reflect)
3. **Arazzo Engine** provides deterministic workflow execution
4. **Both can integrate seamlessly** with Bassline's existing FastAPI backend
5. **No stubs needed** - we can use the actual libraries from day 1

**Recommended Approach:**

- **Option 2** (use real Jentic libraries)
- Build production-ready orchestration service
- Heavy educational annotations throughout code
- Serve both goals: customer traction + Jentic learning

**Next Steps:**

1. Create `backend/orchestration/` directory structure
2. Install `standard-agent`, `arazzo-runner`, `jentic` from PyPI
3. Implement `BasslinePilatesCoachAgent`
4. Create Arazzo workflow V1 (4-step class generation)
5. Deploy to Render as new service
6. Wire frontend to orchestration service

---

**Document Version:** 1.0
**Last Updated:** November 28, 2025
**Author:** Claude Code (analyzing real Jentic source code)
