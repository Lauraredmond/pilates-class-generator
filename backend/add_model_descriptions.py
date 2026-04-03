"""
Automatically add Field() descriptions to Pydantic models
Intelligently generates descriptions based on property names
"""
import re
from pathlib import Path

# Common field descriptions based on naming patterns
FIELD_DESCRIPTIONS = {
    # IDs
    'id': 'Unique identifier',
    'user_id': 'User identifier',
    'movement_id': 'Movement identifier',
    'class_id': 'Class identifier',
    'class_plan_id': 'Class plan identifier',
    'session_id': 'Session identifier',
    'playlist_id': 'Playlist identifier',
    'track_id': 'Track identifier',
    'error_id': 'Error identifier',
    'feedback_id': 'Feedback identifier',
    'agent_id': 'Agent identifier',

    # Common fields
    'name': 'Name',
    'title': 'Title',
    'description': 'Description',
    'email': 'Email address',
    'message': 'Message content',
    'status': 'Status',
    'type': 'Type',
    'created_at': 'Creation timestamp',
    'updated_at': 'Last update timestamp',
    'deleted_at': 'Deletion timestamp',

    # Boolean fields
    'success': 'Whether the operation was successful',
    'is_active': 'Whether the item is active',
    'is_public': 'Whether the item is public',
    'enabled': 'Whether the feature is enabled',
    'required': 'Whether the field is required',

    # Counts and metrics
    'count': 'Count',
    'total': 'Total count',
    'duration': 'Duration',
    'duration_minutes': 'Duration in minutes',
    'duration_seconds': 'Duration in seconds',

    # Data fields
    'data': 'Data payload',
    'metadata': 'Metadata',
    'config': 'Configuration',
    'settings': 'Settings',
    'options': 'Options',
    'params': 'Parameters',
    'parameters': 'Parameters',

    # Difficulty and levels
    'difficulty_level': 'Difficulty level (Beginner, Intermediate, or Advanced)',
    'level': 'Level',
    'level_number': 'Level number',

    # Music fields
    'genre': 'Music genre',
    'bpm': 'Beats per minute',
    'tempo': 'Tempo',
    'energy': 'Energy level',

    # Class fields
    'target_duration_minutes': 'Target class duration in minutes',
    'focus_areas': 'Muscle groups or body areas to focus on',
    'strictness_level': 'AI strictness level (strict, guided, or autonomous)',
    'movements': 'List of movements in the sequence',
    'sequence': 'Movement sequence',

    # Error fields
    'error': 'Error message',
    'error_message': 'Error message',
    'error_type': 'Type of error',
    'severity': 'Error severity',
    'detail': 'Detailed information',

    # User fields
    'user_type': 'Type of user account',
    'role': 'User role',
    'permissions': 'User permissions',

    # Timestamps
    'timestamp': 'Timestamp',
    'date': 'Date',
    'time': 'Time',
}

def generate_description(field_name: str, field_info: dict) -> str:
    """Generate description for a field based on name and type"""

    # Check exact match first
    if field_name in FIELD_DESCRIPTIONS:
        return FIELD_DESCRIPTIONS[field_name]

    # Check for common patterns
    if field_name.endswith('_id'):
        entity = field_name[:-3].replace('_', ' ').title()
        return f'{entity} identifier'

    if field_name.endswith('_ids'):
        entity = field_name[:-4].replace('_', ' ').title()
        return f'List of {entity} identifiers'

    if field_name.endswith('_count'):
        entity = field_name[:-6].replace('_', ' ')
        return f'Number of {entity}'

    if field_name.endswith('_url'):
        entity = field_name[:-4].replace('_', ' ')
        return f'URL for {entity}'

    if field_name.startswith('is_'):
        entity = field_name[3:].replace('_', ' ')
        return f'Whether {entity}'

    if field_name.startswith('has_'):
        entity = field_name[4:].replace('_', ' ')
        return f'Whether has {entity}'

    if field_name.endswith('_at'):
        entity = field_name[:-3].replace('_', ' ').title()
        return f'{entity} timestamp'

    # Default: capitalize and convert underscores to spaces
    return field_name.replace('_', ' ').title()

def process_model_file(filepath: Path):
    """Add Field() descriptions to a single model file"""
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    lines = content.split('\n')
    modified_lines = []
    modifications = 0

    # Track if we're inside a class
    in_class = False
    class_indent = 0

    for i, line in enumerate(lines):
        # Check if we're entering a class
        if re.match(r'^class \w+\(BaseModel\):', line):
            in_class = True
            class_indent = len(line) - len(line.lstrip())
            modified_lines.append(line)
            continue

        # Check if we've exited the class
        if in_class and line and not line.startswith(' ' * (class_indent + 1)):
            in_class = False

        # If we're in a class, check for field definitions
        if in_class:
            # Pattern: field_name: Type = ... OR field_name: Type
            match = re.match(r'^(\s+)(\w+):\s*([^=]+?)(\s*=\s*(.+))?$', line)

            if match:
                indent = match.group(1)
                field_name = match.group(2)
                field_type = match.group(3).strip()
                assignment = match.group(4) or ''
                default_value = match.group(5) or ''

                # Skip if already has Field() with description
                if 'Field(' in assignment and 'description=' in assignment:
                    modified_lines.append(line)
                    continue

                # Skip special fields
                if field_name in ['Config', 'model_config']:
                    modified_lines.append(line)
                    continue

                # Generate description
                desc = generate_description(field_name, {'type': field_type})

                # Add Field() with description
                if assignment and 'Field(' in assignment:
                    # Already has Field(), add description to it
                    # Replace Field(...) with Field(..., description="...")
                    new_assignment = assignment.replace('Field(', f'Field(', 1)
                    # Find the closing parenthesis of Field()
                    field_end = new_assignment.find(')')
                    if field_end != -1:
                        # Insert description before closing paren
                        new_assignment = new_assignment[:field_end] + f', description="{desc}")' + new_assignment[field_end+1:]
                        new_line = f'{indent}{field_name}: {field_type} {new_assignment}'
                        modified_lines.append(new_line)
                        modifications += 1
                        continue

                # No Field() yet, add it
                if assignment:
                    # Has default value, wrap in Field()
                    default_val = default_value.strip()
                    new_line = f'{indent}{field_name}: {field_type} = Field({default_val}, description="{desc}")'
                else:
                    # No default, add Field(..., description="...")
                    new_line = f'{indent}{field_name}: {field_type} = Field(..., description="{desc}")'

                modified_lines.append(new_line)
                modifications += 1
                continue

        modified_lines.append(line)

    # Write back if modified
    if modifications > 0:
        new_content = '\n'.join(modified_lines)

        # Make sure Field is imported
        if 'from pydantic import' in new_content and 'Field' not in new_content.split('from pydantic import')[1].split('\n')[0]:
            # Add Field to imports
            new_content = new_content.replace(
                'from pydantic import BaseModel',
                'from pydantic import BaseModel, Field'
            )

        with open(filepath, 'w') as f:
            f.write(new_content)

        return modifications

    return 0

# Process all model files
models_dir = Path('models')
total_modifications = 0

print("=" * 80)
print("ADDING FIELD() DESCRIPTIONS TO PYDANTIC MODELS")
print("=" * 80)

for model_file in models_dir.glob('*.py'):
    if model_file.name == '__init__.py':
        continue

    print(f"\n📄 Processing {model_file.name}...")
    mods = process_model_file(model_file)

    if mods > 0:
        print(f"   ✅ Added {mods} descriptions")
        total_modifications += mods
    else:
        print(f"   ⏭️  No changes needed")

print("\n" + "=" * 80)
print(f"✅ TOTAL: Added {total_modifications} Field() descriptions")
print("=" * 80)
print("\nNext steps:")
print("1. Start local server: uvicorn api.main:app --reload --port 8000")
print("2. Generate spec: curl http://localhost:8000/openapi.json > local_openapi.json")
print("3. Analyze: python3 analyze_local_spec.py")
print("=" * 80)
