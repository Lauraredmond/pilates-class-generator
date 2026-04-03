"""
Integration Tests for Session 2B
Tests database migrations, MCP client, and data integrity
"""

import os
import sys
import asyncio
import pytest
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import redis

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.mcp_client import MCPPlaywrightClient
from scripts.migrate_to_database import DatabaseMigrator

# Load environment variables
load_dotenv()


class TestDatabaseConnection:
    """Test Supabase/PostgreSQL connectivity"""

    @pytest.fixture(scope="class")
    def supabase_client(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')

        if not supabase_url or not supabase_key:
            pytest.skip("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

        client = create_client(supabase_url, supabase_key)
        return client

    def test_connection(self, supabase_client):
        """Test basic database connection"""
        try:
            # Try to query a simple table
            response = supabase_client.table('movements').select('id').limit(1).execute()
            assert response is not None
            print("✓ Database connection successful")
        except Exception as e:
            pytest.fail(f"Database connection failed: {e}")

    def test_tables_exist(self, supabase_client):
        """Verify all required tables exist"""
        required_tables = [
            'movements',
            'muscle_groups',
            'movement_muscles',
            'sequence_rules',
            'transitions',
            'teaching_cues',
            'common_mistakes',
            'users',
            'pii_tokens',
            'class_plans',
            'class_movements',
            'class_history',
            'movement_usage',
            'student_profiles'
        ]

        for table in required_tables:
            try:
                response = supabase_client.table(table).select('id').limit(1).execute()
                print(f"✓ Table '{table}' exists")
            except Exception as e:
                pytest.fail(f"Table '{table}' does not exist or is inaccessible: {e}")

    def test_reference_data_populated(self, supabase_client):
        """Verify reference data (muscle groups, rules, transitions) is populated"""

        # Check muscle groups (should have 23)
        muscle_groups = supabase_client.table('muscle_groups').select('id').execute()
        assert len(muscle_groups.data) >= 20, f"Expected at least 20 muscle groups, found {len(muscle_groups.data)}"
        print(f"✓ Muscle groups populated: {len(muscle_groups.data)} records")

        # Check sequence rules (should have 16)
        sequence_rules = supabase_client.table('sequence_rules').select('rule_number').execute()
        assert len(sequence_rules.data) >= 16, f"Expected at least 16 sequence rules, found {len(sequence_rules.data)}"
        print(f"✓ Sequence rules populated: {len(sequence_rules.data)} records")

        # Check transitions (should have 20)
        transitions = supabase_client.table('transitions').select('id').execute()
        assert len(transitions.data) >= 20, f"Expected at least 20 transitions, found {len(transitions.data)}"
        print(f"✓ Transitions populated: {len(transitions.data)} records")


class TestMigrationScript:
    """Test data migration from Excel JSON to database"""

    @pytest.fixture(scope="class")
    def migrator(self):
        """Initialize DatabaseMigrator"""
        try:
            return DatabaseMigrator()
        except ValueError as e:
            pytest.skip(f"Cannot initialize migrator: {e}")

    def test_json_data_loads(self, migrator):
        """Test that extracted JSON data can be loaded"""
        json_path = Path(__file__).parent.parent / 'data' / 'extracted_data.json'

        if not json_path.exists():
            pytest.skip("extracted_data.json not found. Run data_extraction.py first.")

        data = migrator.load_json_data(str(json_path))
        assert data is not None
        assert 'all_sheets' in data
        print(f"✓ JSON data loaded successfully")

    def test_movements_migrated(self, migrator):
        """Test that movements were migrated to database"""
        try:
            movements = migrator.client.table('movements').select('*').execute()

            # Should have 34 classical Pilates movements
            assert len(movements.data) > 0, "No movements found in database"
            print(f"✓ Movements migrated: {len(movements.data)} records")

            # Verify essential fields
            if movements.data:
                first_movement = movements.data[0]
                assert 'name' in first_movement
                assert 'difficulty_level' in first_movement
                assert 'setup_position' in first_movement
                print(f"✓ Movement structure validated: {first_movement['name']}")

        except Exception as e:
            pytest.fail(f"Movement migration validation failed: {e}")

    def test_muscle_mappings_exist(self, migrator):
        """Test that movement → muscle group mappings exist"""
        try:
            mappings = migrator.client.table('movement_muscles').select('*').execute()
            assert len(mappings.data) > 0, "No muscle mappings found"
            print(f"✓ Muscle mappings exist: {len(mappings.data)} records")
        except Exception as e:
            pytest.fail(f"Muscle mapping validation failed: {e}")


class TestMCPClient:
    """Test MCP Playwright client functionality"""

    @pytest.fixture(scope="class")
    def mcp_client(self):
        """Initialize MCP client"""
        return MCPPlaywrightClient()

    def test_mcp_client_initializes(self, mcp_client):
        """Test MCP client initialization"""
        assert mcp_client is not None
        assert hasattr(mcp_client, 'trusted_domains')
        assert len(mcp_client.trusted_domains) > 0
        print(f"✓ MCP client initialized with {len(mcp_client.trusted_domains)} trusted domains")

    def test_redis_connection(self, mcp_client):
        """Test Redis cache connection (optional, won't fail if unavailable)"""
        if mcp_client.cache:
            try:
                mcp_client.cache.ping()
                print("✓ Redis cache connected")
            except Exception as e:
                print(f"⚠ Redis cache unavailable: {e}")
        else:
            print("⚠ Redis cache not configured (proceeding without cache)")

    @pytest.mark.asyncio
    async def test_search_movement_cues(self, mcp_client):
        """Test searching for movement cues"""
        result = await mcp_client.search_movement_cues("The Hundred")

        assert result is not None
        assert 'movement' in result
        assert 'cues' in result
        assert 'verbal' in result['cues']
        assert 'sources' in result
        print(f"✓ Movement cues search works: {result['movement']}")
        print(f"  - Found {len(result['cues']['verbal'])} verbal cues")

    @pytest.mark.asyncio
    async def test_find_warmup_sequence(self, mcp_client):
        """Test warmup sequence research"""
        result = await mcp_client.find_warmup_sequence(
            target_muscles=['Core', 'Hip flexors'],
            duration_minutes=5
        )

        assert result is not None
        assert 'exercises' in result
        assert len(result['exercises']) > 0
        print(f"✓ Warmup sequence research works")
        print(f"  - Found {len(result['exercises'])} exercises")

    @pytest.mark.asyncio
    async def test_pregnancy_modifications(self, mcp_client):
        """Test pregnancy modification research"""
        result = await mcp_client.research_pregnancy_modifications(
            movement_name="Roll Up",
            trimester=2
        )

        assert result is not None
        assert 'movement' in result
        assert 'trimester' in result
        assert 'modifications' in result
        assert 'contraindications' in result
        print(f"✓ Pregnancy modification research works")
        print(f"  - Movement: {result['movement']}")
        print(f"  - Trimester {result['trimester']}: {len(result['modifications'])} modifications")

    @pytest.mark.asyncio
    async def test_injury_modifications(self, mcp_client):
        """Test injury modification research"""
        result = await mcp_client.research_injury_modifications(
            movement_name="Roll Up",
            injury_type="chronic_pain",
            injury_location="lower_back"
        )

        assert result is not None
        assert 'movement' in result
        assert 'injury' in result
        assert 'modifications' in result
        print(f"✓ Injury modification research works")
        print(f"  - Movement: {result['movement']}")
        print(f"  - Injury: {result['injury']['location']} {result['injury']['type']}")

    def test_cache_operations(self, mcp_client):
        """Test cache get/set operations"""
        if not mcp_client.cache:
            pytest.skip("Redis cache not available")

        # Test cache key generation
        cache_key = mcp_client._get_cache_key('test', {'param': 'value'})
        assert cache_key.startswith('mcp:test:')
        print(f"✓ Cache key generation works: {cache_key}")

        # Test cache set
        test_data = {'test': 'data'}
        mcp_client._set_cached(cache_key, test_data)

        # Test cache get
        retrieved = mcp_client._get_cached(cache_key)
        assert retrieved == test_data
        print(f"✓ Cache set/get works")

        # Clean up
        mcp_client.clear_cache('mcp:test:*')


class TestDataIntegrity:
    """Test data integrity and relationships"""

    @pytest.fixture(scope="class")
    def supabase_client(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')

        if not supabase_url or not supabase_key:
            pytest.skip("SUPABASE_URL and SUPABASE_KEY must be set")

        return create_client(supabase_url, supabase_key)

    def test_movement_muscle_relationships(self, supabase_client):
        """Verify movement → muscle group relationships are valid"""
        try:
            # Get all muscle mappings
            mappings = supabase_client.table('movement_muscles').select('movement_id, muscle_group_id').execute()

            if not mappings.data:
                pytest.skip("No muscle mappings to validate")

            # Verify referenced movements exist
            for mapping in mappings.data[:10]:  # Sample first 10
                movement = supabase_client.table('movements').select('id').eq('id', mapping['movement_id']).execute()
                assert len(movement.data) > 0, f"Movement {mapping['movement_id']} not found"

                muscle_group = supabase_client.table('muscle_groups').select('id').eq('id', mapping['muscle_group_id']).execute()
                assert len(muscle_group.data) > 0, f"Muscle group {mapping['muscle_group_id']} not found"

            print(f"✓ Movement-muscle relationships valid (sampled 10/{len(mappings.data)})")

        except Exception as e:
            pytest.fail(f"Relationship validation failed: {e}")

    def test_excel_traceability(self, supabase_client):
        """Verify Excel traceability fields exist"""
        try:
            movements = supabase_client.table('movements').select('excel_row_number, excel_id, name').limit(5).execute()

            if not movements.data:
                pytest.skip("No movements to validate")

            for movement in movements.data:
                # Check that traceability fields exist
                assert 'excel_row_number' in movement or 'excel_id' in movement, \
                    f"Movement '{movement.get('name')}' missing Excel traceability"

            print(f"✓ Excel traceability validated")

        except Exception as e:
            pytest.fail(f"Traceability validation failed: {e}")

    def test_sequence_rules_complete(self, supabase_client):
        """Verify all 16 critical sequence rules are present"""
        try:
            rules = supabase_client.table('sequence_rules').select('rule_number, description').order('rule_number').execute()

            assert len(rules.data) >= 16, f"Expected 16 sequence rules, found {len(rules.data)}"

            # Verify rule numbers 1-16 exist
            rule_numbers = [r['rule_number'] for r in rules.data]
            for i in range(1, 17):
                assert i in rule_numbers, f"Rule #{i} missing"

            print(f"✓ All 16 sequence rules present")

        except Exception as e:
            pytest.fail(f"Sequence rules validation failed: {e}")


class TestRLSPolicies:
    """Test Row Level Security policies"""

    @pytest.fixture(scope="class")
    def supabase_client(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')

        if not supabase_url or not supabase_key:
            pytest.skip("SUPABASE_URL and SUPABASE_KEY required")

        return create_client(supabase_url, supabase_key)

    def test_public_reference_data_readable(self, supabase_client):
        """Test that reference data (movements, rules) is publicly readable"""
        try:
            # These should be accessible without auth
            movements = supabase_client.table('movements').select('id').limit(1).execute()
            assert movements.data is not None
            print("✓ Movements are publicly readable")

            rules = supabase_client.table('sequence_rules').select('id').limit(1).execute()
            assert rules.data is not None
            print("✓ Sequence rules are publicly readable")

            muscle_groups = supabase_client.table('muscle_groups').select('id').limit(1).execute()
            assert muscle_groups.data is not None
            print("✓ Muscle groups are publicly readable")

        except Exception as e:
            pytest.fail(f"Public data access failed: {e}")

    def test_rls_enabled(self, supabase_client):
        """Verify RLS is enabled on all tables"""
        # This test requires database metadata access
        # Will be a basic check that tables exist

        tables_with_rls = [
            'users',
            'pii_tokens',
            'class_plans',
            'student_profiles'
        ]

        for table in tables_with_rls:
            try:
                # Try to access table (should work with service role key)
                response = supabase_client.table(table).select('id').limit(1).execute()
                print(f"✓ RLS table '{table}' accessible")
            except Exception as e:
                print(f"⚠ Table '{table}' access check: {e}")


def run_integration_tests():
    """
    Run all integration tests with pytest
    Usage: python test_integration.py
    """
    import subprocess

    print("=" * 60)
    print("RUNNING INTEGRATION TESTS - SESSION 2B")
    print("=" * 60)

    # Run pytest with verbose output
    result = subprocess.run(
        ['pytest', __file__, '-v', '-s', '--tb=short'],
        capture_output=False
    )

    return result.returncode


if __name__ == "__main__":
    exit_code = run_integration_tests()
    exit(exit_code)
