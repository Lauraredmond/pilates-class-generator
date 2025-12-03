# Reasoner Mode Implementation Guide

**Session:** Validation Reasoning & Questionnaires Feature
**Date:** December 3, 2025
**Status:** Schema complete, backend integration pending

---

## Overview

This guide explains the **Default vs Reasoner Mode** architecture for Pilates class generation, designed to support two distinct user experiences:

- **Default Mode**: Fast, consistent, free (no LLM costs)
- **Reasoner Mode**: Personalized, adaptive, AI-powered (small LLM cost)

---

## Architecture Summary

### Default Mode (Direct Tool Calling)

**How it works:**
1. User requests class generation
2. Backend checks `user_preferences.use_reasoner_mode` → `false`
3. Agent uses direct database selection:
   - Preparation: SELECT from `preparation_scripts` WHERE `difficulty_level` = user's level
   - Warm-up: CALL `select_warmup_by_muscle_groups(target_muscles, 'default')`
   - Main Movements: AI-generated sequence (existing behavior)
   - Cool-down: CALL `select_cooldown_by_muscle_groups(target_muscles, 'default')`
   - Meditation: SELECT from `closing_meditation_scripts` WHERE `post_intensity` matches class
   - HomeCare: SELECT from `closing_homecare_advice` random or focus-based

**Cost:** $0.00 (no LLM calls for orchestration)
**Speed:** ~2-3 seconds
**Reliability:** High (deterministic)

---

### Reasoner Mode (ReWOO Reasoning)

**How it works:**
1. User requests class generation
2. Backend checks `user_preferences.use_reasoner_mode` → `true`
3. Agent uses ReWOO reasoning loop (Plan → Execute → Reflect):
   - **Plan:** Understand user's questionnaire responses, goals, injuries
   - **Execute:** Generate personalized content using LLM
   - **Reflect:** Validate required elements are present
4. For each section:
   - Preparation: AI generates new script with 4 required core principles
   - Warm-up: AI generates custom warm-up for specific muscle targets
   - Main Movements: AI varies narrative/visual cues (existing movements)
   - Cool-down: AI generates custom cool-down for muscles worked
   - Meditation: AI varies narrative (same structure)
   - HomeCare: AI generates advice from American School of Medicine sources

**Cost:** ~$0.03-0.05 per class
**Speed:** ~10-15 seconds (includes LLM reasoning)
**Reliability:** Medium-High (depends on validation)

---

## Database Schema

### User Preferences Table

```sql
ALTER TABLE user_preferences
ADD COLUMN use_reasoner_mode BOOLEAN DEFAULT false,
ADD COLUMN reasoner_enabled_date TIMESTAMP WITH TIME ZONE;
```

**Fields:**
- `use_reasoner_mode`: Enable AI reasoning for class generation
- `reasoner_enabled_date`: Timestamp when user enabled (for analytics)

---

### Section Tables (All 6 Updated)

Each section table now has variability fields:

#### 1. preparation_scripts

```sql
ALTER TABLE preparation_scripts
ADD COLUMN required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN allow_ai_generation BOOLEAN DEFAULT false;
```

**Required Elements (Always Present):**
```json
[
  "Wake up the core muscles",
  "Posture explanation (feet, knees, hips, shoulders, head alignment)",
  "Core activation (belt tightening or 100% to 30% tension visual)",
  "Lateral thoracic breathing (fingers on rib cage cue)"
]
```

**Behavior:**
- **Default Mode:** SELECT pre-written script from database
- **Reasoner Mode:** AI generates new script, validated against required_elements

---

#### 2. warmup_routines

```sql
ALTER TABLE warmup_routines
ADD COLUMN required_muscle_groups TEXT[] DEFAULT '{}',
ADD COLUMN allow_ai_generation BOOLEAN DEFAULT false;
```

**Required Muscle Groups:** Based on `muscle_balance` from main sequence

**Behavior:**
- **Default Mode:** SELECT routine WHERE `required_muscle_groups` overlaps with `target_muscles`
- **Reasoner Mode:** AI generates custom warm-up for specific muscles, ensuring all `required_muscle_groups` are addressed

**Database Function:**
```sql
SELECT * FROM select_warmup_by_muscle_groups(
    ARRAY['Glute Strength', 'Hip Flexor Strengthening'],
    'default'  -- or 'reasoner'
);
```

---

#### 3. movements (Main Movements)

**No schema changes needed** - already AI-generated

**Behavior:**
- **Default Mode:** Use canonical movement narrative from database
- **Reasoner Mode:** AI can vary narrative/visual cues while preserving safety content

**Required Elements:**
- Movement + transition must always be present (in that order)
- Transition must be comfortable and make sense

---

#### 4. cooldown_sequences

```sql
ALTER TABLE cooldown_sequences
ADD COLUMN required_muscle_groups TEXT[] DEFAULT '{}',
ADD COLUMN allow_ai_generation BOOLEAN DEFAULT false;
```

**Same behavior as warm-ups** (targets muscles worked in main sequence)

**Database Function:**
```sql
SELECT * FROM select_cooldown_by_muscle_groups(
    ARRAY['Glute Strength', 'Hamstring Strength'],
    'reasoner'
);
```

---

#### 5. closing_meditation_scripts

```sql
ALTER TABLE closing_meditation_scripts
ADD COLUMN required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN allow_ai_variation BOOLEAN DEFAULT false;
```

**Required Elements:**
```json
[
  "Short narrative (students should have time to enjoy music)",
  "Breathing direction (lateral thoracic breathing no longer applicable)"
]
```

**Behavior:**
- **Default Mode:** SELECT script WHERE `post_intensity` matches class
- **Reasoner Mode:** AI varies narrative (same structure, different words/imagery)

---

#### 6. closing_homecare_advice

```sql
ALTER TABLE closing_homecare_advice
ADD COLUMN required_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN allow_ai_generation BOOLEAN DEFAULT false,
ADD COLUMN source_preference VARCHAR(255) DEFAULT 'American School of Medicine';
```

**Required Elements:**
```json
[
  "Source information and disclaimer: This is guidance only, consult physician if any concerns"
]
```

**Behavior:**
- **Default Mode:** SELECT advice WHERE `focus_area` matches class (random if no match)
- **Reasoner Mode:** AI generates advice from American School of Medicine, always includes disclaimer

---

## Backend Implementation

### Phase 1: Default Mode (Implement Now)

Update `backend/api/agents.py` → `generate_complete_class()`:

```python
@router.post("/generate-complete-class")
async def generate_complete_class(
    request: CompleteClassRequest,
    user_id: str = Depends(get_current_user_id),
    agent: BasslinePilatesCoachAgent = Depends(get_agent)
):
    # Check user mode
    user_prefs = supabase.table('user_preferences').select('use_reasoner_mode').eq('user_id', user_id).single().execute()
    use_reasoner = user_prefs.data.get('use_reasoner_mode', False)

    if use_reasoner:
        # Phase 2: Reasoner mode (not implemented yet)
        raise HTTPException(status_code=501, detail="Reasoner mode not yet implemented. Please disable in settings.")

    # DEFAULT MODE: Direct selection

    # Step 1: Generate main sequence (existing)
    sequence_result = call_agent_tool(
        tool_id="generate_sequence",
        parameters=request.class_plan.dict(),
        user_id=user_id,
        agent=agent
    )

    # Extract muscle groups from sequence
    muscle_balance = sequence_result["data"]["muscle_balance"]
    target_muscles = list(muscle_balance.keys())

    # Step 2: Select preparation script
    prep_response = supabase.rpc(
        'select_preparation_by_difficulty',
        {'difficulty': request.class_plan.difficulty_level}
    ).execute()
    preparation = prep_response.data

    # Step 3: Select warm-up routine
    warmup_response = supabase.rpc(
        'select_warmup_by_muscle_groups',
        {'target_muscles': target_muscles, 'user_mode': 'default'}
    ).execute()
    warmup = warmup_response.data

    # Step 4: Select cool-down sequence
    cooldown_response = supabase.rpc(
        'select_cooldown_by_muscle_groups',
        {'target_muscles': target_muscles, 'user_mode': 'default'}
    ).execute()
    cooldown = cooldown_response.data

    # Step 5: Select meditation
    meditation_response = supabase.table('closing_meditation_scripts') \
        .select('*') \
        .eq('post_intensity', 'moderate') \
        .limit(1) \
        .execute()
    meditation = meditation_response.data[0]

    # Step 6: Select homecare advice
    homecare_response = supabase.table('closing_homecare_advice') \
        .select('*') \
        .limit(1) \
        .execute()
    homecare = homecare_response.data[0]

    # Step 7: Select music (existing)
    music_result = call_agent_tool(
        tool_id="select_music",
        parameters={...},
        user_id=user_id,
        agent=agent
    )

    # Assemble complete class
    return {
        "success": True,
        "data": {
            "preparation": preparation,
            "warmup": warmup,
            "sequence": sequence_result,
            "cooldown": cooldown,
            "meditation": meditation,
            "homecare": homecare,
            "music": music_result
        },
        "metadata": {
            "mode": "default",
            "cost": 0.00
        }
    }
```

---

### Phase 2: Reasoner Mode (Implement After Fixing ReWOO)

**Prerequisites:**
1. Fix ReWOO transcript truncation (increase field size)
2. Fix tool discovery issues
3. Limit planning to max 7 steps

**Implementation:**

```python
@router.post("/generate-complete-class")
async def generate_complete_class(...):
    if use_reasoner:
        # REASONER MODE: AI generation with validation

        # Create reasoning task
        task = f"""
        Generate a complete Pilates class for:
        - User ID: {user_id}
        - Difficulty: {request.class_plan.difficulty_level}
        - Duration: {request.class_plan.target_duration_minutes} minutes
        - Focus: {request.class_plan.focus_areas}

        User's questionnaire responses:
        {user_questionnaire}

        Generate all 6 sections with required elements validated.
        """

        # Use ReWOO reasoning
        result = await agent.solve(task=task, context={
            'user_id': user_id,
            'required_elements': get_required_elements_for_all_sections(),
            'muscle_groups': muscle_groups_from_db
        })

        # Validate each section
        for section_name, section_content in result['sections'].items():
            validation = validate_section(section_name, section_content)
            if not validation['is_valid']:
                raise ValidationError(f"Section {section_name} missing: {validation['missing_elements']}")

        return {
            "success": True,
            "data": result,
            "metadata": {
                "mode": "reasoner",
                "cost": result.get('llm_cost', 0.03)
            }
        }
```

---

## Validation Functions

### validate_required_elements()

```sql
SELECT * FROM validate_required_elements(
    'preparation',
    'Welcome to class. Let''s wake up your core muscles...',
    '["Wake up the core muscles", "Posture explanation", "Core activation", "Lateral thoracic breathing"]'::jsonb
);
```

**Returns:**
```json
{
  "is_valid": true,
  "missing_elements": [],
  "validation_message": "All required elements present"
}
```

**If elements missing:**
```json
{
  "is_valid": false,
  "missing_elements": ["Core activation", "Lateral thoracic breathing"],
  "validation_message": "Missing required elements: Core activation, Lateral thoracic breathing"
}
```

---

## Content Inventory

After running migration 012:

| Section | Total Count | Muscle Group Coverage |
|---------|-------------|----------------------|
| Preparation | 2 scripts | N/A (all difficulties) |
| Warm-up | 8 routines | Hip flexors, glutes, back, shoulders, hamstrings, chest, full body |
| Main Movements | 34 movements | All muscle groups |
| Cool-down | 8 sequences | Hip flexors, glutes, back, shoulders, hamstrings, chest, full body |
| Meditation | 2 scripts | All intensities |
| HomeCare | 2 advice pieces | Spine care, core strength |

---

## Testing Plan

### Test Default Mode

```bash
# 1. Generate class with default mode
curl -X POST https://pilates-class-generator-api3.onrender.com/api/agents/generate-complete-class \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_plan": {
      "target_duration_minutes": 60,
      "difficulty_level": "Intermediate",
      "focus_areas": ["core", "glutes"]
    },
    "include_music": true,
    "include_meditation": true
  }'

# 2. Verify response includes all 6 sections
# 3. Check that preparation has 4 core principles
# 4. Check that warm-up targets glutes/core muscles
# 5. Check that cool-down targets same muscles
```

### Test Reasoner Mode (Phase 2)

```bash
# 1. Enable reasoner mode for test user
psql -c "UPDATE user_preferences SET use_reasoner_mode = true WHERE user_id = 'test-user-id';"

# 2. Generate class with reasoner mode
# (same API call as above)

# 3. Verify AI-generated content has required elements
# 4. Check validation passed
# 5. Verify cost metadata is present
```

---

## Cost Analysis

### Default Mode (Current)
- **Preparation:** $0.00 (database lookup)
- **Warm-up:** $0.00 (database lookup)
- **Main Movements:** $0.00 (direct tool calling, no ReWOO)
- **Cool-down:** $0.00 (database lookup)
- **Meditation:** $0.00 (database lookup)
- **HomeCare:** $0.00 (database lookup)
- **Total:** $0.00 per class

### Reasoner Mode (Phase 2)
- **Preparation:** ~$0.01 (LLM generation)
- **Warm-up:** ~$0.01 (LLM generation)
- **Main Movements:** ~$0.01 (narrative variation)
- **Cool-down:** ~$0.01 (LLM generation)
- **Meditation:** ~$0.005 (narrative variation)
- **HomeCare:** ~$0.005 (LLM generation + web research)
- **Total:** ~$0.03-0.05 per class

**ROI Consideration:**
Reasoner mode is acceptable cost for users who value personalization (e.g., injury modifications, adaptive difficulty, custom narratives).

---

## Next Steps

### Immediate (Now)
1. ✅ Apply migration 012 to Supabase production
2. ⏸️ Implement Default mode in `generate_complete_class()` endpoint
3. ⏸️ Test Default mode end-to-end
4. ⏸️ Update frontend to show mode selection in Settings

### Phase 2 (After ReWOO Fixed)
1. ⏸️ Fix ReWOO transcript truncation
2. ⏸️ Fix tool discovery issues
3. ⏸️ Implement Reasoner mode in backend
4. ⏸️ Test validation functions with AI-generated content
5. ⏸️ Add questionnaire feature for user onboarding
6. ⏸️ Enable Reasoner mode in production

---

## Summary

This architecture provides:
- ✅ **Scalability:** Can add more content to database without code changes
- ✅ **Flexibility:** Users choose their experience (fast & free vs personalized & paid)
- ✅ **Safety:** Required elements always validated
- ✅ **Cost-effective:** Free for basic users, premium for advanced
- ✅ **Extensible:** Easy to add new sections, muscle groups, or content variants

**The schema is designed, content is populated, and Default mode is ready to implement!**

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
