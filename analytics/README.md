# Muscle Overlap QA Reports

This directory contains automatically generated quality assurance reports for consecutive muscle overlap validation.

## Purpose

Every time a Pilates class is generated, the system creates a detailed report analyzing:
- Which muscle groups each movement uses
- Overlap percentage between consecutive movements
- Whether the overlap exceeds the 50% threshold (fails quality check)

## Report Format

Reports are named: `muscle_overlap_report_YYYYMMDD_HHMMSS.md`

Each report contains:

### 1. Movement Sequence Data (CSV)
Copy-pasteable CSV format showing:
- Position in sequence
- Movement name
- Muscle groups used
- Muscle count

### 2. Consecutive Overlap Analysis (CSV)
For each consecutive pair of movements:
- Movement A and Movement B names
- Shared muscle groups
- Overlap count and percentage
- Pass/Fail status (<50% = PASS, ≥50% = FAIL)

### 3. Summary Statistics
- Total consecutive pairs analyzed
- Pass/fail counts and percentages
- Average overlap across all pairs
- Maximum overlap detected
- List of any failures

### 4. Detailed Breakdown
Movement-by-movement analysis with overlap calculations

### 5. Movement Pattern Proximity Check (NEW)
Detects movements with similar patterns that appear too close together:
- The Crab + The Seal issue: Both are rolling movements with identical muscle groups
- Checks within 3-movement proximity (not just consecutive)
- Similarity score >70% triggers warning
- Flags: Identical muscle groups + Same movement category

**Why This Matters:**
Even if consecutive movements pass the 50% overlap rule, having very similar movements (like The Crab at position 5 and The Seal at position 7) creates a repetitive experience.

### 6. Historical Muscle Balance Analysis (NEW)
Tracks muscle group coverage across recent classes:
- Analyzes last 30 days of user's movements (from `movements_usage` table)
- Shows which muscle groups are underutilized (<30% of classes)
- Identifies new muscle groups in current class
- Recommends targeting underutilized areas in future classes

**Why This Matters:**
Over multiple classes, we should ensure balanced coverage of all muscle groups, not just within a single class.

## Quality Rules

### Rule 1: Consecutive Muscle Overlap
**Critical Pilates Teaching Rule:**
Consecutive movements must NOT share more than 50% of their muscle groups.

This ensures:
- Proper muscle variety and balance
- Adequate recovery between similar movements
- Safe, effective class progression

### Rule 2: Movement Pattern Proximity (NEW)
Movements with >70% muscle similarity should NOT appear within 3 positions of each other.

**Example Violation:**
- Position 5: The Crab (4 muscles: Spinal stability, Core strength, Sequential control, Balance)
- Position 7: The Seal (4 muscles: Spinal stability, Core strength, Sequential control, Balance)
- **Result:** 100% similar, only 2 movements apart → ⚠️ PROXIMITY WARNING

This ensures:
- Variety in movement patterns (not just muscle groups)
- Avoids repetitive experience
- Better engagement and progression

### Rule 3: Historical Muscle Balance (NEW)
All muscle groups should appear in at least 30% of user's recent classes (last 30 days).

This ensures:
- Balanced development across all muscle groups
- No neglected areas over time
- Comprehensive fitness progression

## Usage

### How to Access Reports

**Reports are now returned in the API response** (not saved to server filesystem):

1. **Generate a class** - Report automatically generated
2. **Check API response** - Report included in `qa_report` field
3. **Download from frontend** - (Coming soon: Download button in UI)
4. **Or save manually** - Copy report content from browser Network tab

**To save reports locally** (for testing):
```javascript
// In browser console after generating class:
const report = response.data.qa_report;
const blob = new Blob([report.content], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `muscle_overlap_report_${report.timestamp}.md`;
a.click();
```

**Review Process:**
1. **Review Summary Statistics** - Quick pass/fail check
2. **Investigate Failures** - If any pairs exceed 50%
3. **Copy CSV data** - Paste into Excel/Sheets for custom analysis

## Excel Formula Example

To calculate overlap between consecutive rows:

```excel
=COUNTIF(SPLIT(C2,";"), SPLIT(C3,";")) / COUNTA(SPLIT(C3,";")) * 100
```

Where column C contains semicolon-separated muscle groups.

## Troubleshooting

**How to view report content:**
1. Generate a class in the app
2. Open browser DevTools (F12)
3. Go to Network tab
4. Find `/api/agents/generate-sequence` or `/api/agents/generate-complete-class` request
5. Click on the request → Response tab
6. Look for `qa_report` field → `content` contains full markdown report
7. Copy content to text editor and save as .md file

**Alternative: Check backend logs**
- Look for "📊 Muscle overlap QA report generated: [timestamp]"
- Confirms report was generated successfully

**Missing muscle group data:**
- Movements should have muscle_groups attached
- Check movement_muscles junction table in Supabase
- Verify muscle groups were fetched during sequence generation
- Backend logs should show: "✅ Attached muscle groups to N movements"

**All overlaps show 0%:**
- Indicates muscle_groups field is empty
- Check backend logs for muscle group attachment
- Verify movement_muscles table has data for movements in sequence
