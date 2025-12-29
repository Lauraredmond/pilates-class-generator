"""
Muscle Overlap Analyzer
Generates QA reports for consecutive muscle overlap validation

Enhanced with:
- Movement pattern proximity detection (similar movements too close together)
- Historical muscle balance tracking (underutilized muscle groups)
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)


def generate_overlap_report(
    sequence: List[Dict[str, Any]],
    output_dir: str = None,
    user_id: Optional[str] = None,
    supabase_client = None,
    class_plan_id: Optional[str] = None
) -> dict:
    """
    Generate a detailed muscle overlap analysis report

    Args:
        sequence: List of movement dicts with muscle_groups
        output_dir: Directory to save report (optional - only saves if provided)
        user_id: User ID for historical analysis (optional)
        supabase_client: Supabase client for historical queries (optional)
        class_plan_id: Class plan ID for reconciliation with quality logs (optional)

    Returns:
        Dict with report content and metadata:
        {
            "content": "markdown report content",
            "timestamp": "YYYYMMDD_HHMMSS",
            "class_plan_id": "uuid" (if provided),
            "file_path": "path/to/file" (only if output_dir provided)
        }
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Build report content
    lines = []
    lines.append("# Muscle Overlap Analysis Report")
    lines.append(f"\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"\n**Class ID:** `{class_plan_id if class_plan_id else 'UNKNOWN - CANNOT RECONCILE WITH QUALITY LOG'}`")
    lines.append(f"\n**User ID:** `{user_id if user_id else 'UNKNOWN'}`")
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

    lines.append("\n---\n")

    # Section 4b: Movement Family Balance Analysis (RECONCILIATION WITH QA REPORT RULE 2)
    lines.append("## Movement Family Balance Analysis\n")
    lines.append("**Goal:** Ensure no single movement family dominates the class (Rule 2: Family Balance)\n")
    lines.append("**Rule:** No movement family should exceed 40% of total movements\n")
    lines.append(f"**Total Movements in Class:** {len(sequence)}\n")

    # Calculate family distribution
    family_counts = {}
    for movement in sequence:
        family = movement.get('movement_family', 'other')  # CONSISTENCY FIX: Use 'other' to match QA report
        if family not in family_counts:
            family_counts[family] = 0
        family_counts[family] += 1

    # Convert to percentages
    family_percentages = {
        family: (count / len(sequence) * 100) if len(sequence) > 0 else 0
        for family, count in family_counts.items()
    }

    # Check for overrepresented families (>40%)
    MAX_FAMILY_PERCENTAGE = 40.0
    overrepresented_families = [
        (family, pct) for family, pct in family_percentages.items()
        if pct >= MAX_FAMILY_PERCENTAGE
    ]

    # Display family distribution table
    lines.append("### Family Distribution\n")
    lines.append("```csv")
    lines.append("Movement Family,Count,Percentage,Pass (<40%)?")

    for family, count in sorted(family_counts.items(), key=lambda x: x[1], reverse=True):
        pct = family_percentages[family]
        pass_fail = "✅ PASS" if pct < MAX_FAMILY_PERCENTAGE else "❌ FAIL"
        lines.append(f"{family},{count},{pct:.1f}%,{pass_fail}")

    lines.append("```\n")

    # Summary
    if overrepresented_families:
        lines.append(f"### ❌ **RULE 2 VIOLATION:** {len(overrepresented_families)} family/families exceed 40% threshold\n")
        lines.append("**Overrepresented Families:**")
        for family, pct in overrepresented_families:
            movement_names = [m.get('name') for m in sequence if m.get('movement_family') == family]
            lines.append(f"- **{family}**: {pct:.1f}% ({len(movement_names)} movements)")
            lines.append(f"  - Movements: {', '.join(movement_names)}")
        lines.append("\n**Impact:** This violates QA Rule 2 (Family Balance). The class may lack variety.")
    else:
        lines.append("### ✅ **RULE 2 PASSED:** All movement families are below 40% threshold\n")
        lines.append("The class has good family balance and variety.")

    lines.append("\n**Note:** This section reconciles with the QA Report's 'Rule 2: Family Balance' metric.\n")

    lines.append("\n---\n")

    # Section 5: Movement Pattern Proximity Check (NEW - addresses Crab/Seal issue)
    lines.append("## Movement Pattern Proximity Check\n")
    lines.append("**Rule:** Similar movement patterns should not appear within 3 positions of each other.\n")

    proximity_warnings = _detect_pattern_proximity(sequence, proximity_range=3)

    if proximity_warnings:
        lines.append(f"### ⚠️ **PROXIMITY WARNINGS:** {len(proximity_warnings)} similar movement pair(s) detected\n")
        lines.append("```csv")
        lines.append("Movement A,Position A,Movement B,Position B,Distance,Similarity Score,Warning")

        for warning in proximity_warnings:
            lines.append(
                f"{warning['movement_a']},{warning['pos_a']},"
                f"{warning['movement_b']},{warning['pos_b']},"
                f"{warning['distance']},{warning['similarity_score']:.1f}%,"
                f"{warning['warning_msg']}"
            )

        lines.append("```\n")

        lines.append("**Details:**")
        for warning in proximity_warnings:
            lines.append(
                f"- **{warning['movement_a']}** (pos {warning['pos_a']}) → "
                f"**{warning['movement_b']}** (pos {warning['pos_b']}): "
                f"{warning['similarity_score']:.1f}% similar, {warning['distance']} movements apart"
            )
            lines.append(f"  - Reason: {warning['reason']}")
    else:
        lines.append("### ✅ **NO PROXIMITY ISSUES:** All movement patterns are well-spaced\n")

    lines.append("\n---\n")

    # Section 6: Historical Movement Coverage Analysis (NEW - user requested)
    if user_id and supabase_client:
        lines.append("## Historical Movement Coverage Analysis\n")
        lines.append("**Goal:** Track which movements you've practiced and identify gaps in your repertoire.\n")
        lines.append("**Note:** This analyzes your ENTIRE Pilates journey from day 1.\n")

        movement_coverage = _check_historical_movement_coverage(user_id, sequence, supabase_client)

        if movement_coverage:
            lines.append(f"\n**Total Unique Movements Practiced:** {movement_coverage['total_unique_movements']}")
            lines.append(f"**Total Classes Analyzed:** {movement_coverage['classes_analyzed']}")
            lines.append(f"**Your Journey:** {movement_coverage['days_since_start']} days since first class ({movement_coverage['first_class_date']})\n")

            # Movements in this class
            current_movement_names = [m.get('name', 'Unknown') for m in sequence]
            lines.append("### Movements in This Class\n")
            for i, name in enumerate(current_movement_names, 1):
                lines.append(f"{i}. {name}")
            lines.append("")

            # Never practiced before
            if movement_coverage['never_practiced']:
                lines.append(f"### 🎯 **NEW MOVEMENTS** ({len(movement_coverage['never_practiced'])} movements you've NEVER practiced before)\n")
                for movement in movement_coverage['never_practiced']:
                    lines.append(f"- **{movement}**")
                lines.append("")

            # Rarely practiced (< 3 times)
            if movement_coverage['rarely_practiced']:
                lines.append(f"### ⚠️ **RARELY PRACTICED** ({len(movement_coverage['rarely_practiced'])} movements practiced < 3 times)\n")
                lines.append("```csv")
                lines.append("Movement Name,Times Practiced,Last Practiced (Days Ago)")
                for mov in movement_coverage['rarely_practiced']:
                    lines.append(f"{mov['name']},{mov['count']},{mov['days_ago']}")
                lines.append("```\n")

            # Stalest movements (not in this class)
            if movement_coverage['stale_movements']:
                lines.append(f"### ⏰ **STALEST MOVEMENTS** (Top 10 movements not practiced recently)\n")
                lines.append("```csv")
                lines.append("Movement Name,Last Practiced (Days Ago),Times Used Total")
                for mov in movement_coverage['stale_movements'][:10]:
                    lines.append(f"{mov['name']},{mov['days_ago']},{mov['count']}")
                lines.append("```\n")

            # Repertoire gaps (classical movements never practiced)
            if movement_coverage['repertoire_gaps']:
                lines.append(f"### 📋 **CLASSICAL REPERTOIRE GAPS** ({len(movement_coverage['repertoire_gaps'])} classical movements never practiced)\n")
                lines.append("These are Joseph Pilates' 34 classical movements you haven't tried yet:\n")
                for movement in movement_coverage['repertoire_gaps'][:10]:  # Show first 10
                    lines.append(f"- {movement}")
                if len(movement_coverage['repertoire_gaps']) > 10:
                    lines.append(f"- ...and {len(movement_coverage['repertoire_gaps']) - 10} more")
                lines.append("")
        else:
            lines.append("⚠️ No historical movement coverage data available")
    else:
        lines.append("## Historical Movement Coverage Analysis\n")
        lines.append("⚠️ **Skipped:** Historical analysis requires user_id and database connection")

    lines.append("\n---\n")

    # Section 7: Historical Muscle Balance Check (track muscle coverage over time)
    if user_id and supabase_client:
        lines.append("## Historical Muscle Balance Analysis\n")
        lines.append("**Goal:** Ensure all muscle groups are covered over time (not just in one class).\n")
        lines.append("**Note:** This tracks your ENTIRE Pilates journey from day 1, not just recent classes.\n")

        historical_balance = _check_historical_muscle_balance(user_id, sequence, supabase_client)

        if historical_balance:
            lines.append(f"\n**Total Classes Analyzed:** {historical_balance['classes_analyzed']}")
            lines.append(f"**Your Journey:** {historical_balance['days_since_start']} days since first class ({historical_balance['first_class_date']})\n")

            # Muscle groups used in this class
            lines.append("### Muscle Groups in This Class\n")
            lines.append("```csv")
            lines.append("Muscle Group,Times Used")
            for muscle, count in sorted(historical_balance['current_class_muscles'].items()):
                lines.append(f"{muscle},{count}")
            lines.append("```\n")

            # Historical muscle usage
            lines.append("### Historical Muscle Usage (All-Time)\n")
            lines.append("```csv")
            lines.append("Muscle Group,Total Uses,Classes Appeared,% of Classes,Last Used")
            for muscle, data in sorted(historical_balance['historical_muscles'].items()):
                pct = (data['classes'] / historical_balance['classes_analyzed']) * 100
                last_used = data.get('last_used', 'Never')
                lines.append(f"{muscle},{data['count']},{data['classes']},{pct:.1f}%,{last_used}")
            lines.append("```\n")

            # Movement freshness (stalest movements first)
            if historical_balance.get('movement_freshness'):
                lines.append("### Movement Freshness (Stalest First)\n")
                lines.append("**Shows which movements haven't been used recently**\n")
                lines.append("```csv")
                lines.append("Movement Name,Last Used Date,Days Since Last Use")
                # Show top 10 stalest movements
                for movement in historical_balance['movement_freshness'][:10]:
                    lines.append(f"{movement['name']},{movement['last_used_date']},{movement['days_ago']}")
                lines.append("```\n")

            # Underutilized muscle groups
            if historical_balance['underutilized']:
                lines.append("### ⚠️ **UNDERUTILIZED MUSCLE GROUPS**\n")
                lines.append("These muscle groups have been used in <30% of ALL your classes:\n")
                for muscle, pct in historical_balance['underutilized']:
                    lines.append(f"- **{muscle}**: {pct:.1f}% of classes")
                lines.append("\n**Recommendation:** Consider adding movements targeting these areas in future classes.")
            else:
                lines.append("### ✅ **BALANCED COVERAGE:** All muscle groups are well-represented across your entire journey.\n")

            # New muscle groups in this class
            if historical_balance['new_muscles']:
                lines.append(f"\n### 🎯 **NEW MUSCLE GROUPS IN THIS CLASS:** {len(historical_balance['new_muscles'])}")
                lines.append("\nMuscle groups you've NEVER used before:")
                for muscle in historical_balance['new_muscles']:
                    lines.append(f"- {muscle}")
        else:
            lines.append("⚠️ No historical data available (this may be the first class)")
    else:
        lines.append("## Historical Muscle Balance Analysis\n")
        lines.append("⚠️ **Skipped:** Historical analysis requires user_id and database connection")

    lines.append("\n---\n")

    # Build full report content
    report_content = '\n'.join(lines)

    result = {
        "content": report_content,
        "timestamp": timestamp,
        "class_plan_id": class_plan_id if class_plan_id else None  # For reconciliation with quality logs
    }

    # Optionally save to file (only if output_dir provided)
    if output_dir:
        try:
            os.makedirs(output_dir, exist_ok=True)
            report_path = os.path.join(output_dir, f"muscle_overlap_report_{timestamp}.md")
            with open(report_path, 'w') as f:
                f.write(report_content)
            result["file_path"] = report_path
        except Exception as e:
            result["file_error"] = str(e)

    return result


def _detect_pattern_proximity(sequence: List[Dict[str, Any]], proximity_range: int = 3) -> List[Dict[str, Any]]:
    """
    Detect similar movements that appear too close together

    This addresses the "Crab + Seal" issue: movements with identical or very similar
    muscle groups should not appear within N positions of each other.

    Args:
        sequence: List of movement dicts
        proximity_range: How many positions to check (default 3)

    Returns:
        List of warning dicts with similarity details
    """
    warnings = []

    for i in range(len(sequence)):
        current = sequence[i]
        current_name = current.get('name', 'Unknown')
        current_muscles = set(mg.get('name', '') for mg in current.get('muscle_groups', []))

        # Check movements within proximity_range
        for j in range(i + 1, min(i + proximity_range + 1, len(sequence))):
            other = sequence[j]
            other_name = other.get('name', 'Unknown')
            other_muscles = set(mg.get('name', '') for mg in other.get('muscle_groups', []))

            if not current_muscles or not other_muscles:
                continue

            # Calculate similarity score (how many muscles overlap as % of total unique muscles)
            all_muscles = current_muscles | other_muscles
            shared_muscles = current_muscles & other_muscles
            similarity_score = (len(shared_muscles) / len(all_muscles)) * 100 if all_muscles else 0

            # Flag if >70% similar (very high overlap across all muscles, not just consecutive)
            if similarity_score >= 70:
                distance = j - i
                reason_parts = []

                # Check if ALL muscles are identical (100% similarity)
                if similarity_score == 100:
                    reason_parts.append("Identical muscle groups")
                else:
                    reason_parts.append(f"Share {len(shared_muscles)}/{len(all_muscles)} muscle groups")

                # Check if same movement family (both rolling, both stretches, etc.)
                # Note: This would require movement_family field in database (future enhancement)
                current_category = current.get('category', '').lower()
                other_category = other.get('category', '').lower()
                if current_category and current_category == other_category:
                    reason_parts.append(f"Same category ({current_category})")

                warnings.append({
                    'movement_a': current_name,
                    'pos_a': i + 1,
                    'movement_b': other_name,
                    'pos_b': j + 1,
                    'distance': distance,
                    'similarity_score': similarity_score,
                    'shared_muscles': shared_muscles,
                    'warning_msg': f"⚠️ {similarity_score:.0f}% similar",
                    'reason': '; '.join(reason_parts)
                })

    return warnings


def _check_historical_movement_coverage(
    user_id: str,
    current_sequence: List[Dict[str, Any]],
    supabase_client
) -> Optional[Dict[str, Any]]:
    """
    Check historical movement coverage to identify repertoire gaps

    User requirement: "All history should be checked to ensure freshness of
    movement and comprehensive usage across movements from the day you start"

    Args:
        user_id: User ID to query
        current_sequence: Current class movements
        supabase_client: Supabase client for database queries

    Returns:
        Dict with movement coverage analysis, or None if no data
    """
    try:
        from datetime import datetime, timedelta

        # Query ALL movements in database (classical repertoire)
        all_movements_response = supabase_client.table('movements') \
            .select('id, name, difficulty_level') \
            .execute()

        all_movements = {m['id']: m['name'] for m in all_movements_response.data}

        # Query user's historical movement usage (from day 1)
        usage_response = supabase_client.table('class_movements') \
            .select('movement_id, movement_name, class_generated_at') \
            .eq('user_id', user_id) \
            .order('class_generated_at', desc=True) \
            .execute()

        if not usage_response.data:
            # First class ever - all movements are new
            current_movement_names = [m.get('name', 'Unknown') for m in current_sequence]
            return {
                'total_unique_movements': len(current_movement_names),
                'classes_analyzed': 1,
                'days_since_start': 0,
                'first_class_date': datetime.now().date().isoformat(),
                'never_practiced': current_movement_names,
                'rarely_practiced': [],
                'stale_movements': [],
                'repertoire_gaps': [name for name in all_movements.values() if name not in current_movement_names]
            }

        # Track movement usage
        movement_usage = {}  # movement_id -> {name, count, last_used_date}
        classes_by_date = set()

        for usage in usage_response.data:
            movement_id = usage['movement_id']
            movement_name = usage['movement_name']
            used_date = usage['class_generated_at'][:10]  # YYYY-MM-DD

            classes_by_date.add(used_date)

            if movement_id not in movement_usage:
                movement_usage[movement_id] = {
                    'name': movement_name,
                    'count': 0,
                    'last_used_date': used_date
                }

            movement_usage[movement_id]['count'] += 1

            # Track most recent use
            if used_date > movement_usage[movement_id]['last_used_date']:
                movement_usage[movement_id]['last_used_date'] = used_date

        # Calculate days since user started
        first_class_date = min(datetime.fromisoformat(m['class_generated_at'].replace('Z', '+00:00')).date()
                               for m in usage_response.data)
        days_since_start = (datetime.now().date() - first_class_date).days

        # Identify movements in current class
        current_movement_names = [m.get('name', 'Unknown') for m in current_sequence]
        current_movement_ids = [m.get('id') for m in current_sequence if m.get('id')]

        # Never practiced before (in current class but not in history)
        never_practiced = [
            name for name in current_movement_names
            if not any(usage['name'] == name for usage in movement_usage.values())
        ]

        # Rarely practiced (< 3 times total)
        rarely_practiced = []
        for mov_id, data in movement_usage.items():
            if data['count'] < 3:
                days_ago = (datetime.now().date() - datetime.fromisoformat(data['last_used_date']).date()).days
                rarely_practiced.append({
                    'name': data['name'],
                    'count': data['count'],
                    'days_ago': days_ago
                })

        # Sort rarely practiced by count ascending (least practiced first)
        rarely_practiced.sort(key=lambda x: x['count'])

        # Stalest movements (not in current class, sorted by days since last use)
        stale_movements = []
        for mov_id, data in movement_usage.items():
            if mov_id not in current_movement_ids:  # Not in current class
                days_ago = (datetime.now().date() - datetime.fromisoformat(data['last_used_date']).date()).days
                stale_movements.append({
                    'name': data['name'],
                    'days_ago': days_ago,
                    'count': data['count']
                })

        # Sort by days_ago descending (stalest first)
        stale_movements.sort(key=lambda x: x['days_ago'], reverse=True)

        # Repertoire gaps (classical movements never practiced)
        practiced_movement_names = set(data['name'] for data in movement_usage.values())
        repertoire_gaps = [
            name for name in all_movements.values()
            if name not in practiced_movement_names
        ]

        return {
            'total_unique_movements': len(movement_usage),
            'classes_analyzed': len(classes_by_date),
            'days_since_start': days_since_start,
            'first_class_date': first_class_date.isoformat(),
            'never_practiced': never_practiced,
            'rarely_practiced': rarely_practiced,
            'stale_movements': stale_movements,
            'repertoire_gaps': sorted(repertoire_gaps)
        }

    except Exception as e:
        logger.warning(f"Historical movement coverage check failed: {e}")
        return None


def _check_historical_muscle_balance(
    user_id: str,
    current_sequence: List[Dict[str, Any]],
    supabase_client
) -> Optional[Dict[str, Any]]:
    """
    Check historical muscle balance across ALL user history (from day 1)

    Queries movements_usage table to see which muscle groups have been
    emphasized across all classes, and identifies underutilized areas.

    User requirement: "All history should be checked to ensure freshness of
    movement and muscle usage and comprehensive usage across movement from
    the day you start"

    Args:
        user_id: User ID to query
        current_sequence: Current class movements
        supabase_client: Supabase client for database queries

    Returns:
        Dict with historical balance analysis, or None if no data
    """
    try:
        # Query movement_usage table for ALL user history (no time limit)
        # FIXED: Changed 'movements_usage' (plural) to 'movement_usage' (singular) - table name was wrong!
        from datetime import datetime, timedelta

        response = supabase_client.table('movement_usage') \
            .select('movement_id, movement_name, used_at') \
            .eq('user_id', user_id) \
            .order('used_at', desc=True) \
            .execute()

        if not response.data:
            return None

        # Extract unique movement IDs used historically
        historical_movements = response.data
        unique_movement_ids = list(set(m['movement_id'] for m in historical_movements))

        # Calculate days since user started (first class date)
        first_class_date = min(datetime.fromisoformat(m['used_at'].replace('Z', '+00:00')).date()
                               for m in historical_movements)
        days_since_start = (datetime.now().date() - first_class_date).days

        # Query muscle groups for these movements
        movements_response = supabase_client.table('movements') \
            .select('id, name') \
            .in_('id', unique_movement_ids) \
            .execute()

        movement_id_to_name = {m['id']: m['name'] for m in movements_response.data}

        # Query movement_muscles to get muscle groups for historical movements
        muscles_response = supabase_client.table('movement_muscles') \
            .select('movement_id, muscle_group_name') \
            .in_('movement_id', unique_movement_ids) \
            .execute()

        # Build historical muscle usage tracking + movement freshness
        historical_muscles = {}  # muscle_group -> {count, classes set, last_used}
        classes_by_date = {}  # date -> set of muscle groups
        movement_freshness = {}  # movement_id -> {name, last_used_date, days_ago}

        for usage in historical_movements:
            movement_id = usage['movement_id']
            movement_name = usage['movement_name']
            used_date = usage['used_at'][:10]  # Extract date (YYYY-MM-DD)
            used_datetime = datetime.fromisoformat(usage['used_at'].replace('Z', '+00:00'))

            # Track movement freshness (when was each movement last used?)
            if movement_id not in movement_freshness:
                days_ago = (datetime.now(used_datetime.tzinfo) - used_datetime).days
                movement_freshness[movement_id] = {
                    'name': movement_name,
                    'last_used_date': used_date,
                    'days_ago': days_ago
                }

            # Find muscle groups for this movement
            movement_muscle_groups = [
                m['muscle_group_name']
                for m in muscles_response.data
                if m['movement_id'] == movement_id
            ]

            # Track muscle usage
            if used_date not in classes_by_date:
                classes_by_date[used_date] = set()

            for muscle in movement_muscle_groups:
                if muscle not in historical_muscles:
                    historical_muscles[muscle] = {'count': 0, 'classes': set(), 'last_used': None}

                historical_muscles[muscle]['count'] += 1
                historical_muscles[muscle]['classes'].add(used_date)
                classes_by_date[used_date].add(muscle)

                # Track most recent use of this muscle group
                if historical_muscles[muscle]['last_used'] is None or used_date > historical_muscles[muscle]['last_used']:
                    historical_muscles[muscle]['last_used'] = used_date

        # Calculate muscle usage in current class
        current_class_muscles = {}
        for movement in current_sequence:
            for mg in movement.get('muscle_groups', []):
                muscle_name = mg.get('name', '')
                if muscle_name:
                    current_class_muscles[muscle_name] = current_class_muscles.get(muscle_name, 0) + 1

        # Convert historical_muscles['classes'] from set to count
        for muscle in historical_muscles:
            historical_muscles[muscle] = {
                'count': historical_muscles[muscle]['count'],
                'classes': len(historical_muscles[muscle]['classes']),
                'last_used': historical_muscles[muscle]['last_used']
            }

        # Identify underutilized muscle groups (<30% of classes)
        total_classes = len(classes_by_date)
        underutilized = []
        for muscle, data in historical_muscles.items():
            pct = (data['classes'] / total_classes) * 100 if total_classes > 0 else 0
            if pct < 30:
                underutilized.append((muscle, pct))

        # Identify new muscle groups in this class (not in recent history)
        new_muscles = [
            muscle for muscle in current_class_muscles.keys()
            if muscle not in historical_muscles
        ]

        # Sort movement freshness by days_ago (descending) - stalest movements first
        stale_movements = sorted(
            movement_freshness.values(),
            key=lambda x: x['days_ago'],
            reverse=True
        )

        return {
            'classes_analyzed': total_classes,
            'days_since_start': days_since_start,
            'first_class_date': first_class_date.isoformat(),
            'current_class_muscles': current_class_muscles,
            'historical_muscles': historical_muscles,
            'underutilized': sorted(underutilized, key=lambda x: x[1]),  # Sort by % ascending
            'new_muscles': sorted(new_muscles),
            'movement_freshness': stale_movements  # Stalest movements first
        }

    except Exception as e:
        logger.warning(f"Historical balance check failed: {e}")
        return None
