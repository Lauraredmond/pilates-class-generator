"""
Batch add Path() descriptions to all router files with path parameters
"""
import re
from pathlib import Path

# Parameter descriptions mapping
PARAM_DESCRIPTIONS = {
    'movement_id': 'Unique identifier (UUID) for the Pilates movement',
    'class_id': 'Unique identifier (UUID) for the class plan',
    'user_id': 'Unique identifier (UUID) for the user',
    'session_id': 'Unique identifier (UUID) for the session',
    'level': 'Difficulty level: Beginner, Intermediate, or Advanced',
    'level_number': 'Progression level number (1-5, where 1=beginner, 5=full movement)',
    'playlist_id': 'Unique identifier (UUID) for the music playlist',
    'track_id': 'Unique identifier (UUID) for the music track',
    'sport': 'Sport type identifier (e.g., rugby, soccer, basketball)',
    'exercise_id': 'Unique identifier (UUID) for the sport-specific exercise',
    'script_id': 'Unique identifier (UUID) for the preparation/meditation script',
    'routine_id': 'Unique identifier (UUID) for the warmup routine',
    'sequence_id': 'Unique identifier (UUID) for the cooldown sequence',
    'advice_id': 'Unique identifier (UUID) for the homecare advice',
    'error_id': 'Unique identifier (UUID) for the beta error record',
    'feedback_id': 'Unique identifier (UUID) for the feedback submission',
    'class_plan_id': 'Unique identifier (UUID) for the class plan',
    'log_id': 'Unique identifier (UUID) for the log entry',
}

def add_path_to_imports(content):
    """Add Path to FastAPI imports if not already present"""
    if 'from fastapi import' not in content or 'Path' in content.split('from fastapi import')[1].split('\n')[0]:
        return content

    # Find first FastAPI import
    pattern = r'(from fastapi import )([^\n]+)'
    match = re.search(pattern, content)
    if match:
        imports = match.group(2)
        if 'Path' not in imports:
            new_imports = imports.rstrip() + ', Path'
            content = content.replace(match.group(0), f'{match.group(1)}{new_imports}')

    return content

def add_path_description(content, param_name):
    """Add Path() wrapper to a parameter if it doesn't have one"""
    if param_name not in PARAM_DESCRIPTIONS:
        return content

    description = PARAM_DESCRIPTIONS[param_name]

    # Pattern: param_name: type (without Path())
    # Look for parameter definitions like "movement_id: str" or "user_id: UUID"
    pattern = rf'(\s+){param_name}:\s*(\w+)(\s*[,)])'

    def replace_param(match):
        indent = match.group(1)
        param_type = match.group(2)
        trailing = match.group(3)
        return f'{indent}{param_name}: {param_type} = Path(..., description="{description}"){trailing}'

    content = re.sub(pattern, replace_param, content)

    return content

# Process each router file
api_dir = Path('api')
files_to_process = [
    # Already processed (re-running is safe, will skip):
    'movement_levels.py',
    'movements.py',
    'analytics.py',
    'class_sections.py',
    'beta_errors.py',
    'admin.py',
    'admin_extended.py',
    'coach.py',
    'music.py',
    # New files to process:
    'classes.py',
    'auth.py',
    'users.py',
    'compliance.py',
    'feedback.py',
    'analytics_music_duration.py',
    'agents.py',
]

total_params_added = 0

for filename in files_to_process:
    filepath = api_dir / filename
    if not filepath.exists():
        print(f"⏭️  Skipping {filename} (not found)")
        continue

    with open(filepath, 'r') as f:
        original_content = f.read()

    content = original_content

    # Add Path import
    content = add_path_to_imports(content)

    # Add Path() descriptions for all known parameters
    params_added_this_file = 0
    for param_name in PARAM_DESCRIPTIONS.keys():
        if f'{param_name}:' in content:
            before = content
            content = add_path_description(content, param_name)
            if content != before:
                params_added_this_file += 1

    # Write back if changed
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ {filename}: Added Path() to {params_added_this_file} parameters")
        total_params_added += params_added_this_file
    else:
        print(f"⏭️  {filename}: No changes needed")

print(f"\n{'='*80}")
print(f"✅ Total: Added Path() descriptions to {total_params_added} parameters")
print(f"{'='*80}")
