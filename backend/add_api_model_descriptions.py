"""
Add Field() descriptions to Pydantic models in API route files
"""
import re
from pathlib import Path

# Reuse the same logic from add_model_descriptions.py
from add_model_descriptions import generate_description, FIELD_DESCRIPTIONS

def process_model_file(filepath: Path):
    """Add Field() descriptions to models in a file"""
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    lines = content.split('\n')
    modified_lines = []
    modifications = 0

    in_class = False
    class_indent = 0

    for i, line in enumerate(lines):
        # Check if we're entering a BaseModel class
        if re.match(r'^class \w+\(BaseModel\):', line):
            in_class = True
            class_indent = len(line) - len(line.lstrip())
            modified_lines.append(line)
            continue

        # Check if we've exited the class
        if in_class and line and not line.startswith(' ' * (class_indent + 1)) and line.strip():
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

                # Skip if already has description
                if 'description=' in line:
                    modified_lines.append(line)
                    continue

                # Skip special fields
                if field_name in ['Config', 'model_config']:
                    modified_lines.append(line)
                    continue

                # Generate description
                desc = generate_description(field_name, {'type': field_type})

                # Check if already has Field()
                if 'Field(' in assignment:
                    # Find the Field() call and add description
                    # Handle multi-line Field() calls by finding the matching close paren
                    if ')' in line:
                        # Single line Field()
                        field_match = re.search(r'Field\(([^)]*)\)', line)
                        if field_match:
                            field_args = field_match.group(1)
                            # Add description as last argument
                            if field_args.strip() == '...':
                                new_field = f'Field(..., description="{desc}")'
                            else:
                                new_field = f'Field({field_args}, description="{desc}")'
                            new_line = re.sub(r'Field\([^)]*\)', new_field, line)
                            modified_lines.append(new_line)
                            modifications += 1
                            continue
                    else:
                        # Multi-line Field() - skip for now
                        modified_lines.append(line)
                        continue

                # No Field() yet
                if assignment:
                    # Has default value
                    default_val = default_value.strip()
                    # Check if it's already a complex expression
                    if any(x in default_val for x in ['Query(', 'Path(', 'Depends(', 'Body(']):
                        # Already has a FastAPI dependency, skip
                        modified_lines.append(line)
                        continue
                    new_line = f'{indent}{field_name}: {field_type} = Field({default_val}, description="{desc}")'
                else:
                    # No default value
                    new_line = f'{indent}{field_name}: {field_type} = Field(..., description="{desc}")'

                modified_lines.append(new_line)
                modifications += 1
                continue

        modified_lines.append(line)

    # Write back if modified
    if modifications > 0:
        new_content = '\n'.join(modified_lines)

        # Add Field import if needed and not already present
        if 'from pydantic import' in new_content:
            pydantic_line = [line for line in new_content.split('\n') if 'from pydantic import' in line][0]
            if 'Field' not in pydantic_line:
                # Add Field to the import
                new_pydantic_line = pydantic_line.replace('import BaseModel', 'import BaseModel, Field')
                if 'import BaseModel, Field' not in new_pydantic_line:
                    # Try other patterns
                    if 'BaseModel' in pydantic_line and ')' in pydantic_line:
                        # from pydantic import (...)
                        new_pydantic_line = pydantic_line.replace(')', ', Field)')
                    elif 'BaseModel' in pydantic_line:
                        new_pydantic_line = pydantic_line.rstrip() + ', Field'
                new_content = new_content.replace(pydantic_line, new_pydantic_line, 1)

        with open(filepath, 'w') as f:
            f.write(new_content)

        return modifications

    return 0

# Process API files
api_dir = Path('api')
total_modifications = 0

print("=" * 80)
print("ADDING FIELD() DESCRIPTIONS TO API ROUTE FILES")
print("=" * 80)

api_files_to_process = [
    'movements.py',
    'analytics.py',
    'beta_errors.py',
    'admin.py',
    'feedback.py',
    'class_sections.py',
    'users.py',
    'auth.py',
    'music.py',
    'compliance.py',
    'admin_extended.py',
    'coach.py',
]

for filename in api_files_to_process:
    filepath = api_dir / filename
    if not filepath.exists():
        continue

    print(f"\n📄 Processing {filename}...")
    mods = process_model_file(filepath)

    if mods > 0:
        print(f"   ✅ Added {mods} descriptions")
        total_modifications += mods
    else:
        print(f"   ⏭️  No changes needed")

print("\n" + "=" * 80)
print(f"✅ TOTAL: Added {total_modifications} Field() descriptions to API files")
print("=" * 80)
