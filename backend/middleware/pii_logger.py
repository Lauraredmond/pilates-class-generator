"""
PII Transaction Logger - GDPR Article 30 Compliance
Records all PII processing activities to ropa_audit_log table
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import Request
from utils.supabase_admin import supabase_admin  # Use admin client to bypass RLS for logging


class PIILogger:
    """Middleware to log all PII transactions for GDPR ROPA compliance"""

    # Cache for PII field registry to avoid repeated database queries
    _pii_registry_cache = None
    _cache_timestamp = None
    _cache_ttl_seconds = 3600  # Refresh cache every hour

    @staticmethod
    async def get_pii_registry() -> Dict[str, Dict[str, Any]]:
        """
        Get PII field registry from database with caching

        Returns:
            Dictionary mapping "table.column" to PII classification metadata
        """
        from datetime import datetime

        # Check if cache is still valid
        if PIILogger._pii_registry_cache and PIILogger._cache_timestamp:
            cache_age = (datetime.utcnow() - PIILogger._cache_timestamp).total_seconds()
            if cache_age < PIILogger._cache_ttl_seconds:
                return PIILogger._pii_registry_cache

        try:
            # Fetch all PII classifications from registry
            result = supabase_admin.table('pii_field_registry') \
                .select('*') \
                .execute()

            # Build lookup dictionary
            registry = {}
            for field in result.data:
                key = f"{field['table_name']}.{field['column_name']}"
                registry[key] = field

            # Update cache
            PIILogger._pii_registry_cache = registry
            PIILogger._cache_timestamp = datetime.utcnow()

            return registry

        except Exception as e:
            print(f"⚠️  Failed to load PII registry: {e}")
            # Return empty dict as fallback - logging will continue but without PII detection
            return {}

    @staticmethod
    async def log_pii_access(
        user_id: str,
        transaction_type: str,  # 'read', 'create', 'update', 'delete', 'export'
        pii_fields: List[str],
        purpose: str,  # 'consent', 'contract', 'legal_obligation', 'legitimate_interest'
        processing_system: str,  # 'authentication', 'profile_management', 'class_generation'
        request: Request,
        actor_id: Optional[str] = None,
        actor_type: str = 'user',
        third_party_recipients: Optional[List[str]] = None,
        retention_period: str = '7 years',
        notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Log a PII transaction to ROPA audit table

        Args:
            user_id: UUID of the user whose data is being processed
            transaction_type: Type of operation (read/create/update/delete/export)
            pii_fields: List of PII field names being accessed
            purpose: Legal basis under GDPR Article 6
            processing_system: Which part of the app is processing the data
            request: FastAPI Request object for IP and user agent
            actor_id: Who performed the action (defaults to user_id)
            actor_type: Type of actor (user/admin/system/api)
            third_party_recipients: List of third parties receiving the data
            retention_period: How long data is retained
            notes: Additional notes about the transaction

        Returns:
            The created log entry or None if logging failed
        """

        # Extract request metadata
        ip_address = None
        user_agent = None
        request_endpoint = None
        http_method = None

        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get('user-agent')
            request_endpoint = str(request.url.path)
            http_method = request.method

        log_entry = {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'transaction_type': transaction_type,
            'pii_fields': pii_fields,
            'purpose': purpose,
            'processing_system': processing_system,
            'actor_id': actor_id or user_id,
            'actor_type': actor_type,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'request_endpoint': request_endpoint,
            'http_method': http_method,
            'status': 'success',
            'retention_period': retention_period,
            'third_party_recipients': third_party_recipients or ['Supabase', 'Render.com'],
            'notes': notes
        }

        try:
            # Use service role key to bypass RLS for logging
            result = supabase_admin.table('ropa_audit_log').insert(log_entry).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            # Log to error monitoring but don't fail the request
            print(f"⚠️  ROPA logging failed: {e}")
            # In production, send to error monitoring service
            return None

    @staticmethod
    async def detect_pii_fields(data: Dict[str, Any], table_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Automatically detect which PII fields are in a data dict using registry

        Args:
            data: Dictionary of data to check for PII
            table_name: Optional table name for more accurate matching

        Returns:
            Dictionary with:
            - 'fields': List of PII field names found
            - 'categories': Dict mapping field to PII category
            - 'has_health_data': Boolean indicating Article 9 special category data
            - 'health_fields': List of health data fields (Article 9)
        """
        if not data:
            return {
                'fields': [],
                'categories': {},
                'has_health_data': False,
                'health_fields': []
            }

        # Get PII registry
        registry = await PIILogger.get_pii_registry()

        detected_fields = []
        field_categories = {}
        health_fields = []

        # Check each field in the data against registry
        for field_name in data.keys():
            # Try exact match with table name if provided
            if table_name:
                registry_key = f"{table_name}.{field_name}"
                if registry_key in registry:
                    classification = registry[registry_key]
                    if classification['pii_category'] != 'NONE':
                        detected_fields.append(field_name)
                        field_categories[field_name] = classification['pii_category']

                        # Check for Article 9 health data
                        if classification['pii_category'] == 'HEALTH' or classification['is_sensitive']:
                            health_fields.append(field_name)
                    continue

            # Try matching field name across all tables (less accurate)
            matched = False
            for registry_key, classification in registry.items():
                if field_name in registry_key and classification['pii_category'] != 'NONE':
                    detected_fields.append(field_name)
                    field_categories[field_name] = classification['pii_category']

                    # Check for Article 9 health data
                    if classification['pii_category'] == 'HEALTH' or classification['is_sensitive']:
                        health_fields.append(field_name)
                    matched = True
                    break

        return {
            'fields': detected_fields,
            'categories': field_categories,
            'has_health_data': len(health_fields) > 0,
            'health_fields': health_fields
        }

    @staticmethod
    async def log_profile_read(user_id: str, request: Request, profile_data: Dict[str, Any]):
        """Convenience method for logging profile reads"""
        pii_detection = await PIILogger.detect_pii_fields(profile_data, table_name='user_profiles')

        if pii_detection['fields']:
            # Build descriptive notes
            notes = 'User viewed their own profile'
            if pii_detection['has_health_data']:
                notes += f" (includes Article 9 health data: {', '.join(pii_detection['health_fields'])})"

            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='read',
                pii_fields=pii_detection['fields'],
                purpose='contract',  # User accessing their own data per Terms of Service
                processing_system='profile_management',
                request=request,
                notes=notes
            )

    @staticmethod
    async def log_profile_update(user_id: str, request: Request, updated_fields: Dict[str, Any]):
        """Convenience method for logging profile updates"""
        pii_detection = await PIILogger.detect_pii_fields(updated_fields, table_name='user_profiles')

        if pii_detection['fields']:
            # Build descriptive notes with field names and categories
            field_descriptions = []
            for field in pii_detection['fields']:
                category = pii_detection['categories'].get(field, 'UNKNOWN')
                field_descriptions.append(f"{field} ({category})")

            notes = f"User updated profile fields: {', '.join(field_descriptions)}"

            # Add Article 9 warning if health data modified
            if pii_detection['has_health_data']:
                notes += f" ⚠️ Includes Article 9 special category health data"

            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='update',
                pii_fields=pii_detection['fields'],
                purpose='contract',
                processing_system='profile_management',
                request=request,
                notes=notes
            )

    @staticmethod
    async def log_registration(user_id: str, request: Request, registration_data: Dict[str, Any]):
        """Convenience method for logging new user registration"""
        pii_detection = await PIILogger.detect_pii_fields(registration_data, table_name='user_profiles')

        if pii_detection['fields']:
            # Build descriptive notes
            notes = f"New user registration with fields: {', '.join(pii_detection['fields'])}"

            # Add Article 9 warning if health data collected
            if pii_detection['has_health_data']:
                notes += f" ⚠️ Includes Article 9 special category health data (requires explicit consent)"

            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='create',
                pii_fields=pii_detection['fields'],
                purpose='consent',  # User consented during registration
                processing_system='authentication',
                request=request,
                notes=notes
            )

    @staticmethod
    async def log_account_deletion(user_id: str, request: Request):
        """Convenience method for logging account deletion"""
        # Get all PII fields for user_profiles table from registry
        registry = await PIILogger.get_pii_registry()

        # Extract all user_profiles PII fields
        deleted_fields = []
        has_health_data = False
        for key, classification in registry.items():
            if 'user_profiles' in key and classification['pii_category'] != 'NONE':
                field_name = classification['column_name']
                deleted_fields.append(field_name)

                # Check for Article 9 health data
                if classification['pii_category'] == 'HEALTH' or classification['is_sensitive']:
                    has_health_data = True

        # Fallback if registry not available
        if not deleted_fields:
            deleted_fields = ['email', 'full_name', 'age_range', 'gender_identity', 'country', 'goals']

        notes = 'User exercised GDPR Article 17 right to erasure (account deletion) - all user data deleted'
        if has_health_data:
            notes += ' ⚠️ Includes Article 9 special category health data'

        await PIILogger.log_pii_access(
            user_id=user_id,
            transaction_type='delete',
            pii_fields=deleted_fields,
            purpose='consent',  # User exercising right to erasure
            processing_system='authentication',
            request=request,
            notes=notes
        )

    @staticmethod
    async def log_data_export(user_id: str, request: Request, export_format: str = 'json'):
        """Convenience method for logging data export (GDPR Article 15)"""
        await PIILogger.log_pii_access(
            user_id=user_id,
            transaction_type='export',
            pii_fields=['all_user_data'],
            purpose='consent',  # User exercising right to data portability
            processing_system='compliance',
            request=request,
            notes=f'User exercised GDPR right to data portability (export format: {export_format})'
        )


# Convenience functions for quick logging
async def log_pii_read(user_id: str, request: Request, fields: List[str], system: str):
    """Quick logging for PII reads"""
    await PIILogger.log_pii_access(
        user_id=user_id,
        transaction_type='read',
        pii_fields=fields,
        purpose='contract',
        processing_system=system,
        request=request
    )


async def log_pii_update(user_id: str, request: Request, fields: List[str], system: str):
    """Quick logging for PII updates"""
    await PIILogger.log_pii_access(
        user_id=user_id,
        transaction_type='update',
        pii_fields=fields,
        purpose='contract',
        processing_system=system,
        request=request
    )
