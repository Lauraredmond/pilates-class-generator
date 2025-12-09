"""
Feedback Models
Pydantic models for beta tester feedback and queries
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class FeedbackSubmission(BaseModel):
    """Beta tester feedback submission"""
    name: str
    email: EmailStr
    country: str
    feedbackType: str  # general, bug, feature, usability, performance, question, other
    subject: str
    message: str


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool
    message: str
    feedback_id: Optional[str] = None
