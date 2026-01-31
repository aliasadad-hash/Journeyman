from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Profile fields
    bio: Optional[str] = None
    profession: Optional[str] = None  # trucker, airline, military, admirer, vacationer
    location: Optional[str] = None
    age: Optional[int] = None
    interests: List[str] = []
    profile_photo: Optional[str] = None  # Base64 encoded image
    onboarding_complete: bool = False

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
    age: Optional[int] = None
    interests: Optional[List[str]] = None
    name: Optional[str] = None

class PhotoUpload(BaseModel):
    photo_data: str  # Base64 encoded image

class TravelSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schedule_id: str = Field(default_factory=lambda: f"sched_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    destination: str
    start_date: str  # ISO format date
    end_date: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TravelScheduleCreate(BaseModel):
    title: str
    destination: str
    start_date: str
    end_date: str
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class ChatMessageCreate(BaseModel):
    recipient_id: str
    content: str

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str = Field(default_factory=lambda: f"match_{uuid.uuid4().hex[:12]}")
    user_id: str
    target_user_id: str
    action: str  # "like" or "pass"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: str  # "new_match", "new_message"
    title: str
    message: str
    data: Dict[str, Any] = {}
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPERS ====================

async def get_current_user(request: Request) -> dict:
    """Extract user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def get_conversation_id(user1_id: str, user2_id: str) -> str:
    """Generate consistent conversation ID for two users"""
    sorted_ids = sorted([user1_id, user2_id])
    return f"conv_{sorted_ids[0]}_{sorted_ids[1]}"

async def create_notification(user_id: str, notif_type: str, title: str, message: str, data: dict = {}):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        data=data
    )
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    return notification

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Journeyman API - Welcome Travelers!"}

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create user session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id for user data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data.get("name", existing_user.get("name")),
                "picture": user_data.get("picture", existing_user.get("picture"))
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "onboarding_complete": False,
            "bio": None,
            "profession": None,
            "location": None,
            "age": None,
            "interests": [],
            "profile_photo": None
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user_id": user_id,
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "session_token": session_token
    }

@api_router.post("/auth/register")
async def register_user(user_data: UserCreate, response: Response):
    """Register a new user with email/password (JWT auth)"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with hashed password (simple hash for demo)
    import hashlib
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "onboarding_complete": False,
        "bio": None,
        "profession": None,
        "location": None,
        "age": None,
        "interests": [],
        "profile_photo": None
    }
    await db.users.insert_one(new_user)
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": new_user["email"],
        "name": new_user["name"],
        "onboarding_complete": False,
        "session_token": session_token
    }

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin, response: Response):
    """Login with email/password"""
    import hashlib
    password_hash = hashlib.sha256(credentials.password.encode()).hexdigest()
    
    user = await db.users.find_one(
        {"email": credentials.email, "password_hash": password_hash},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "onboarding_complete": user.get("onboarding_complete", False),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user data"""
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(request: Request):
    """Get current user's profile"""
    user = await get_current_user(request)
    return user

@api_router.put("/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    """Update user profile"""
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.post("/profile/complete-onboarding")
async def complete_onboarding(request: Request, profile_data: ProfileUpdate):
    """Complete onboarding and set profile"""
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_data["onboarding_complete"] = True
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.post("/profile/photo")
async def upload_photo(request: Request, photo: PhotoUpload):
    """Upload profile photo (base64 encoded)"""
    user = await get_current_user(request)
    
    # Validate base64 data
    try:
        # Check if it's valid base64
        if photo.photo_data.startswith("data:image"):
            # Extract actual base64 data after the prefix
            pass
        else:
            base64.b64decode(photo.photo_data.split(",")[-1] if "," in photo.photo_data else photo.photo_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"profile_photo": photo.photo_data}}
    )
    
    return {"message": "Photo uploaded successfully"}

@api_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    """Get another user's public profile"""
    await get_current_user(request)  # Ensure authenticated
    
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# ==================== DISCOVERY ENDPOINTS ====================

@api_router.get("/discover")
async def discover_users(
    request: Request,
    professions: Optional[str] = Query(None, description="Comma-separated list of professions to filter"),
    skip: int = 0,
    limit: int = 20
):
    """Get discoverable users with optional profession filter"""
    current_user = await get_current_user(request)
    
    # Build query - exclude current user and get only onboarded users
    query = {
        "user_id": {"$ne": current_user["user_id"]},
        "onboarding_complete": True
    }
    
    # Add profession filter if provided
    if professions:
        profession_list = [p.strip().lower() for p in professions.split(",")]
        query["profession"] = {"$in": profession_list}
    
    # Get users already acted upon
    acted_users = await db.matches.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "target_user_id": 1}
    ).to_list(1000)
    acted_ids = [m["target_user_id"] for m in acted_users]
    
    if acted_ids:
        query["user_id"]["$nin"] = acted_ids
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return {"users": users, "count": len(users)}

@api_router.post("/discover/action")
async def match_action(request: Request, target_user_id: str, action: str):
    """Like or pass on a user"""
    current_user = await get_current_user(request)
    
    if action not in ["like", "pass"]:
        raise HTTPException(status_code=400, detail="Action must be 'like' or 'pass'")
    
    # Check if already acted
    existing = await db.matches.find_one({
        "user_id": current_user["user_id"],
        "target_user_id": target_user_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Already acted on this user")
    
    # Record action
    match = Match(
        user_id=current_user["user_id"],
        target_user_id=target_user_id,
        action=action
    )
    doc = match.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.matches.insert_one(doc)
    
    is_match = False
    
    # Check for mutual like
    if action == "like":
        mutual = await db.matches.find_one({
            "user_id": target_user_id,
            "target_user_id": current_user["user_id"],
            "action": "like"
        }, {"_id": 0})
        
        if mutual:
            is_match = True
            # Create notifications for both users
            target_user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0})
            
            await create_notification(
                user_id=current_user["user_id"],
                notif_type="new_match",
                title="New Match!",
                message=f"You matched with {target_user.get('name', 'someone')}!",
                data={"matched_user_id": target_user_id}
            )
            
            await create_notification(
                user_id=target_user_id,
                notif_type="new_match",
                title="New Match!",
                message=f"You matched with {current_user.get('name', 'someone')}!",
                data={"matched_user_id": current_user["user_id"]}
            )
    
    return {"action": action, "is_match": is_match}

@api_router.get("/matches")
async def get_matches(request: Request):
    """Get all mutual matches for the current user"""
    current_user = await get_current_user(request)
    
    # Get users I liked
    my_likes = await db.matches.find(
        {"user_id": current_user["user_id"], "action": "like"},
        {"_id": 0}
    ).to_list(1000)
    liked_ids = [m["target_user_id"] for m in my_likes]
    
    # Get users who liked me back
    mutual_matches = await db.matches.find({
        "user_id": {"$in": liked_ids},
        "target_user_id": current_user["user_id"],
        "action": "like"
    }, {"_id": 0}).to_list(1000)
    
    matched_user_ids = [m["user_id"] for m in mutual_matches]
    
    # Get user details
    matched_users = await db.users.find(
        {"user_id": {"$in": matched_user_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return {"matches": matched_users}

# ==================== CHAT ENDPOINTS ====================

@api_router.get("/conversations")
async def get_conversations(request: Request):
    """Get all conversations for current user"""
    current_user = await get_current_user(request)
    
    # Get all messages involving user
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["user_id"]},
            {"recipient_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Group by conversation and get latest message
    conversations = {}
    for msg in messages:
        conv_id = msg["conversation_id"]
        if conv_id not in conversations:
            other_id = msg["recipient_id"] if msg["sender_id"] == current_user["user_id"] else msg["sender_id"]
            conversations[conv_id] = {
                "conversation_id": conv_id,
                "other_user_id": other_id,
                "last_message": msg,
                "unread_count": 0
            }
        if msg["recipient_id"] == current_user["user_id"] and not msg.get("read", False):
            conversations[conv_id]["unread_count"] += 1
    
    # Get user details for conversations
    other_ids = [c["other_user_id"] for c in conversations.values()]
    users = await db.users.find(
        {"user_id": {"$in": other_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    user_map = {u["user_id"]: u for u in users}
    
    result = []
    for conv in conversations.values():
        conv["other_user"] = user_map.get(conv["other_user_id"], {})
        result.append(conv)
    
    return {"conversations": result}

@api_router.get("/chat/{user_id}")
async def get_chat_messages(user_id: str, request: Request):
    """Get messages with a specific user"""
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    messages = await db.messages.find(
        {"conversation_id": conv_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "conversation_id": conv_id,
            "recipient_id": current_user["user_id"],
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return {"messages": messages}

@api_router.post("/chat/{user_id}")
async def send_message(user_id: str, request: Request, message: ChatMessageCreate):
    """Send a message to a user"""
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    # Check if users are matched
    my_like = await db.matches.find_one({
        "user_id": current_user["user_id"],
        "target_user_id": user_id,
        "action": "like"
    }, {"_id": 0})
    
    their_like = await db.matches.find_one({
        "user_id": user_id,
        "target_user_id": current_user["user_id"],
        "action": "like"
    }, {"_id": 0})
    
    if not (my_like and their_like):
        raise HTTPException(status_code=403, detail="You can only message matched users")
    
    chat_msg = ChatMessage(
        conversation_id=conv_id,
        sender_id=current_user["user_id"],
        recipient_id=user_id,
        content=message.content
    )
    
    doc = chat_msg.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.messages.insert_one(doc)
    
    # Create notification for recipient
    await create_notification(
        user_id=user_id,
        notif_type="new_message",
        title="New Message",
        message=f"{current_user.get('name', 'Someone')} sent you a message",
        data={"sender_id": current_user["user_id"], "conversation_id": conv_id}
    )
    
    return doc

# ==================== TRAVEL SCHEDULE ENDPOINTS ====================

@api_router.get("/schedules")
async def get_my_schedules(request: Request):
    """Get current user's travel schedules"""
    current_user = await get_current_user(request)
    
    schedules = await db.schedules.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("start_date", 1).to_list(100)
    
    return {"schedules": schedules}

@api_router.post("/schedules")
async def create_schedule(request: Request, schedule_data: TravelScheduleCreate):
    """Create a new travel schedule"""
    current_user = await get_current_user(request)
    
    schedule = TravelSchedule(
        user_id=current_user["user_id"],
        **schedule_data.model_dump()
    )
    
    doc = schedule.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.schedules.insert_one(doc)
    
    # Remove MongoDB's _id before returning
    doc.pop("_id", None)
    return doc

@api_router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, request: Request):
    """Delete a travel schedule"""
    current_user = await get_current_user(request)
    
    result = await db.schedules.delete_one({
        "schedule_id": schedule_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    return {"message": "Schedule deleted"}

@api_router.get("/schedules/user/{user_id}")
async def get_user_schedules(user_id: str, request: Request):
    """Get another user's public travel schedules"""
    await get_current_user(request)
    
    schedules = await db.schedules.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("start_date", 1).to_list(100)
    
    return {"schedules": schedules}

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(request: Request, unread_only: bool = False):
    """Get user's notifications"""
    current_user = await get_current_user(request)
    
    query = {"user_id": current_user["user_id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"notifications": notifications}

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark a notification as read"""
    current_user = await get_current_user(request)
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}

@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read"""
    current_user = await get_current_user(request)
    
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All notifications marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    """Get count of unread notifications"""
    current_user = await get_current_user(request)
    
    count = await db.notifications.count_documents({
        "user_id": current_user["user_id"],
        "read": False
    })
    
    return {"count": count}

# ==================== WEBSOCKET FOR REAL-TIME CHAT ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages
            if data.get("type") == "message":
                recipient_id = data.get("recipient_id")
                content = data.get("content")
                
                conv_id = get_conversation_id(user_id, recipient_id)
                
                chat_msg = ChatMessage(
                    conversation_id=conv_id,
                    sender_id=user_id,
                    recipient_id=recipient_id,
                    content=content
                )
                
                doc = chat_msg.model_dump()
                doc["created_at"] = doc["created_at"].isoformat()
                await db.messages.insert_one(doc)
                
                # Send to recipient if online
                await manager.send_personal_message({
                    "type": "new_message",
                    "message": doc
                }, recipient_id)
                
                # Confirm to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message": doc
                })
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
