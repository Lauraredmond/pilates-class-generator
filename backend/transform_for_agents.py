"""
Transform OpenAPI spec for AI Agent Usability
Restructures the API to be agent-first without removing functionality
"""
import json
import yaml
from typing import Dict, List, Any
from copy import deepcopy

def load_spec(filepath: str) -> Dict:
    """Load OpenAPI spec from JSON"""
    with open(filepath, 'r') as f:
        return json.load(f)

def add_agent_workflows_section(spec: Dict) -> Dict:
    """Add x-agent-workflows to info section"""
    spec['info']['x-agent-workflows'] = {
        'generate_pilates_class': {
            'description': 'Generate a complete Pilates class with movements, music, and meditation',
            'steps': [
                {'operationId': 'generateCompleteClass', 'required': True},
            ],
            'example_flow': 'User asks: "Create a 60-minute beginner Pilates class" → Call generateCompleteClass'
        },
        'get_user_analytics': {
            'description': 'Analyze user practice patterns and progress',
            'steps': [
                {'operationId': 'getSummary', 'required': True},
                {'operationId': 'getPracticeFrequency', 'required': False},
                {'operationId': 'getDifficultyProgression', 'required': False},
            ],
            'example_flow': 'User asks: "How am I progressing?" → Call getSummary, then getDifficultyProgression'
        },
        'select_music_for_class': {
            'description': 'Choose music tracks that match class energy and duration',
            'steps': [
                {'operationId': 'getStylisticPeriods', 'required': False},
                {'operationId': 'selectMusic', 'required': True},
            ],
            'example_flow': 'User asks: "Find music for my class" → Call selectMusic with duration and energy curve'
        },
        'manage_saved_classes': {
            'description': 'View, save, update, or delete user class plans',
            'steps': [
                {'operationId': 'getUserClasses', 'required': True},
                {'operationId': 'getClass', 'required': False},
                {'operationId': 'updateClass', 'required': False},
            ],
            'example_flow': 'User asks: "Show my saved classes" → Call getUserClasses'
        }
    }
    return spec

def create_agent_entry_points() -> Dict:
    """Create new high-level agent endpoints that orchestrate complexity"""
    return {
        '/api/agent/workflows/generate-class': {
            'post': {
                'tags': ['🤖 Agent Workflows'],
                'summary': 'Generate Complete Pilates Class (Agent Entry Point)',
                'description': '''
**USE THIS WHEN:** User asks to create/generate a Pilates class, workout, or session.

**WHAT IT DOES:**
- Generates movement sequence based on difficulty, duration, focus areas
- Selects matching music playlist
- Creates meditation/cool-down script
- Returns everything needed for a complete class

**ORCHESTRATES:**
- Movement sequence generation
- Music selection
- Meditation script creation
- Validation and safety checks

**INPUTS REQUIRED:**
- duration_minutes (10-120)
- difficulty_level (Beginner/Intermediate/Advanced)

**OPTIONAL:**
- focus_areas (e.g., ["core", "legs"])
- include_music (default: true)
- include_meditation (default: true)
''',
                'operationId': 'agentGenerateClass',
                'x-agent-hints': {
                    'purpose': 'Generate a complete Pilates class with all components',
                    'when_to_use': 'User wants a full workout/class. This is THE main entry point for class generation.',
                    'when_not_to_use': 'User only wants a single movement, or just music, or just analytics',
                    'complexity': 'HIGH - This orchestrates multiple sub-systems',
                    'related_endpoints': ['generateCompleteClass', 'generateSequence', 'selectMusic'],
                    'typical_flow': '1. User asks for class → 2. Call this endpoint → 3. Return class plan with ID → 4. User can save/play it'
                },
                'requestBody': {
                    'required': True,
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'required': ['duration_minutes', 'difficulty_level'],
                                'properties': {
                                    'duration_minutes': {
                                        'type': 'integer',
                                        'minimum': 10,
                                        'maximum': 120,
                                        'description': 'Class duration in minutes',
                                        'example': 60
                                    },
                                    'difficulty_level': {
                                        'type': 'string',
                                        'enum': ['Beginner', 'Intermediate', 'Advanced'],
                                        'description': 'Class difficulty level',
                                        'example': 'Beginner'
                                    },
                                    'focus_areas': {
                                        'type': 'array',
                                        'items': {'type': 'string'},
                                        'description': 'Muscle groups to emphasize (optional)',
                                        'example': ['core', 'legs']
                                    },
                                    'include_music': {
                                        'type': 'boolean',
                                        'default': True,
                                        'description': 'Include music playlist'
                                    },
                                    'include_meditation': {
                                        'type': 'boolean',
                                        'default': True,
                                        'description': 'Include closing meditation'
                                    }
                                }
                            },
                            'example': {
                                'duration_minutes': 60,
                                'difficulty_level': 'Beginner',
                                'focus_areas': ['core', 'back'],
                                'include_music': True,
                                'include_meditation': True
                            }
                        }
                    }
                },
                'responses': {
                    '200': {
                        'description': 'Class generated successfully',
                        'content': {
                            'application/json': {
                                'schema': {
                                    'type': 'object',
                                    'properties': {
                                        'class_id': {'type': 'string', 'description': 'Unique class identifier'},
                                        'movements': {
                                            'type': 'array',
                                            'items': {
                                                'type': 'object',
                                                'properties': {
                                                    'name': {'type': 'string'},
                                                    'duration_seconds': {'type': 'integer'},
                                                    'difficulty_level': {'type': 'string'}
                                                }
                                            }
                                        },
                                        'total_duration_minutes': {'type': 'integer'},
                                        'music_playlist': {
                                            'type': 'object',
                                            'properties': {
                                                'tracks': {'type': 'array', 'items': {'type': 'object'}},
                                                'total_duration_seconds': {'type': 'integer'}
                                            }
                                        },
                                        'meditation_script': {'type': 'string'}
                                    }
                                },
                                'example': {
                                    'class_id': '550e8400-e29b-41d4-a716-446655440000',
                                    'movements': [
                                        {'name': 'The Hundred', 'duration_seconds': 60, 'difficulty_level': 'Beginner'},
                                        {'name': 'Roll Up', 'duration_seconds': 45, 'difficulty_level': 'Beginner'}
                                    ],
                                    'total_duration_minutes': 60,
                                    'music_playlist': {
                                        'tracks': [{'title': 'Calm Piano', 'duration_seconds': 300}],
                                        'total_duration_seconds': 3600
                                    },
                                    'meditation_script': 'Close your eyes and breathe...'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/agent/workflows/user-analytics': {
            'get': {
                'tags': ['🤖 Agent Workflows'],
                'summary': 'Get User Analytics Summary (Agent Entry Point)',
                'description': '''
**USE THIS WHEN:** User asks about their progress, statistics, or practice history.

**WHAT IT DOES:**
- Returns comprehensive user analytics in a single call
- Includes practice frequency, difficulty progression, muscle balance
- Flattened response optimized for agent parsing

**ORCHESTRATES:**
- Multiple analytics endpoints
- Simplified response structure

**NO INPUT REQUIRED** - uses authenticated user from token
''',
                'operationId': 'agentGetUserAnalytics',
                'x-agent-hints': {
                    'purpose': 'Get comprehensive user practice analytics',
                    'when_to_use': 'User asks: "How am I doing?", "Show my progress", "What are my stats?"',
                    'when_not_to_use': 'User wants specific data like only movement history',
                    'complexity': 'MEDIUM - Aggregates multiple analytics sources',
                    'related_endpoints': ['getSummary', 'getPracticeFrequency', 'getDifficultyProgression'],
                    'auth_required': True
                },
                'responses': {
                    '200': {
                        'description': 'User analytics retrieved',
                        'content': {
                            'application/json': {
                                'schema': {
                                    'type': 'object',
                                    'properties': {
                                        'total_classes': {'type': 'integer'},
                                        'total_practice_time_minutes': {'type': 'integer'},
                                        'current_level': {'type': 'string'},
                                        'practice_streak_days': {'type': 'integer'},
                                        'favorite_movements': {'type': 'array', 'items': {'type': 'string'}},
                                        'muscle_balance': {
                                            'type': 'object',
                                            'additionalProperties': {'type': 'number'}
                                        }
                                    }
                                },
                                'example': {
                                    'total_classes': 45,
                                    'total_practice_time_minutes': 2700,
                                    'current_level': 'Intermediate',
                                    'practice_streak_days': 12,
                                    'favorite_movements': ['The Hundred', 'Roll Up', 'Teaser'],
                                    'muscle_balance': {'core': 0.35, 'legs': 0.25, 'back': 0.20}
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/agent/workflows/search-movements': {
            'get': {
                'tags': ['🤖 Agent Workflows'],
                'summary': 'Search Pilates Movements (Agent Entry Point)',
                'description': '''
**USE THIS WHEN:** User asks to find specific exercises/movements.

**WHAT IT DOES:**
- Search movements by difficulty, muscle group, duration
- Returns simplified movement list
- Easy for agents to parse and present

**INPUTS:** All optional filters
- difficulty: Beginner, Intermediate, Advanced
- muscle_group: core, legs, back, arms, etc.
- duration_max: maximum seconds

**RESPONSE:** Simple array of movements with key fields only
''',
                'operationId': 'agentSearchMovements',
                'x-agent-hints': {
                    'purpose': 'Find Pilates exercises matching user criteria',
                    'when_to_use': 'User asks: "Show me beginner core exercises", "Find leg movements"',
                    'when_not_to_use': 'User wants to generate a full class (use generate-class instead)',
                    'complexity': 'LOW - Simple filtered search',
                    'related_endpoints': ['searchMovements', 'getMovements']
                },
                'parameters': [
                    {
                        'name': 'difficulty',
                        'in': 'query',
                        'schema': {'type': 'string', 'enum': ['Beginner', 'Intermediate', 'Advanced']},
                        'description': 'Filter by difficulty level'
                    },
                    {
                        'name': 'muscle_group',
                        'in': 'query',
                        'schema': {'type': 'string'},
                        'description': 'Filter by muscle group (e.g., core, legs)'
                    }
                ],
                'responses': {
                    '200': {
                        'description': 'Movements found',
                        'content': {
                            'application/json': {
                                'schema': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'name': {'type': 'string'},
                                            'difficulty_level': {'type': 'string'},
                                            'primary_muscles': {'type': 'array', 'items': {'type': 'string'}},
                                            'duration_seconds': {'type': 'integer'}
                                        }
                                    }
                                },
                                'example': [
                                    {
                                        'name': 'The Hundred',
                                        'difficulty_level': 'Beginner',
                                        'primary_muscles': ['Core'],
                                        'duration_seconds': 60
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    }

def add_agent_hints(spec: Dict) -> Dict:
    """Add x-agent-hints to ALL existing endpoints"""

    # Define hints for each operation category
    hints_by_path = {
        '/api/classes/generate': {
            'purpose': 'Generate a complete Pilates class with movements and optional music/meditation',
            'when_to_use': 'User explicitly asks to generate or create a Pilates class',
            'when_not_to_use': 'Use /api/agent/workflows/generate-class instead - it has better agent UX',
            'related_endpoints': ['agentGenerateClass', 'generateSequence', 'selectMusic'],
            'complexity': 'HIGH'
        },
        '/api/movements/search': {
            'purpose': 'Search movements with filters',
            'when_to_use': 'User wants to find specific exercises',
            'when_not_to_use': 'Use /api/agent/workflows/search-movements for simpler response',
            'complexity': 'LOW'
        },
        '/api/analytics/summary/{user_id}': {
            'purpose': 'Get user practice statistics summary',
            'when_to_use': 'Need high-level user stats',
            'when_not_to_use': 'Use /api/agent/workflows/user-analytics for aggregated view',
            'complexity': 'MEDIUM',
            'x-internal': True
        },
        '/api/music/playlists': {
            'purpose': 'Get available music playlists',
            'when_to_use': 'User asks what music is available',
            'when_not_to_use': 'If generating class with music, use generate-class endpoint',
            'complexity': 'LOW'
        },
        '/api/debug/environment': {
            'purpose': 'Debug endpoint for development',
            'when_to_use': 'NEVER use this as an agent - for developers only',
            'when_not_to_use': 'Always',
            'x-internal': True
        },
        '/api/admin/users': {
            'purpose': 'Admin-only user management',
            'when_to_use': 'NEVER - admin endpoints require special permissions',
            'when_not_to_use': 'Always unless user is confirmed admin',
            'x-internal': True
        }
    }

    # Add hints to paths
    for path, path_item in spec['paths'].items():
        for method, operation in path_item.items():
            if method in ['get', 'post', 'put', 'patch', 'delete']:
                # Apply specific hints if available
                if path in hints_by_path:
                    operation['x-agent-hints'] = hints_by_path[path]
                else:
                    # Generate generic hints based on path
                    operation['x-agent-hints'] = generate_generic_hints(path, method, operation)

                # Mark internal endpoints
                if '/admin/' in path or '/debug/' in path or '/compliance/' in path:
                    operation['x-internal'] = True

    return spec

def generate_generic_hints(path: str, method: str, operation: Dict) -> Dict:
    """Generate generic agent hints for endpoints without custom hints"""
    hints = {
        'purpose': operation.get('summary', f'{method.upper()} {path}'),
        'complexity': 'MEDIUM'
    }

    # Add basic when_to_use based on method
    if method == 'get':
        hints['when_to_use'] = 'When you need to retrieve this data'
    elif method == 'post':
        hints['when_to_use'] = 'When you need to create new data'
    elif method == 'put' or method == 'patch':
        hints['when_to_use'] = 'When you need to update existing data'
    elif method == 'delete':
        hints['when_to_use'] = 'When you need to delete data'

    return hints

def retag_by_workflow(spec: Dict) -> Dict:
    """Re-tag endpoints by workflow instead of system component"""

    tag_mapping = {
        # Workflow-based tags
        'movements': '💪 Movement Catalog',
        'agents': '🎯 Class Generation',
        'classes': '📋 Class Management',
        'analytics': '📊 User Analytics',
        'music': '🎵 Music Selection',
        'auth': '🔐 Authentication',
        'users': '👤 User Profile',
        'class-sections': '🧘 Class Sections',
        'feedback': '💬 Feedback',
        'admin': '⚙️ Admin (Internal)',
        'debug': '🔧 Debug (Internal)',
        'compliance': '📜 Compliance',
        'coach': '🏃 Coach Tools',
        'beta-errors': '🐛 Error Tracking'
    }

    # Update paths tags
    for path, path_item in spec['paths'].items():
        for method, operation in path_item.items():
            if method in ['get', 'post', 'put', 'patch', 'delete']:
                old_tags = operation.get('tags', [])
                new_tags = []
                for tag in old_tags:
                    new_tags.append(tag_mapping.get(tag, tag))
                operation['tags'] = new_tags if new_tags else ['📦 General']

    return spec

def flatten_validation_error_schema(spec: Dict) -> Dict:
    """Flatten the deep ValidationError schema to reduce nesting"""

    # Replace HTTPValidationError with simpler version
    if 'components' in spec and 'schemas' in spec['components']:
        # Simplified validation error (depth 3 instead of 6)
        spec['components']['schemas']['HTTPValidationError'] = {
            'type': 'object',
            'properties': {
                'errors': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'field': {'type': 'string', 'description': 'Field that failed validation'},
                            'message': {'type': 'string', 'description': 'Error message'},
                            'value': {'type': 'string', 'description': 'Invalid value provided'}
                        }
                    },
                    'description': 'List of validation errors'
                }
            },
            'title': 'Validation Error Response',
            'description': 'Simplified validation error format for agent parsing'
        }

    return spec

def add_servers(spec: Dict) -> Dict:
    """Add servers block"""
    spec['servers'] = [
        {
            'url': 'https://pilates-dev-i0jb.onrender.com',
            'description': 'Development server'
        },
        {
            'url': 'https://pilates-production.onrender.com',
            'description': 'Production server'
        },
        {
            'url': 'http://localhost:8000',
            'description': 'Local development'
        }
    ]
    return spec

def enhance_operation_descriptions(spec: Dict) -> Dict:
    """Improve operation summaries and descriptions for agent understanding"""

    improvements = {
        '/api/classes/generate': {
            'summary': 'Generate a complete Pilates class',
            'description': 'Creates a full class plan with movements, optional music, and meditation. Returns a class ID that can be saved or modified.'
        },
        '/api/movements/search': {
            'summary': 'Search for Pilates movements',
            'description': 'Find exercises filtered by difficulty, muscle group, or duration. Returns detailed movement information including cues and modifications.'
        },
        '/health': {
            'summary': 'Check API health status',
            'description': 'Verify the API is running. Returns 200 OK if healthy.'
        }
    }

    for path, path_item in spec['paths'].items():
        for method, operation in path_item.items():
            if method in ['get', 'post', 'put', 'patch', 'delete']:
                if path in improvements:
                    operation['summary'] = improvements[path]['summary']
                    operation['description'] = improvements[path]['description']

    return spec

def transform_spec(input_file: str, output_file: str):
    """Main transformation pipeline"""
    print("🔄 Loading OpenAPI spec...")
    spec = load_spec(input_file)

    print("📝 Adding agent workflows section...")
    spec = add_agent_workflows_section(spec)

    print("🤖 Creating agent entry point endpoints...")
    agent_endpoints = create_agent_entry_points()
    spec['paths'].update(agent_endpoints)

    print("💡 Adding x-agent-hints to all endpoints...")
    spec = add_agent_hints(spec)

    print("🏷️  Re-tagging by workflow...")
    spec = retag_by_workflow(spec)

    print("📏 Flattening deep schemas...")
    spec = flatten_validation_error_schema(spec)

    print("🌐 Adding servers block...")
    spec = add_servers(spec)

    print("✍️  Enhancing operation descriptions...")
    spec = enhance_operation_descriptions(spec)

    print(f"💾 Saving enhanced spec to {output_file}...")
    with open(output_file, 'w') as f:
        yaml.dump(spec, f, sort_keys=False, allow_unicode=True, width=120)

    # Also save JSON version
    json_output = output_file.replace('.yaml', '.json')
    with open(json_output, 'w') as f:
        json.dump(spec, f, indent=2)

    print("✅ Transformation complete!")
    print(f"   YAML: {output_file}")
    print(f"   JSON: {json_output}")
    print("\n📊 Summary:")
    print(f"   - Total paths: {len(spec['paths'])}")
    print(f"   - Agent entry points added: {len([p for p in spec['paths'] if '/agent/workflows/' in p])}")
    print(f"   - Endpoints with x-agent-hints: {sum(1 for p in spec['paths'].values() for m in p.values() if isinstance(m, dict) and 'x-agent-hints' in m)}")

if __name__ == '__main__':
    transform_spec(
        'local_openapi.json',
        'agent_enhanced_openapi.yaml'
    )
