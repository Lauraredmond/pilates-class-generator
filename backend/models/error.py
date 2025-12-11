"""
Error response models for secure error handling
Prevents information disclosure in production (OWASP A09)
"""

from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime


class ErrorResponse(BaseModel):
    """
    Secure error response model

    Used to return errors to clients without exposing sensitive details.
    Server-side error details are logged separately for debugging.

    Security:
    - Generic client-facing messages (no stack traces, internal paths, etc.)
    - Unique error_id for correlation with server logs
    - Timestamp for debugging timeline
    - Optional detail field (only populated in development mode)

    Example usage:
        try:
            # operation
        except Exception as e:
            logger.error(f"Database error: {str(e)}", exc_info=True, error_id=error_id)
            raise HTTPException(
                status_code=500,
                detail=ErrorResponse(
                    error_id=error_id,
                    message="Unable to process request",
                    detail=str(e) if settings.DEBUG else None  # Only in dev
                ).model_dump()
            )
    """

    error_id: UUID = Field(
        default_factory=uuid4,
        description="Unique error identifier for log correlation"
    )
    message: str = Field(
        ...,
        description="Generic user-facing error message (no sensitive details)"
    )
    detail: Optional[str] = Field(
        default=None,
        description="Detailed error information (only in development mode)"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the error occurred"
    )
    status_code: int = Field(
        ...,
        description="HTTP status code"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "error_id": "550e8400-e29b-41d4-a716-446655440000",
                "message": "Unable to process request",
                "detail": None,
                "timestamp": "2025-12-11T10:30:00Z",
                "status_code": 500
            }
        }


# Generic error messages (user-facing, no sensitive details)
class ErrorMessages:
    """
    Predefined generic error messages for common scenarios

    These messages are intentionally vague to prevent information disclosure.
    Actual error details are logged server-side for debugging.
    """

    # Authentication & Authorization
    INVALID_CREDENTIALS = "Invalid email or password"
    UNAUTHORIZED = "You must be logged in to access this resource"
    FORBIDDEN = "You don't have permission to access this resource"
    TOKEN_INVALID = "Invalid or expired authentication token"

    # Data Operations
    RESOURCE_NOT_FOUND = "The requested resource was not found"
    DATABASE_ERROR = "Unable to complete operation. Please try again later"
    VALIDATION_ERROR = "The provided data is invalid"
    CONFLICT = "This operation conflicts with existing data"

    # User Account
    EMAIL_EXISTS = "An account with this email already exists"
    USER_NOT_FOUND = "User account not found"
    PROFILE_UPDATE_FAILED = "Unable to update profile. Please try again"
    PASSWORD_CHANGE_FAILED = "Unable to change password. Please try again"
    ACCOUNT_DELETION_FAILED = "Unable to delete account. Please try again"

    # Preferences
    PREFERENCES_FETCH_FAILED = "Unable to load preferences. Please try again"
    PREFERENCES_UPDATE_FAILED = "Unable to update preferences. Please try again"

    # Feedback
    FEEDBACK_SUBMIT_FAILED = "Unable to submit feedback. Please try again"
    FEEDBACK_FETCH_FAILED = "Unable to load feedback. Please try again"

    # Compliance & Data Export
    DATA_EXPORT_FAILED = "Unable to export data. Please try again"
    ROPA_REPORT_FAILED = "Unable to generate report. Please try again"
    AI_DECISIONS_FETCH_FAILED = "Unable to load AI decisions. Please try again"

    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "Too many requests. Please try again later"

    # Generic Fallback
    INTERNAL_ERROR = "An unexpected error occurred. Please try again later"
    SERVICE_UNAVAILABLE = "Service temporarily unavailable. Please try again later"
