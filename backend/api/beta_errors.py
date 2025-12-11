"""
Beta Errors API Router
Endpoints for viewing and managing beta errors logged during development/testing
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from loguru import logger
from pydantic import BaseModel
from datetime import datetime

from utils.auth import get_current_user_id
from models.error import ErrorMessages
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()


# ============================================================================
# Pydantic Models
# ============================================================================

class BetaError(BaseModel):
    """Beta error response model"""
    id: str
    error_type: str
    severity: str
    status: str
    endpoint: str
    error_message: str
    was_bypassed: bool
    bypass_reason: Optional[str]
    user_affected: bool
    user_notified: bool
    occurrence_count: int
    first_occurred_at: datetime
    last_occurred_at: datetime
    environment: str
    version: Optional[str]


class BetaErrorStats(BaseModel):
    """Beta error statistics"""
    error_type: str
    severity: str
    status: str
    total_occurrences: int
    total_hits: int
    users_affected: int
    first_seen: datetime
    last_seen: datetime
    bypass_rate_pct: float


# ============================================================================
# Admin-Only Dependency
# ============================================================================

async def require_admin(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Verify user is an admin
    Raises 403 if not admin
    """
    try:
        # Check user role
        response = supabase.table('users') \
            .select('role') \
            .eq('id', user_id) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="User not found")

        if response.data[0].get('role') != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return user_id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify admin status")


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/beta-errors", response_model=List[BetaError])
async def get_beta_errors(
    admin_user_id: str = Depends(require_admin),
    status: Optional[str] = None,
    error_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get list of beta errors with optional filtering

    **Admin only**

    - **status**: Filter by status (ACTIVE, INVESTIGATING, FIXED)
    - **error_type**: Filter by error type (e.g., KEYERROR_BYPASS)
    - **severity**: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
    - **limit**: Number of results to return (default 50, max 100)
    - **offset**: Number of results to skip (for pagination)
    """
    try:
        # Build query
        query = supabase.table('beta_errors').select('*')

        # Apply filters
        if status:
            query = query.eq('status', status)
        if error_type:
            query = query.eq('error_type', error_type)
        if severity:
            query = query.eq('severity', severity)

        # Order by most recent
        query = query.order('last_occurred_at', desc=True)

        # Apply pagination
        query = query.limit(min(limit, 100)).offset(offset)

        # Execute
        response = query.execute()

        logger.info(f"Admin {admin_user_id} retrieved {len(response.data)} beta errors")

        return response.data

    except Exception as e:
        logger.error(f"Error fetching beta errors for admin {admin_user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/beta-errors/stats", response_model=List[BetaErrorStats])
async def get_beta_error_stats(
    admin_user_id: str = Depends(require_admin)
):
    """
    Get aggregated statistics about beta errors

    **Admin only**

    Returns summary stats grouped by error type, severity, and status
    """
    try:
        # Query the view
        response = supabase.table('beta_error_stats').select('*').execute()

        logger.info(f"Admin {admin_user_id} retrieved beta error stats")

        return response.data

    except Exception as e:
        logger.error(f"Error fetching beta error stats for admin {admin_user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/beta-errors/{error_id}", response_model=BetaError)
async def get_beta_error(
    error_id: str,
    admin_user_id: str = Depends(require_admin)
):
    """
    Get detailed information about a specific beta error

    **Admin only**

    Includes full stack trace, request/response data, etc.
    """
    try:
        response = supabase.table('beta_errors') \
            .select('*') \
            .eq('id', error_id) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Beta error not found")

        logger.info(f"Admin {admin_user_id} viewed beta error {error_id}")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching beta error {error_id} for admin {admin_user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.patch("/beta-errors/{error_id}/status")
async def update_beta_error_status(
    error_id: str,
    status: str,
    fix_notes: Optional[str] = None,
    fix_commit_hash: Optional[str] = None,
    admin_user_id: str = Depends(require_admin)
):
    """
    Update the status of a beta error

    **Admin only**

    - **status**: New status (ACTIVE, INVESTIGATING, FIXED)
    - **fix_notes**: Optional notes about the fix
    - **fix_commit_hash**: Optional git commit hash of the fix
    """
    try:
        # Validate status
        valid_statuses = ['ACTIVE', 'INVESTIGATING', 'FIXED']
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

        # Prepare update data
        update_data = {
            'status': status,
            'updated_at': datetime.now().isoformat()
        }

        if status == 'FIXED':
            update_data['fixed_at'] = datetime.now().isoformat()
            if fix_notes:
                update_data['fix_notes'] = fix_notes
            if fix_commit_hash:
                update_data['fix_commit_hash'] = fix_commit_hash

        # Update
        response = supabase.table('beta_errors') \
            .update(update_data) \
            .eq('id', error_id) \
            .execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Beta error not found")

        logger.info(f"Admin {admin_user_id} updated beta error {error_id} status to {status}")

        return {
            "success": True,
            "message": f"Beta error status updated to {status}",
            "error": response.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating beta error {error_id} for admin {admin_user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)


@router.get("/beta-errors/count/active")
async def get_active_beta_errors_count(
    admin_user_id: str = Depends(require_admin)
):
    """
    Get count of active beta errors

    **Admin only**

    Useful for dashboard widgets showing number of open issues
    """
    try:
        response = supabase.table('beta_errors') \
            .select('id', count='exact') \
            .eq('status', 'ACTIVE') \
            .execute()

        count = response.count if hasattr(response, 'count') else len(response.data)

        return {
            "active_count": count
        }

    except Exception as e:
        logger.error(f"Error counting active beta errors for admin {admin_user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=ErrorMessages.DATABASE_ERROR)
