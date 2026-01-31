"""Pydantic models for request/response schemas."""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
    picture: Optional[str] = None


class User(UserBase):
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    bio: Optional[str] = None
    profession: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    age: Optional[int] = None
    interests: List[str] = []
    photos: List[str] = []
    profile_photo: Optional[str] = None
    onboarding_complete: bool = False
    verified: bool = False
    verification_type: Optional[str] = None
    icebreakers: List[Dict[str, str]] = []
    boost_active: bool = False
    boost_expires: Optional[datetime] = None
    super_likes_remaining: int = 3
    last_super_like_refresh: Optional[datetime] = None
    online: bool = False
    last_active: Optional[datetime] = None


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    profession: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    age: Optional[int] = None
    interests: Optional[List[str]] = None
    name: Optional[str] = None
    icebreakers: Optional[List[Dict[str, str]]] = None


class PhotoUpload(BaseModel):
    photo_data: str
    is_primary: bool = False


class TravelSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schedule_id: str = Field(default_factory=lambda: f"sched_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    destination: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_date: str
    end_date: str
    notes: Optional[str] = None
    looking_to_meet: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TravelScheduleCreate(BaseModel):
    title: str
    destination: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_date: str
    end_date: str
    notes: Optional[str] = None
    looking_to_meet: bool = True


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False
    read_at: Optional[datetime] = None


class ChatMessageCreate(BaseModel):
    recipient_id: str
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None


class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str = Field(default_factory=lambda: f"match_{uuid.uuid4().hex[:12]}")
    user_id: str
    target_user_id: str
    action: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: str
    title: str
    message: str
    data: Dict[str, Any] = {}
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TypingStatus(BaseModel):
    conversation_id: str
    user_id: str
    is_typing: bool
