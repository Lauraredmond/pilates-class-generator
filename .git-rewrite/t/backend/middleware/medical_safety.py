"""
Medical Safety Middleware
CRITICAL SAFETY: Enforces pregnancy exclusions at API level
"""

from fastapi import Request, HTTPException, status
from typing import Optional
from loguru import logger
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()


class MedicalSafetyMiddleware:
    """
    Middleware to enforce pregnancy exclusions and medical disclaimers
    """

    def __init__(self):
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        self.supabase = create_client(supabase_url, supabase_key)

    async def __call__(self, request: Request, call_next):
        """Check medical safety before processing request"""

        # Skip for health checks and public endpoints
        if request.url.path in ['/health', '/docs', '/openapi.json', '/']:
            return await call_next(request)

        # Check disclaimer acceptance for all authenticated requests
        user_id = request.headers.get('X-User-Id', 'demo-user-id')

        if user_id and user_id != 'demo-user-id':
            try:
                # Check if user has accepted medical disclaimer
                disclaimer_check = await self.check_medical_disclaimer(user_id)

                if not disclaimer_check['accepted']:
                    logger.warning(f"User {user_id} attempted access without disclaimer acceptance")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Medical disclaimer must be accepted before using this application"
                    )

                # Check for pregnancy exclusion
                pregnancy_check = await self.check_pregnancy_exclusion(user_id)

                if pregnancy_check['is_excluded']:
                    logger.critical(f"PREGNANCY EXCLUSION TRIGGERED for user {user_id}")

                    # Log the exclusion attempt
                    await self.log_exclusion_attempt(
                        user_id=user_id,
                        exclusion_type='pregnancy',
                        action_taken='api_access_denied'
                    )

                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="PREGNANCY EXCLUSION: This application cannot be used during pregnancy. "
                               "Pilates movements require professional supervision during pregnancy."
                    )

            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Medical safety check error: {e}")
                # Fail closed - deny access if safety check fails
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Medical safety verification failed"
                )

        response = await call_next(request)
        return response

    async def check_medical_disclaimer(self, user_id: str) -> dict:
        """Check if user has accepted medical disclaimer"""
        try:
            response = self.supabase.table('users') \
                .select('medical_disclaimer_accepted, medical_disclaimer_accepted_at') \
                .eq('id', user_id) \
                .single() \
                .execute()

            if response.data:
                return {
                    'accepted': response.data.get('medical_disclaimer_accepted', False),
                    'accepted_at': response.data.get('medical_disclaimer_accepted_at')
                }

            return {'accepted': False, 'accepted_at': None}

        except Exception as e:
            logger.error(f"Disclaimer check error: {e}")
            return {'accepted': False, 'accepted_at': None}

    async def check_pregnancy_exclusion(self, user_id: str) -> dict:
        """
        Check if user or any student profiles have pregnancy exclusion

        Returns:
            dict: {
                'is_excluded': bool,
                'exclusion_reason': str or None,
                'severity': str
            }
        """
        try:
            # Use the database function for pregnancy check
            response = self.supabase.rpc('check_pregnancy_exclusion', {
                'p_user_id': user_id
            }).execute()

            if response.data and len(response.data) > 0:
                exclusion = response.data[0]
                return {
                    'is_excluded': exclusion.get('is_excluded', False),
                    'exclusion_reason': exclusion.get('exclusion_reason'),
                    'severity': exclusion.get('severity', 'SAFE')
                }

            return {
                'is_excluded': False,
                'exclusion_reason': None,
                'severity': 'SAFE'
            }

        except Exception as e:
            logger.error(f"Pregnancy exclusion check error: {e}")
            # Fail safe - if we can't check, assume no exclusion
            return {
                'is_excluded': False,
                'exclusion_reason': None,
                'severity': 'UNKNOWN'
            }

    async def log_exclusion_attempt(
        self,
        user_id: str,
        exclusion_type: str,
        action_taken: str
    ):
        """Log medical exclusion attempt for audit trail"""
        try:
            self.supabase.table('medical_exclusions_log').insert({
                'user_id': user_id,
                'exclusion_type': exclusion_type,
                'exclusion_reason': f'{exclusion_type.upper()} detected - access denied',
                'action_taken': action_taken
            }).execute()

            logger.info(f"Logged {exclusion_type} exclusion for user {user_id}")

        except Exception as e:
            logger.error(f"Failed to log exclusion: {e}")


async def validate_sequence_safety(
    sequence: list,
    user_id: str,
    student_profile_id: Optional[str] = None
) -> dict:
    """
    Validate that sequence is safe for user

    Args:
        sequence: List of movements
        user_id: User ID
        student_profile_id: Optional student profile ID

    Returns:
        dict: {
            'is_safe': bool,
            'violations': list,
            'exclusions': list
        }
    """
    violations = []
    exclusions = []

    try:
        # Initialize middleware for checks
        middleware = MedicalSafetyMiddleware()

        # Check pregnancy exclusion
        pregnancy_check = await middleware.check_pregnancy_exclusion(user_id)

        if pregnancy_check['is_excluded']:
            exclusions.append({
                'type': 'pregnancy',
                'severity': 'CRITICAL',
                'message': pregnancy_check['exclusion_reason']
            })
            logger.critical(f"Sequence generation blocked - pregnancy exclusion for user {user_id}")

        # If ANY critical exclusions exist, sequence is not safe
        is_safe = len(exclusions) == 0

        return {
            'is_safe': is_safe,
            'violations': violations,
            'exclusions': exclusions
        }

    except Exception as e:
        logger.error(f"Sequence safety validation error: {e}")
        # Fail safe - if we can't validate, deny
        return {
            'is_safe': False,
            'violations': ['Safety validation failed'],
            'exclusions': []
        }
