"""
User models with PII tokenization support
Compliant with GDPR and EU AI Act requirements
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user model with non-sensitive fields"""
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    """User creation model (registration)"""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login credentials"""
    email: EmailStr
    password: str


class UserInDB(UserBase):
    """User model as stored in database (with tokenized PII)"""
    id: UUID
    email_token: str  # Tokenized email
    name_token: Optional[str] = None  # Tokenized name
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserBase):
    """Public user model (returned by API)"""
    id: UUID
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserPreferences(BaseModel):
    """User preferences for AI agents and class planning"""
    strictness_level: str = Field(
        default="guided",
        description="AI agent strictness: strict, guided, or autonomous"
    )
    default_class_duration: int = Field(
        default=60,
        description="Default class duration in minutes"
    )
    favorite_movements: list[str] = Field(
        default_factory=list,
        description="List of movement IDs"
    )
    music_preferences: dict = Field(
        default_factory=dict,
        description="Music style and BPM preferences"
    )
    research_sources: list[str] = Field(
        default_factory=list,
        description="Preferred research sources for MCP"
    )
    enable_mcp_research: bool = Field(
        default=True,
        description="Enable web research via MCP"
    )

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefresh(BaseModel):
    """Token refresh request"""
    refresh_token: str
