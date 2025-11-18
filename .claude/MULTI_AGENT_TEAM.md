# Multi-Agent Development Team Configuration

This document defines the specialized agent team structure for building Pilates MVP2.

## Team Structure

### 1. Frontend Development Agent
**Role**: React component development, UI/UX implementation
**Responsibilities**:
- Build React components following MVP pixel-perfect design
- Implement drag-and-drop functionality
- Create responsive layouts with Tailwind CSS
- Manage frontend state with Zustand
- Ensure TypeScript type safety

**Constraints**:
- Must match existing MVP design exactly (no improvements)
- Must use existing color palette (burgundy #800020, cream #F5E6D3, forest #2D5016)
- Must follow component structure in CLAUDE.md
- Must preserve all UX patterns from MVP

**Key Files**:
- `frontend/src/components/**`
- `frontend/src/pages/**`
- `frontend/src/hooks/**`
- `frontend/src/store/**`

---

### 2. Backend Development Agent
**Role**: FastAPI endpoints, business logic, agent integration
**Responsibilities**:
- Build FastAPI routes and endpoints
- Implement business logic in services layer
- Ensure database integration works correctly
- Maintain EU AI Act compliance logging
- Write backend tests with pytest

**Constraints**:
- All AI decisions must be logged to `ai_decision_log` table
- Must follow sequencing safety rules (see CLAUDE.md)
- Must use Pydantic models for validation
- Must implement graceful degradation for AI failures

**Key Files**:
- `backend/api/**`
- `backend/services/**`
- `backend/models/**`
- `backend/agents/**`

---

### 3. Testing & QA Agent
**Role**: Testing, validation, bug detection
**Responsibilities**:
- Write unit tests (pytest, Jest)
- Write integration tests
- Test API endpoints with realistic data
- Validate sequencing rules
- Check for edge cases and error handling

**Constraints**:
- Tests must cover safety-critical sequencing logic
- Must test with 34 classical Pilates movements
- Must validate EU AI Act compliance
- Must check GDPR PII tokenization

**Key Files**:
- `backend/tests/**`
- `frontend/src/**/*.test.tsx`
- Test data fixtures

---

### 4. Architecture Review Agent
**Role**: Design consistency, technical debt prevention
**Responsibilities**:
- Ensure alignment with CLAUDE.md architecture
- Review code for design pattern consistency
- Prevent feature creep (MVP pixel-perfect only)
- Validate database schema changes
- Check for performance issues

**Constraints**:
- No modernization or improvements to MVP design
- Must preserve all business logic from Excel database
- Must maintain EU AI Act and GDPR compliance
- Must follow session plan in Pilates_App_Daily_Sessions_FINAL.md

**Key Files**:
- `CLAUDE.md`
- `Pilates_App_Daily_Sessions_FINAL.md`
- Architecture diagrams
- Database schema

---

## Coordination Strategy

### Parallel Work Distribution

**Session 5 Example - Class Builder:**

**Frontend Agent Tasks** (can run in parallel):
1. Build MovementLibrary component with search/filter
2. Build SequenceCanvas drag-and-drop component
3. Build ClassDetailsPanel component
4. Build MuscleBalanceTracker visualization

**Backend Agent Tasks** (can run in parallel):
1. Create `/movements/search` endpoint
2. Create `/class-plans/save` endpoint
3. Create `/class-plans/load` endpoint
4. Add muscle balance calculation service

**Testing Agent Tasks** (after frontend/backend):
1. Test drag-and-drop functionality
2. Test movement search/filter
3. Test class plan save/load
4. Validate sequencing rules enforcement

**Architecture Agent Tasks** (continuous):
1. Review component structure matches CLAUDE.md
2. Ensure MVP pixel-perfect compliance
3. Validate state management patterns
4. Check for code duplication

### Communication Protocol

**Agent Reports Must Include**:
- Task completed
- Files created/modified
- Dependencies on other agents
- Blockers or issues found
- Next steps or recommendations

**Review Gates**:
- Frontend changes reviewed by Architecture Agent before merge
- Backend changes must pass Testing Agent validation
- Any EU AI Act compliance changes reviewed by all agents

---

## Session 5 Execution Plan

### Phase 1: Setup (5 minutes)
- Define tasks for each agent
- Identify dependencies
- Prepare test data (34 movements)

### Phase 2: Parallel Development (30-40 minutes)
- **Frontend Agent**: Build all UI components simultaneously
- **Backend Agent**: Build all API endpoints simultaneously
- **Testing Agent**: Prepare test suites for both

### Phase 3: Integration (10-15 minutes)
- Wire frontend to backend
- Run integration tests
- Fix any bugs found

### Phase 4: Validation (5-10 minutes)
- **Architecture Agent**: Final review
- **Testing Agent**: Run full test suite
- User acceptance testing

**Total Time Estimate**: 45-60 minutes (vs 2-3 hours solo)

---

## Agent Invocation Examples

### Launch Frontend Agent
```
Task: Build MovementLibrary component with search, filter, and drag functionality for Pilates Class Planner. Component must match MVP design exactly (burgundy #800020, cream #F5E6D3). Use Zustand store for state. Return: component file path, dependencies, and integration notes.
```

### Launch Backend Agent
```
Task: Create FastAPI endpoint `/movements/search` that accepts filters (difficulty, muscle_group, duration) and returns matching movements from database. Must log to ai_decision_log for EU AI Act compliance. Return: endpoint code, test examples, and documentation.
```

### Launch Testing Agent
```
Task: Write pytest tests for sequence validation that ensure spinal progression rule (flexion before extension) is enforced. Test with realistic movement sequences from 34 classical Pilates movements. Return: test file, test cases covered, and any edge cases found.
```

### Launch Architecture Agent
```
Task: Review the MovementLibrary component against CLAUDE.md and MVP design requirements. Check: pixel-perfect match, correct color usage, proper state management, no feature creep. Return: approval status, any violations found, and recommendations.
```

---

## Success Metrics

**Speed**: 3-5x faster than solo development
**Quality**: No regressions, all tests pass
**Consistency**: Matches CLAUDE.md architecture 100%
**Compliance**: EU AI Act and GDPR requirements met

---

*This multi-agent team configuration enables rapid, parallel development while maintaining high quality and strict adherence to project requirements.*
