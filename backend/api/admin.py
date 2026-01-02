"""
Admin API Endpoints
Handles admin-only features: beta feedback management, analytics, diagnostics
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from utils.auth import get_admin_user_id
from utils.logger import get_logger
from supabase import create_client, Client
import os

logger = get_logger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================================
# MODELS
# ============================================================================

class FeedbackUpdate(BaseModel):
    """Model for updating feedback status/notes"""
    status: Optional[str] = None  # new, in_progress, resolved
    admin_notes: Optional[str] = None


class BetaFeedbackItem(BaseModel):
    """Model for beta feedback response"""
    id: str
    user_id: Optional[str]
    name: str
    email: str
    country: Optional[str]
    feedback_type: str
    subject: str
    message: str
    status: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    admin_notes: Optional[str]


# ============================================================================
# BETA FEEDBACK MANAGEMENT
# ============================================================================

@router.get("/beta-feedback", response_model=List[BetaFeedbackItem])
async def get_all_beta_feedback(
    status: Optional[str] = None,
    admin_user_id: str = Depends(get_admin_user_id)
):
    """
    Get all beta feedback submissions (admin-only)

    Optional filters:
    - status: Filter by status (new, in_progress, resolved)

    Returns:
        List of all feedback submissions
    """

    try:
        query = supabase.table("beta_feedback").select("*")

        # Apply status filter if provided
        if status:
            query = query.eq("status", status)

        # Order by creation date (newest first)
        result = query.order("created_at", desc=True).execute()

        return result.data

    except Exception as e:
        logger.error(f"Admin feedback fetch failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch beta feedback"
        )


@router.patch("/beta-feedback/{feedback_id}")
async def update_beta_feedback(
    feedback_id: str,
    update: FeedbackUpdate,
    admin_user_id: str = Depends(get_admin_user_id)
):
    """
    Update beta feedback status and/or admin notes (admin-only)

    Args:
        feedback_id: UUID of feedback to update
        update: FeedbackUpdate with status and/or admin_notes

    Returns:
        Updated feedback record
    """

    try:
        # Build update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat(),
            "reviewed_by": admin_user_id,
            "reviewed_at": datetime.utcnow().isoformat()
        }

        if update.status is not None:
            update_data["status"] = update.status

        if update.admin_notes is not None:
            update_data["admin_notes"] = update.admin_notes

        # Update in Supabase
        result = supabase.table("beta_feedback")\
            .update(update_data)\
            .eq("id", feedback_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail=f"Feedback {feedback_id} not found"
            )

        logger.info(f"Admin {admin_user_id} updated feedback {feedback_id}: status={update.status}")
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin feedback update failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to update beta feedback"
        )


@router.get("/beta-feedback/stats")
async def get_beta_feedback_stats(
    admin_user_id: str = Depends(get_admin_user_id)
):
    """
    Get beta feedback statistics (admin-only)

    Returns:
        Counts by status, feedback type, and recent submissions
    """

    try:
        # Get all feedback
        all_feedback = supabase.table("beta_feedback")\
            .select("status, feedback_type, created_at")\
            .execute()

        data = all_feedback.data

        # Calculate statistics
        stats = {
            "total": len(data),
            "by_status": {
                "new": len([f for f in data if f.get("status") == "new"]),
                "in_progress": len([f for f in data if f.get("status") == "in_progress"]),
                "resolved": len([f for f in data if f.get("status") == "resolved"])
            },
            "by_type": {},
            "recent_count_24h": 0,
            "recent_count_7d": 0
        }

        # Count by feedback type
        for f in data:
            ftype = f.get("feedback_type", "other")
            stats["by_type"][ftype] = stats["by_type"].get(ftype, 0) + 1

        # Count recent submissions
        now = datetime.utcnow()
        for f in data:
            created = datetime.fromisoformat(f["created_at"].replace("Z", "+00:00"))
            hours_ago = (now - created).total_seconds() / 3600

            if hours_ago <= 24:
                stats["recent_count_24h"] += 1
            if hours_ago <= 168:  # 7 days
                stats["recent_count_7d"] += 1

        return stats

    except Exception as e:
        logger.error(f"Admin feedback stats failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch beta feedback statistics"
        )


@router.delete("/beta-feedback/{feedback_id}")
async def delete_beta_feedback(
    feedback_id: str,
    admin_user_id: str = Depends(get_admin_user_id)
):
    """
    Delete beta feedback (admin-only)

    Args:
        feedback_id: UUID of feedback to delete

    Returns:
        Success message
    """

    try:
        result = supabase.table("beta_feedback")\
            .delete()\
            .eq("id", feedback_id)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail=f"Feedback {feedback_id} not found"
            )

        logger.info(f"Admin {admin_user_id} deleted feedback {feedback_id}")
        return {"success": True, "message": "Feedback deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin feedback delete failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete beta feedback"
        )
