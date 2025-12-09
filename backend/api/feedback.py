"""
Feedback API Endpoints
Handles beta tester feedback submissions and email notifications
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from models.feedback import FeedbackSubmission, FeedbackResponse
from utils.auth import get_current_user_id
from supabase import create_client, Client
import os
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# Supabase client for storing feedback
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@router.post("/submit", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackSubmission,
    user_id: str = Depends(get_current_user_id)
):
    """
    Submit beta tester feedback

    This endpoint:
    1. Stores feedback in Supabase 'beta_feedback' table
    2. Sends email notification to admin via Supabase Auth (if SMTP configured)
    3. Returns success response
    """

    try:
        # Generate unique feedback ID
        feedback_id = str(uuid.uuid4())

        # Store feedback in Supabase
        feedback_data = {
            "id": feedback_id,
            "user_id": user_id,
            "name": feedback.name,
            "email": feedback.email,
            "country": feedback.country,
            "feedback_type": feedback.feedbackType,
            "subject": feedback.subject,
            "message": feedback.message,
            "created_at": datetime.utcnow().isoformat(),
            "status": "new"  # new, reviewed, resolved
        }

        # Insert into Supabase
        result = supabase.table("beta_feedback").insert(feedback_data).execute()

        # TODO: Send email notification via Supabase Auth
        # This will work once SMTP is configured in Supabase dashboard
        # For now, feedback is stored in database for manual review

        return FeedbackResponse(
            success=True,
            message="Thank you for your feedback! We'll review it within 24-48 hours.",
            feedback_id=feedback_id
        )

    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit feedback: {str(e)}"
        )


@router.get("/my-submissions")
async def get_my_feedback(
    user_id: str = Depends(get_current_user_id)
):
    """Get all feedback submissions for the current user"""

    try:
        result = supabase.table("beta_feedback")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        return {"feedback": result.data}

    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch feedback: {str(e)}"
        )
