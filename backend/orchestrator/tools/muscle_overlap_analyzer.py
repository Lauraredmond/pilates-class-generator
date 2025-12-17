"""
Muscle Overlap Analyzer
Generates QA reports for consecutive muscle overlap validation
"""

from typing import List, Dict, Any
from datetime import datetime
import os


def generate_overlap_report(sequence: List[Dict[str, Any]], output_dir: str = None) -> str:
    """
    Generate a detailed muscle overlap analysis report

    Args:
        sequence: List of movement dicts with muscle_groups
        output_dir: Directory to save report (default: analytics/)

    Returns:
        Path to generated report file
    """
    if not output_dir:
        output_dir = "/Users/lauraredmond/Documents/Bassline/Projects/MVP2/analytics"

    # Create analytics directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = os.path.join(output_dir, f"muscle_overlap_report_{timestamp}.md")

    # Build report content
    lines = []
    lines.append("# Muscle Overlap Analysis Report")
    lines.append(f"\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"\n**Total Movements:** {len(sequence)}")
    lines.append("\n---\n")

    # Section 1: Movement Sequence with Muscle Groups (CSV format)
    lines.append("## Movement Sequence Data (CSV)\n")
    lines.append("```csv")
    lines.append("Position,Movement Name,Muscle Groups,Muscle Count")

    for i, movement in enumerate(sequence):
        name = movement.get('name', 'Unknown')
        muscle_groups = movement.get('muscle_groups', [])
        muscle_names = [mg.get('name', '') for mg in muscle_groups]
        muscle_str = '; '.join(muscle_names) if muscle_names else 'None'
        lines.append(f"{i+1},{name},\"{muscle_str}\",{len(muscle_names)}")

    lines.append("```\n")

    # Section 2: Consecutive Overlap Analysis (CSV format)
    lines.append("## Consecutive Muscle Overlap Analysis (CSV)\n")
    lines.append("```csv")
    lines.append("Movement A,Movement B,Shared Muscles,Overlap Count,Overlap %,Pass (<50%)?")

    overlap_results = []
    for i in range(len(sequence) - 1):
        current = sequence[i]
        next_mov = sequence[i + 1]

        current_name = current.get('name', 'Unknown')
        next_name = next_mov.get('name', 'Unknown')

        current_muscles = set(mg.get('name', '') for mg in current.get('muscle_groups', []))
        next_muscles = set(mg.get('name', '') for mg in next_mov.get('muscle_groups', []))

        if current_muscles and next_muscles:
            overlap = current_muscles & next_muscles
            overlap_count = len(overlap)
            overlap_pct = (overlap_count / len(next_muscles)) * 100 if next_muscles else 0

            shared_str = '; '.join(sorted(overlap)) if overlap else 'None'
            pass_fail = "✅ PASS" if overlap_pct < 50 else "❌ FAIL"

            lines.append(f"{current_name},{next_name},\"{shared_str}\",{overlap_count},{overlap_pct:.1f}%,{pass_fail}")

            overlap_results.append({
                'current': current_name,
                'next': next_name,
                'overlap_pct': overlap_pct,
                'pass': overlap_pct < 50
            })
        else:
            lines.append(f"{current_name},{next_name},\"No muscle data\",0,0.0%,⚠️ N/A")

    lines.append("```\n")

    # Section 3: Summary Statistics
    lines.append("## Summary Statistics\n")

    if overlap_results:
        total_pairs = len(overlap_results)
        passed = sum(1 for r in overlap_results if r['pass'])
        failed = total_pairs - passed
        avg_overlap = sum(r['overlap_pct'] for r in overlap_results) / total_pairs
        max_overlap = max(r['overlap_pct'] for r in overlap_results)
        max_overlap_pair = next(r for r in overlap_results if r['overlap_pct'] == max_overlap)

        lines.append(f"- **Total Consecutive Pairs:** {total_pairs}")
        lines.append(f"- **Passed (<50% overlap):** {passed} ({passed/total_pairs*100:.1f}%)")
        lines.append(f"- **Failed (≥50% overlap):** {failed} ({failed/total_pairs*100:.1f}%)")
        lines.append(f"- **Average Overlap:** {avg_overlap:.1f}%")
        lines.append(f"- **Maximum Overlap:** {max_overlap:.1f}% ({max_overlap_pair['current']} → {max_overlap_pair['next']})")

        if failed > 0:
            lines.append(f"\n### ❌ **FAILURES DETECTED:** {failed} consecutive pair(s) exceed 50% overlap threshold")
            lines.append("\nFailed pairs:")
            for r in overlap_results:
                if not r['pass']:
                    lines.append(f"- **{r['current']} → {r['next']}** ({r['overlap_pct']:.1f}% overlap)")
        else:
            lines.append("\n### ✅ **ALL CHECKS PASSED:** No consecutive movements exceed 50% overlap")
    else:
        lines.append("⚠️ No overlap data available (missing muscle groups)")

    lines.append("\n---\n")

    # Section 4: Detailed Muscle Group Matrix
    lines.append("## Detailed Muscle Group Breakdown\n")

    for i, movement in enumerate(sequence):
        name = movement.get('name', 'Unknown')
        muscle_groups = movement.get('muscle_groups', [])
        muscle_names = [mg.get('name', '') for mg in muscle_groups]

        lines.append(f"\n**{i+1}. {name}**")
        if muscle_names:
            lines.append(f"- Muscle Groups: {', '.join(muscle_names)}")
            lines.append(f"- Count: {len(muscle_names)}")
        else:
            lines.append("- ⚠️ No muscle group data")

        # Show overlap with next movement
        if i < len(sequence) - 1:
            next_mov = sequence[i + 1]
            next_name = next_mov.get('name', 'Unknown')
            current_muscles = set(muscle_names)
            next_muscles = set(mg.get('name', '') for mg in next_mov.get('muscle_groups', []))

            if current_muscles and next_muscles:
                overlap = current_muscles & next_muscles
                overlap_pct = (len(overlap) / len(next_muscles)) * 100

                if overlap:
                    lines.append(f"- Overlap with next ({next_name}): {', '.join(sorted(overlap))} ({overlap_pct:.1f}%)")
                else:
                    lines.append(f"- Overlap with next ({next_name}): None (0.0%)")

    # Write report to file
    report_content = '\n'.join(lines)
    with open(report_path, 'w') as f:
        f.write(report_content)

    return report_path
