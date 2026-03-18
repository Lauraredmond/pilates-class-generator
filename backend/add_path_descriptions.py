"""
Automatically add Path() descriptions to path parameters in router files
This fixes the Description Coverage issue (30% -> 80%+)
"""

import re
import os
from pathlib import Path

# Common path parameter descriptions based on naming patterns
PARAM_DESCRIPTIONS = {
    'movement_id': 'Unique identifier (UUID) for the Pilates movement',
    'class_id': 'Unique identifier (UUID) for the class plan',
    'user_id': 'Unique identifier (UUID) for the user',
    'session_id': 'Unique identifier (UUID) for the session',
    'level': 'Difficulty level (Beginner, Intermediate, or Advanced)',
    'level_number': 'Progression level number (1-5)',
    'playlist_id': 'Unique identifier for the music playlist',
    'track_id': 'Unique identifier for the music track',
    'sport': 'Sport type identifier',
    'exercise_id': 'Unique identifier for the exercise',
    'script_id': 'Unique identifier for the script',
    'routine_id': 'Unique identifier for the routine',
    'sequence_id': 'Unique identifier for the sequence',
    'advice_id': 'Unique identifier for the advice',
    'error_id': 'Unique identifier for the error record',
    'feedback_id': 'Unique identifier for the feedback submission',
    'class_plan_id': 'Unique identifier for the class plan',
    'log_id': 'Unique identifier for the log entry',
}

def needs_path_import(content):
    """Check if file needs Path import"""
    return 'Path' not in content and '{' in content and 'async def' in content

def add_path_import(content):
    """Add Path to FastAPI imports"""
    # Find the FastAPI import line
    fastapi_import_pattern = r'from fastapi import ([^)]+)'
    match = re.search(fastapi_import_pattern, content)

    if match:
        imports = match.group(1)
        if 'Path' not in imports:
            # Add Path to imports
            new_imports = imports.rstrip() + ', Path'
            content = content.replace(match.group(0), f'from fastapi import {new_imports}')

    return content

def add_path_descriptions_to_function(func_match, content):
    """Add Path() descriptions to function parameters"""
    func_def = func_match.group(0)

    # Find path parameters (ones that appear in route decorator)
    # Look backwards for the @router decorator
    func_start = func_match.start()
    before_func = content[:func_start]

    # Find the last @router line before this function
    router_pattern = r'@router\.(get|post|put|patch|delete)\([^)]+["\']([^"\']+)["\']'
    router_matches = list(re.finditer(router_pattern, before_func))

    if not router_matches:
        return func_def

    last_router = router_matches[-1]
    route_path = last_router.group(2)

    # Extract path parameters from route
    path_params = re.findall(r'\{([^}]+)\}', route_path)

    if not path_params:
        return func_def

    # For each path parameter, add Path() if missing description
    new_func_def = func_def

    for param_name in path_params:
        # Check if parameter already has Path()
        param_pattern = rf'{param_name}:\s*\w+\s*=\s*Path\('
        if re.search(param_pattern, new_func_def):
            continue  # Already has Path()

        # Check if parameter exists without Path()
        simple_param_pattern = rf'(\s+){param_name}:\s*(\w+)(,|\s*\))'
        match = re.search(simple_param_pattern, new_func_def)

        if match:
            indent = match.group(1)
            param_type = match.group(2)
            trailing = match.group(3)

            # Get description for this parameter
            description = PARAM_DESCRIPTIONS.get(param_name, f'Identifier for {param_name.replace("_", " ")}')

            # Replace with Path() version
            replacement = f'{indent}{param_name}: {param_type} = Path(..., description="{description}"){trailing}'
            new_func_def = new_func_def.replace(match.group(0), replacement)

    return new_func_def

def process_file(file_path):
    """Process a single router file"""
    with open(file_path, 'r') as f:
        content = f.read()

    # Skip if no path parameters
    if '{' not in content:
        return False

    original_content = content

    # Add Path import if needed
    if needs_path_import(content):
        content = add_path_import(content)

    # Find all async function definitions
    func_pattern = r'async def [^(]+\([^)]+\):'

    # Replace each function
    for match in re.finditer(func_pattern, content):
        new_func = add_path_descriptions_to_function(match, content)
        content = content.replace(match.group(0), new_func)

    # Write back if changed
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True

    return False

# Process all router files
api_dir = Path('api')
files_modified = []

for file_path in api_dir.glob('*.py'):
    if file_path.name == '__init__.py' or file_path.name == 'main.py':
        continue

    print(f"Processing {file_path.name}...")

    if process_file(file_path):
        files_modified.append(file_path.name)
        print(f"  ✅ Modified")
    else:
        print(f"  ⏭️  Skipped (no changes needed)")

print()
print("=" * 80)
print(f"✅ Modified {len(files_modified)} files")
print("=" * 80)
for fname in files_modified:
    print(f"  - {fname}")
