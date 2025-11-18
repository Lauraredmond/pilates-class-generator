# Excel Schema Documentation
## Pilates_Summary_Spreadsheet_teachingTracker_v10.xlsm

**Extraction Date:** 2025-11-14
**Total Sheets:** 12
**Total Movements:** 34-35 Classical Pilates Movements

---

## Sheet Summary

| Sheet Name | Rows | Columns | Purpose |
|------------|------|---------|---------|
| Movement summaries | 36 | 36 | Main movement catalog with goals, muscle groups, levels, watch points, visualizations |
| Transposed view | 36 | 38 | Movements as columns with attributes as rows (alternate view) |
| Class | 25 | 5 | Sample class plan template |
| Class plan 1-1 assessment | 25 | 4 | One-on-one assessment class structure |
| Class 1-1 Repeat notes | 17 | 1 | Follow-up notes for repeat clients |
| CH Class history - detail | 35 | 6 | Historical class details with dates, categories, steps |
| CH Class history - stats | 171 | 12 | Statistical analysis of class history |
| Movement history | 38 | 7 | Pivot analysis of movement selection over time |
| Muscle group history | 28 | 7 | Tracking muscle group usage across classes |
| **Movement attributes** | 35 | 7 | **Movement narrative, levels, setup, difficulty** |
| **Transition narratives** | 21 | 2 | **Transition scripts between movements** |
| **Class plan rules** | 17 | 2 | **Sequencing rules for safe class planning** |

---

## Key Sheet Details

### 1. Movement Summaries (Primary Movement Data)

**Structure:** Movements as rows, attributes as columns

**Key Columns (Goals/Purposes):**
- Scapular Stability
- Pelvic Stability
- Spinal stability
- Core strength
- Scapular Strengthening
- Pelvic Strengthening
- Hip flexor strengthening
- Hip mobility and/or strengthening
- Thoracic mobility &/or strength
- Posterior chain strength (glutes & spinal extensors)
- Upper body strength
- Glute strength
- Hamstring strength
- Shoulder mobility
- Spinal mobility
- Chest stretch
- Lower back stretch
- Hamstring stretch
- Erector Spinae stretch
- Thigh stretch
- Sequential control
- Balance
- Coordination

**Other Columns:**
- **#Levels** - Difficulty progression levels (L1, L2, FV)
- **Watch Out Points** - Safety warnings and common mistakes
- **Visualisations** - Teaching cues and imagery

**Sample Movements Extracted:**
1. The Hundred
2. The Roll Up
3. The Roll Over
4. One leg circle
5. Rolling back
6. One leg stretch
7. Double leg stretch
8. Spine stretch
9. Rocker with Open legs
10. The Corkscrew
11. The Saw
12. The Swan Dive
13. One leg kick
14. Double leg kick
15. Neck pull
16. Scissors
17. Bicycle (& Scissors)
18. Shoulder Bridge
19. Spine twist
20. Jack knife
21. Side kick
22. Teaser
23. Hip twist
24. Swimming
25. Leg pull prone
26. Leg pull supine
27. Side kick kneeling
28. Side bend
29. Boomerang
30. The Seal
31. The Crab
32. Rocking
33. Control balance
34. Push up

**Total:** 34 classical movements

---

### 2. Transposed View

**Structure:** Movements as columns, attributes as rows

Same data as Movement Summaries but transposed for easier comparison across movements.

**Includes Excel Formulas:**
- `=SUMIFS($B$30:$AI$30,B2:AI2,"Y")` - Counts movements meeting specific goals

---

### 3. Movement Attributes ⭐

**Columns:**
1. **Movement** - Movement name
2. **Narrative** - Teaching narrative/story for the movement
3. **Levels** - Difficulty levels (L1, L2, Full Version)
4. **Setup position** - Starting position description
5. **Difficulty** - Beginner/Intermediate/Advanced classification
6. **Additional attributes** (columns 6-7)

**Purpose:** Provides detailed execution narratives and setup instructions for each movement.

---

### 4. Class Plan Rules ⭐⭐⭐

**Columns:**
1. **Rule #** - Rule identifier
2. **Rule description** - Detailed sequencing rule

**Total Rules:** 16 safety and quality rules

**Purpose:** Critical sequencing rules that must be enforced to ensure safe, effective class planning.

**Examples likely include:**
- Warm-up requirements
- Spinal progression rules (flexion before extension)
- Muscle group balance requirements
- Complexity progression
- Cool-down requirements

---

### 5. Transition Narratives ⭐

**Columns:**
1. **Transition type** - Type of transition (e.g., "Prone to Supine")
2. **Transition narrative** - Script for smooth transition between movements

**Total Transitions:** 20 scripted transitions

**Purpose:** Provides smooth, professional transitions between movements with appropriate cueing.

---

### 6. Class (Sample Class Plan)

**Columns:**
1. Warm up
2. Spine Twist
3-5. Additional movements

**Rows:** 18 movements in sequence

**Purpose:** Example of a complete class plan showing proper sequencing.

---

### 7. CH Class History - Stats

**Columns:**
- Week
- Movement
- Position in sequence
- Class Selection
- Additional tracking columns (12 total)

**Total Records:** 170 historical class records

**Purpose:** Statistical analysis of past classes for trend identification and variety tracking.

---

## Data Relationships

### Movement → Goals (Many-to-Many)
Each movement achieves multiple goals/purposes:
- **The Hundred:** Scapular Stability + Core strength + Hip flexor strengthening
- **The Roll Up:** Scapular Stability + Core strength + Hip flexor strengthening + Shoulder mobility + Sequential control

### Movement → Levels (One-to-Many)
Each movement has multiple difficulty levels:
- **L1 (Level 1):** Beginner modification
- **L2 (Level 2):** Intermediate modification
- **FV (Full Version):** Advanced/classical version

### Movement → Muscle Groups
Movements target specific muscle groups tracked in "Muscle group history"

### Class Plans → Rules
All class plans must adhere to rules defined in "Class plan rules"

### Movements → Transitions
Transitions connect movements based on position changes (prone/supine/side-lying)

---

## Key Observations

### Movement Count
- **34 movements** identified in Transposed view
- **35 movements** in Movement summaries (slight discrepancy - likely includes a warm-up)

### Levels System
- **L1:** Beginner-friendly modifications (e.g., feet on floor, head down)
- **L2:** Intermediate progressions
- **FV (Full Version):** Classical Pilates execution

### Safety Features
- **Watch Out Points:** Documents common errors and safety warnings
- **Class plan rules:** Enforces safe sequencing
- **Levels:** Allows appropriate modifications for all fitness levels

### Teaching Enhancements
- **Visualisations:** Rich imagery for cueing (e.g., "spine like a string of pearls")
- **Narratives:** Story-based teaching approach
- **Transitions:** Professional scripting between movements

---

## Data Quality Notes

### Strengths
✅ Comprehensive movement catalog (34 classical movements)
✅ Rich muscle group mappings (20+ goals/purposes)
✅ Multi-level progression system
✅ Safety guidelines included
✅ Teaching narratives for professional delivery
✅ Historical tracking for analysis

### Considerations
⚠️ Some unnamed columns ("Unnamed: 2", "Unnamed: 3") need mapping
⚠️ Excel formulas need conversion to database functions
⚠️ Slight discrepancy in movement count (34 vs 35)
⚠️ Data spans multiple sheets - relationships need preservation

---

## Next Steps for Database Migration

### Priority 1: Core Movement Data
1. Extract **Movement attributes** sheet (narratives, levels, difficulty)
2. Extract **Movement summaries** sheet (goals, muscle groups)
3. Merge into unified movement catalog

### Priority 2: Sequencing Rules
1. Extract **Class plan rules** sheet
2. Convert to database constraints/validation functions
3. Implement in backend sequencing logic

### Priority 3: Teaching Enhancements
1. Extract **Transition narratives**
2. Store as reusable text templates
3. Link to movement position types

### Priority 4: Historical Data (Optional)
1. Import **CH Class history** for analytics
2. Use for recommendation algorithms
3. Track user progress patterns

---

## Database Schema Recommendations

```sql
-- Core Tables
movements (id, name, difficulty, narrative, setup_position, ...)
movement_goals (movement_id, goal_type, is_primary)
movement_levels (movement_id, level_name, modifications)
muscle_groups (id, name, description)
movement_muscles (movement_id, muscle_group_id)

-- Sequencing
sequence_rules (id, rule_number, description, rule_type, priority)
transitions (id, from_position, to_position, narrative)

-- Class Planning
class_plans (id, user_id, created_at, ...)
class_movements (class_id, movement_id, sequence_order)

-- Historical (Analytics)
class_history (id, class_date, movements_used, ...)
```

---

*This documentation provides a comprehensive map of the Excel workbook structure, enabling accurate database migration with zero data loss.*
