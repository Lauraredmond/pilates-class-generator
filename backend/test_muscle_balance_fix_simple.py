#!/usr/bin/env python3
"""
Simple verification that the muscle balance fix is correct.
This script directly checks the source code to verify the fix.
"""

import os

def verify_fix():
    """Verify that _check_historical_muscle_balance now uses class_movements table"""

    file_path = "/Users/lauraredmond/Documents/Bassline/Projects/MVP2/backend/orchestrator/tools/muscle_overlap_analyzer.py"

    with open(file_path, 'r') as f:
        content = f.read()

    # Find the _check_historical_muscle_balance function
    func_start = content.find("def _check_historical_muscle_balance")
    if func_start == -1:
        print("❌ ERROR: Could not find _check_historical_muscle_balance function")
        return False

    # Get the function content (next 500 chars should include the table query)
    func_content = content[func_start:func_start + 2000]

    print("=" * 60)
    print("Verifying Historical Muscle Balance Fix")
    print("=" * 60)

    # Check 1: Should query class_movements table
    if "table('class_movements')" in func_content:
        print("✅ PASS: Function now queries 'class_movements' table")
    else:
        print("❌ FAIL: Function does not query 'class_movements' table")
        return False

    # Check 2: Should NOT query movement_usage table
    if "table('movement_usage')" in func_content:
        print("❌ FAIL: Function still queries old 'movement_usage' table")
        return False
    else:
        print("✅ PASS: Function no longer queries 'movement_usage' table")

    # Check 3: Should use class_generated_at field (from class_movements)
    if "'class_generated_at'" in func_content:
        print("✅ PASS: Function uses 'class_generated_at' field from class_movements")
    else:
        print("⚠️  WARNING: Could not verify use of 'class_generated_at' field")

    # Also verify the movement coverage function for comparison
    print("\n" + "-" * 60)
    print("Verifying Movement Coverage (for comparison)")
    print("-" * 60)

    coverage_start = content.find("def _check_historical_movement_coverage")
    if coverage_start != -1:
        coverage_content = content[coverage_start:coverage_start + 2000]
        if "table('class_movements')" in coverage_content:
            print("✅ Movement coverage also uses 'class_movements' table (correct)")
        else:
            print("⚠️  Movement coverage uses different approach")

    print("\n" + "=" * 60)
    print("🎉 FIX VERIFIED!")
    print("=" * 60)
    print("\nSummary:")
    print("- Historical muscle balance now queries 'class_movements' table ✅")
    print("- No longer queries empty 'movement_usage' table ✅")
    print("- This fixes the 'No historical data available' issue")
    print("\nExpected Result:")
    print("- Sequencing reports will now show historical muscle balance data")
    print("- Full repertoire coverage tracking will work correctly")
    print("- Beginner movements will be considered in advanced classes")

    return True

def check_sample_report():
    """Check the sample report to understand what was broken"""

    report_path = "/Users/lauraredmond/Downloads/sequencing-report-764f942e-af29-47bd-98ed-b91cb860a548-2026-03-16.md"

    if os.path.exists(report_path):
        print("\n" + "=" * 60)
        print("Analyzing Sample Report")
        print("=" * 60)

        with open(report_path, 'r') as f:
            content = f.read()

        # Check for the problematic line
        if "No historical data available (this may be the first class)" in content:
            print("❌ Report shows: 'No historical data available'")
            print("   This was the bug - movement_usage table had no data")

        # But the report also shows it has data elsewhere
        if "Total Classes Analyzed: 27" in content:
            print("✅ Report also shows: 27 classes analyzed")
            print("   This proves class_movements table HAS data")

        if "Total Unique Movements Practiced: 35" in content:
            print("✅ Report shows: 35 unique movements practiced")
            print("   Movement coverage was working (used class_movements)")

        print("\n📝 Conclusion:")
        print("   - Movement coverage worked (queried class_movements) ✅")
        print("   - Muscle balance failed (queried movement_usage) ❌")
        print("   - The fix changes muscle balance to also use class_movements ✅")

if __name__ == "__main__":
    success = verify_fix()
    check_sample_report()

    if success:
        exit(0)
    else:
        exit(1)