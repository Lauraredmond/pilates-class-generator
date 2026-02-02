"""
Quick Variety Improvements for Movement Selection

This file contains immediate improvements you can apply to sequence_tools.py
to enhance movement variety and ensure full repertoire coverage.

Implementation: Copy the relevant sections into sequence_tools.py
"""

# ==============================================================================
# IMPROVEMENT 1: Reduce The Hundred Boost
# ==============================================================================
# Location: sequence_tools.py line 517
# Current: usage_weights[hundred_id] = current_weight * 3.0
# Change to:

def improved_hundred_boost(self, usage_weights, movements, is_beginner):
    """Gentler boost for The Hundred for beginners"""
    if is_beginner:
        hundred_movement = next((m for m in movements if "hundred" in m.get("name", "").lower()), None)
        if hundred_movement:
            hundred_id = hundred_movement["id"]
            current_weight = usage_weights.get(hundred_id, 1.0)
            # IMPROVEMENT: Reduced from 3.0 to 1.5
            usage_weights[hundred_id] = current_weight * 1.5
            logger.info(f"✨ Beginner: Gentle boost for 'The Hundred' ({current_weight:.0f} → {usage_weights[hundred_id]:.0f})")


# ==============================================================================
# IMPROVEMENT 2: Add Staleness Multiplier
# ==============================================================================
# Location: sequence_tools.py _get_movement_usage_weights method, around line 1206
# Add after calculating days_since:

def add_staleness_boost(weight, days_since):
    """
    Exponentially boost weight for movements unused for extended periods

    - 7 days unused: 2x boost
    - 14 days unused: 4x boost
    - 21 days unused: 8x boost
    - 30 days unused: 16x boost
    """
    if days_since >= 7:
        staleness_multiplier = 2 ** (days_since / 7)
        boosted_weight = weight * staleness_multiplier
        logger.info(f"Staleness boost: {days_since} days → {staleness_multiplier:.1f}x multiplier")
        return boosted_weight
    return weight


# ==============================================================================
# IMPROVEMENT 3: Enforce Minimum Variety Targets
# ==============================================================================
# Add this new method to SequenceTools class:

def enforce_minimum_variety(self, movements, usage_weights, difficulty, user_id):
    """
    Ensure minimum variety by boosting weights if coverage is too low

    Target coverage over last 7 classes:
    - Beginner: At least 70% of movements (10 of 14)
    - Intermediate: At least 50% of movements (12 of 24)
    - Advanced: At least 40% of movements (14 of 35)
    """
    if not self.supabase or not user_id:
        return usage_weights

    try:
        # Get movements used in last 7 classes
        response = self.supabase.table('class_movements') \
            .select('movement_id') \
            .eq('user_id', user_id) \
            .order('class_generated_at', desc=True) \
            .limit(70) \
            .execute()  # ~10 movements per class * 7 classes

        # Count unique movements used recently
        recent_movement_ids = set(row['movement_id'] for row in response.data)

        # Calculate coverage
        total_available = len(movements)
        recent_coverage_pct = (len(recent_movement_ids) / total_available * 100) if total_available > 0 else 0

        # Define minimum targets
        min_coverage_targets = {
            'Beginner': 70,      # Use 70% of beginner movements
            'Intermediate': 50,  # Use 50% of available movements
            'Advanced': 40       # Use 40% of all movements
        }

        target = min_coverage_targets.get(difficulty, 50)

        # If coverage too low, massively boost unused movements
        if recent_coverage_pct < target:
            logger.warning(f"⚠️ Low variety detected: {recent_coverage_pct:.1f}% < {target}% target")

            # Find movements never used recently
            for movement in movements:
                if movement['id'] not in recent_movement_ids:
                    # MASSIVE boost for movements not used recently
                    usage_weights[movement['id']] = usage_weights.get(movement['id'], 1.0) * 100
                    logger.info(f"Variety boost: '{movement['name']}' weight → {usage_weights[movement['id']]:.0f}")
        else:
            logger.info(f"✅ Good variety: {recent_coverage_pct:.1f}% coverage (target: {target}%)")

        return usage_weights

    except Exception as e:
        logger.warning(f"Error enforcing variety targets: {e}")
        return usage_weights


# ==============================================================================
# IMPROVEMENT 4: Relax Family Constraints for Better Variety
# ==============================================================================
# Location: sequence_tools.py lines 732-796
# Current: Blocks movements if family exceeds 2x natural proportion
# Improvement: Only enforce after 4+ movements (not 2+)

def relaxed_family_constraints(self, current_sequence, available):
    """
    Only enforce family balance after sequence has 4+ movements
    This allows more variety in shorter sequences
    """
    # IMPROVEMENT: Changed from 2 to 4
    if current_sequence and len(current_sequence) >= 4:
        # [existing family balance code]
        pass
    else:
        # Skip family constraints for first few movements
        logger.info("Skipping family constraints (sequence < 4 movements)")
        return available


# ==============================================================================
# IMPROVEMENT 5: Add Variety Score to Logs
# ==============================================================================
# Location: sequence_tools.py _log_class_quality method
# Add this calculation before inserting into class_quality_log:

def calculate_variety_score(self, sequence, user_id):
    """
    Calculate a 0-1 variety score based on:
    - How many unique movements used recently
    - How well distributed across families
    - How well distributed across difficulty levels
    """
    variety_components = []

    # Component 1: Recent usage diversity (0-1)
    if self.supabase and user_id:
        try:
            # Get last 5 classes
            response = self.supabase.table('class_movements') \
                .select('movement_id') \
                .eq('user_id', user_id) \
                .order('class_generated_at', desc=True) \
                .limit(50) \
                .execute()

            recent_movements = set(row['movement_id'] for row in response.data)
            unique_ratio = len(recent_movements) / 35.0  # Out of 35 total movements
            variety_components.append(min(1.0, unique_ratio * 2))  # Scale up, cap at 1.0

        except Exception as e:
            logger.warning(f"Error calculating usage diversity: {e}")
            variety_components.append(0.5)  # Neutral score

    # Component 2: Family distribution (0-1)
    families = [m.get('movement_family', 'other') for m in sequence]
    unique_families = len(set(families))
    family_diversity = unique_families / 8.0  # 8 total families
    variety_components.append(min(1.0, family_diversity * 1.5))  # Scale up

    # Component 3: No consecutive repetition (0-1)
    no_repetition = 1.0
    for i in range(len(sequence) - 1):
        if sequence[i].get('name') == sequence[i+1].get('name'):
            no_repetition = 0.0  # Penalty for any repetition
            break
    variety_components.append(no_repetition)

    # Average all components
    variety_score = sum(variety_components) / len(variety_components) if variety_components else 0.0

    logger.info(f"Variety Score: {variety_score:.2f} (components: {variety_components})")
    return variety_score


# ==============================================================================
# HOW TO APPLY THESE IMPROVEMENTS
# ==============================================================================
"""
1. Open backend/orchestrator/tools/sequence_tools.py

2. Find line 517 and change:
   usage_weights[hundred_id] = current_weight * 3.0
   TO:
   usage_weights[hundred_id] = current_weight * 1.5

3. In _get_movement_usage_weights method (line ~1206), add staleness boost:
   weight = recency_boost / frequency_penalty
   # ADD THIS LINE:
   weight = add_staleness_boost(weight, days_since)

4. In _build_safe_sequence method, after getting usage_weights (line ~504), add:
   usage_weights = self.enforce_minimum_variety(movements, usage_weights, difficulty, user_id)

5. In _select_next_movement, change line 733 from:
   if current_sequence and len(current_sequence) >= 2:
   TO:
   if current_sequence and len(current_sequence) >= 4:

6. In _log_class_quality method, add before the INSERT (line ~1458):
   variety_score = self.calculate_variety_score(sequence, user_id)

   Then add to quality_log_data dict:
   'variety_score': variety_score

7. Test with a few class generations and monitor the logs for:
   - "Variety boost" messages
   - "Staleness boost" messages
   - "Good variety" or "Low variety detected" messages
   - Variety Score in quality logs

These changes will immediately improve movement variety while maintaining safety.
"""