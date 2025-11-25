"""
PII Transaction Logger - GDPR Article 30 Compliance
Records all PII processing activities to ropa_audit_log table
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import Request
from utils.supabase_client import supabase


class PIILogger:
    """Middleware to log all PII transactions for GDPR ROPA compliance"""

    # Define which fields are considered PII
    PII_FIELDS = [
        'email', 'full_name', 'age_range', 'gender_identity',
        'country', 'phone_number', 'address', 'pilates_experience',
        'goals', 'ip_address'
    ]

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
            result = supabase.table('ropa_audit_log').insert(log_entry).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            # Log to error monitoring but don't fail the request
            print(f"⚠️  ROPA logging failed: {e}")
            # In production, send to error monitoring service
            return None

    @staticmethod
    def detect_pii_fields(data: Dict[str, Any]) -> List[str]:
        """
        Automatically detect which PII fields are in a data dict

        Args:
            data: Dictionary of data to check for PII

        Returns:
            List of PII field names found in the data
        """
        if not data:
            return []

        detected_fields = []

        for field in PIILogger.PII_FIELDS:
            # Check both snake_case and camelCase variants
            if field in data or field.replace('_', '') in data:
                detected_fields.append(field)

        return detected_fields

    @staticmethod
    async def log_profile_read(user_id: str, request: Request, profile_data: Dict[str, Any]):
        """Convenience method for logging profile reads"""
        pii_fields = PIILogger.detect_pii_fields(profile_data)

        if pii_fields:
            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='read',
                pii_fields=pii_fields,
                purpose='contract',  # User accessing their own data per Terms of Service
                processing_system='profile_management',
                request=request,
                notes='User viewed their own profile'
            )

    @staticmethod
    async def log_profile_update(user_id: str, request: Request, updated_fields: Dict[str, Any]):
        """Convenience method for logging profile updates"""
        pii_fields = PIILogger.detect_pii_fields(updated_fields)

        if pii_fields:
            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='update',
                pii_fields=pii_fields,
                purpose='contract',
                processing_system='profile_management',
                request=request,
                notes=f'User updated profile fields: {", ".join(pii_fields)}'
            )

    @staticmethod
    async def log_registration(user_id: str, request: Request, registration_data: Dict[str, Any]):
        """Convenience method for logging new user registration"""
        pii_fields = PIILogger.detect_pii_fields(registration_data)

        if pii_fields:
            await PIILogger.log_pii_access(
                user_id=user_id,
                transaction_type='create',
                pii_fields=pii_fields,
                purpose='consent',  # User consented during registration
                processing_system='authentication',
                request=request,
                notes='New user registration'
            )

    @staticmethod
    async def log_account_deletion(user_id: str, request: Request):
        """Convenience method for logging account deletion"""
        await PIILogger.log_pii_access(
            user_id=user_id,
            transaction_type='delete',
            pii_fields=['email', 'full_name', 'age_range', 'gender_identity', 'country', 'goals'],
            purpose='consent',  # User exercising right to erasure
            processing_system='authentication',
            request=request,
            notes='User exercised GDPR right to erasure (account deletion)'
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
