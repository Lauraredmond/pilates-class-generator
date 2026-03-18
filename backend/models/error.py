"""
Error response models for secure error handling
Prevents information disclosure in production (OWASP A09)
Implements RFC 9457 Problem Details for HTTP APIs
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
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


# ============================================
# RFC 9457 PROBLEM DETAILS FOR HTTP APIs
# ============================================

class RFC9457ProblemDetail(BaseModel):
    """
    RFC 9457 Problem Details for HTTP APIs

    Standard format for machine-readable error responses that improves
    AI agent understanding and API integration quality.

    Spec: https://www.rfc-editor.org/rfc/rfc9457.html

    JENTIC FIX: Error Standardization 0% → 90%+
    """

    type: str = Field(
        default="about:blank",
        description="URI reference identifying the problem type. When 'about:blank', the title is the same as the HTTP status code text."
    )
    title: str = Field(
        ...,
        description="Short, human-readable summary of the problem type. Should not change between occurrences except for localization."
    )
    status: int = Field(
        ...,
        ge=400,
        le=599,
        description="HTTP status code generated by the origin server for this occurrence."
    )
    detail: str = Field(
        ...,
        description="Human-readable explanation specific to this occurrence of the problem. Focuses on helping client correct the issue."
    )
    instance: Optional[str] = Field(
        None,
        description="URI reference identifying the specific occurrence of the problem. Often a request ID or error tracking ID."
    )

    # Extension members (additional context)
    error_id: Optional[UUID] = Field(
        None,
        description="Unique error identifier for log correlation (extension field)"
    )
    timestamp: Optional[datetime] = Field(
        None,
        description="When the error occurred (extension field)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "type": "https://api.basslinepilates.com/errors/validation-error",
                "title": "Validation Error",
                "status": 400,
                "detail": "The 'difficulty_level' field must be one of: Beginner, Intermediate, Advanced. Received: 'Expert'.",
                "instance": "/api/classes/generate",
                "error_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2025-12-11T10:30:00Z"
            }
        }


# Error type URIs (for RFC 9457 'type' field)
class ProblemTypes:
    """
    Problem type URIs for common error scenarios
    These URIs can resolve to documentation pages explaining the error type
    """
    BASE_URL = "https://api.basslinepilates.com/errors"

    # 400 Bad Request errors
    VALIDATION_ERROR = f"{BASE_URL}/validation-error"
    INVALID_DIFFICULTY = f"{BASE_URL}/invalid-difficulty"
    INVALID_DURATION = f"{BASE_URL}/invalid-duration"
    MISSING_REQUIRED_FIELD = f"{BASE_URL}/missing-required-field"

    # 401 Unauthorized errors
    AUTHENTICATION_REQUIRED = f"{BASE_URL}/authentication-required"
    INVALID_TOKEN = f"{BASE_URL}/invalid-token"
    EXPIRED_TOKEN = f"{BASE_URL}/expired-token"

    # 403 Forbidden errors
    INSUFFICIENT_PERMISSIONS = f"{BASE_URL}/insufficient-permissions"
    BETA_ACCESS_REQUIRED = f"{BASE_URL}/beta-access-required"

    # 404 Not Found errors
    RESOURCE_NOT_FOUND = f"{BASE_URL}/resource-not-found"
    MOVEMENT_NOT_FOUND = f"{BASE_URL}/movement-not-found"
    CLASS_NOT_FOUND = f"{BASE_URL}/class-not-found"
    USER_NOT_FOUND = f"{BASE_URL}/user-not-found"

    # 409 Conflict errors
    EMAIL_ALREADY_EXISTS = f"{BASE_URL}/email-already-exists"
    RESOURCE_CONFLICT = f"{BASE_URL}/resource-conflict"

    # 422 Unprocessable Entity errors
    SAFETY_RULE_VIOLATION = f"{BASE_URL}/safety-rule-violation"
    SEQUENCE_GENERATION_FAILED = f"{BASE_URL}/sequence-generation-failed"

    # 500 Internal Server Error
    DATABASE_ERROR = f"{BASE_URL}/database-error"
    AI_AGENT_ERROR = f"{BASE_URL}/ai-agent-error"
    INTERNAL_SERVER_ERROR = f"{BASE_URL}/internal-server-error"

    # 503 Service Unavailable
    SERVICE_UNAVAILABLE = f"{BASE_URL}/service-unavailable"
    RATE_LIMIT_EXCEEDED = f"{BASE_URL}/rate-limit-exceeded"
