"""
Feedback Models
Pydantic models for beta tester feedback and queries
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class FeedbackSubmission(BaseModel):
    """Beta tester feedback submission"""
    name: str = Field(..., description="Name")
    email: EmailStr = Field(..., description="Email address")
    country: str = Field(..., description="Country")
    feedbackType: str  # general, bug, feature, usability, performance, question, other = Field(..., description="Feedbacktype")
    subject: str = Field(..., description="Subject")
    message: str = Field(..., description="Message content")


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Message content")
    feedback_id: Optional[str] = Field(None, description="Feedback identifier")
