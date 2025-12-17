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

## Quality Rule

**Critical Pilates Teaching Rule:**
Consecutive movements must NOT share more than 50% of their muscle groups.

This ensures:
- Proper muscle variety and balance
- Adequate recovery between similar movements
- Safe, effective class progression

## Usage

1. **Generate a class** - Report automatically created
2. **Check analytics/ folder** - Find latest report
3. **Review Summary Statistics** - Quick pass/fail check
4. **Investigate Failures** - If any pairs exceed 50%
5. **Copy CSV data** - Paste into Excel/Sheets for custom analysis

## Excel Formula Example

To calculate overlap between consecutive rows:

```excel
=COUNTIF(SPLIT(C2,";"), SPLIT(C3,";")) / COUNTA(SPLIT(C3,";")) * 100
```

Where column C contains semicolon-separated muscle groups.

## Troubleshooting

**No reports appearing:**
- Check backend logs for "📊 Muscle overlap QA report generated"
- Verify analytics/ directory exists
- Check file permissions

**Missing muscle group data:**
- Movements should have muscle_groups attached
- Check movement_muscles junction table in Supabase
- Verify muscle groups were fetched during sequence generation

**All overlaps show 0%:**
- Indicates muscle_groups field is empty
- Run: Check backend logs for "✅ Attached muscle groups to N movements"
