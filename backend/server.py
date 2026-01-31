from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query, WebSocket, WebSocketDisconnect, UploadFile, File, Form
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
import random
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment-based configuration
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com')
GIPHY_API_KEY = os.environ.get('GIPHY_API_KEY', 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65')  # Free public beta key
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [
    "http://localhost:3000",
    "https://localhost:3000"
]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# WebSocket connection manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = {"online": True, "last_seen": datetime.now(timezone.utc).isoformat()}
        # Broadcast online status
        await self.broadcast_status(user_id, True)
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = {"online": False, "last_seen": datetime.now(timezone.utc).isoformat()}
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)
    
    async def broadcast_status(self, user_id: str, online: bool):
        status_msg = {"type": "status_update", "user_id": user_id, "online": online, "timestamp": datetime.now(timezone.utc).isoformat()}
        for uid, ws in list(self.active_connections.items()):
            if uid != user_id:
                try:
                    await ws.send_json(status_msg)
                except:
                    pass
    
    async def send_typing_indicator(self, from_user: str, to_user: str, is_typing: bool):
        if to_user in self.active_connections:
            try:
                await self.active_connections[to_user].send_json({
                    "type": "typing",
                    "user_id": from_user,
                    "is_typing": is_typing
                })
            except:
                pass
    
    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections

manager = ConnectionManager()

# Icebreaker prompts database
ICEBREAKER_PROMPTS = [
    "Two truths and a lie about my travels...",
    "The best road trip snack is...",
    "My go-to karaoke song is...",
    "The most spontaneous thing I've done is...",
    "If I could live anywhere for a year, it would be...",
    "My ideal first date would be...",
    "The way to my heart is...",
    "I'm looking for someone who...",
    "My biggest adventure was...",
    "On weekends you'll find me...",
    "The key to my heart is...",
    "I geek out on...",
    "My simple pleasures include...",
    "Dating me is like...",
    "I'm convinced that...",
]

# ==================== MODELS ====================

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
    photos: List[str] = []  # Multiple photos
    profile_photo: Optional[str] = None
    onboarding_complete: bool = False
    verified: bool = False
    verification_type: Optional[str] = None  # "photo", "id", "phone"
    icebreakers: List[Dict[str, str]] = []  # [{prompt: "", answer: ""}]
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
    message_type: str = "text"  # "text", "image", "gif", "voice"
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
    action: str  # "like", "super_like", "pass"
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

# ==================== HELPERS ====================

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Update last active
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_active": datetime.now(timezone.utc).isoformat(), "online": True}}
    )
    
    return user

def get_conversation_id(user1_id: str, user2_id: str) -> str:
    sorted_ids = sorted([user1_id, user2_id])
    return f"conv_{sorted_ids[0]}_{sorted_ids[1]}"

async def create_notification(user_id: str, notif_type: str, title: str, message: str, data: dict = {}):
    notification = Notification(user_id=user_id, type=notif_type, title=title, message=message, data=data)
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    # Send via WebSocket if user is connected
    if user_id in manager.active_connections:
        await manager.send_personal_message({"type": "notification", "notification": doc}, user_id)
    return notification

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in miles between two coordinates"""
    from math import radians, cos, sin, asin, sqrt
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    miles = 3956 * c
    return round(miles, 1)

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Journeyman API - Connect on the Road"}

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                f"{AUTH_SERVICE_URL}/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Invalid session")
    
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data.get("name", existing_user.get("name")), "picture": user_data.get("picture", existing_user.get("picture"))}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id, "email": user_data["email"], "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""), "created_at": datetime.now(timezone.utc).isoformat(),
            "onboarding_complete": False, "bio": None, "profession": None, "location": None,
            "latitude": None, "longitude": None, "age": None, "interests": [], "photos": [],
            "profile_photo": None, "verified": False, "verification_type": None, "icebreakers": [],
            "boost_active": False, "boost_expires": None, "super_likes_remaining": 3,
            "last_super_like_refresh": datetime.now(timezone.utc).isoformat(), "online": True,
            "last_active": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user_id": user_id, "email": user["email"], "name": user["name"], "picture": user.get("picture"),
            "onboarding_complete": user.get("onboarding_complete", False), "session_token": session_token}

@api_router.post("/auth/register")
async def register_user(user_data: UserCreate, response: Response):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    import hashlib
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id, "email": user_data.email, "name": user_data.name, "password_hash": password_hash,
        "picture": None, "created_at": datetime.now(timezone.utc).isoformat(), "onboarding_complete": False,
        "bio": None, "profession": None, "location": None, "latitude": None, "longitude": None,
        "age": None, "interests": [], "photos": [], "profile_photo": None, "verified": False,
        "verification_type": None, "icebreakers": [], "boost_active": False, "boost_expires": None,
        "super_likes_remaining": 3, "last_super_like_refresh": datetime.now(timezone.utc).isoformat(),
        "online": True, "last_active": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {"user_id": user_id, "email": new_user["email"], "name": new_user["name"], "onboarding_complete": False, "session_token": session_token}

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin, response: Response):
    import hashlib
    password_hash = hashlib.sha256(credentials.password.encode()).hexdigest()
    user = await db.users.find_one({"email": credentials.email, "password_hash": password_hash}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"], "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"],
            "onboarding_complete": user.get("onboarding_complete", False), "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    return user

@api_router.put("/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    user = await get_current_user(request)
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.post("/profile/complete-onboarding")
async def complete_onboarding(request: Request, profile_data: ProfileUpdate):
    user = await get_current_user(request)
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_data["onboarding_complete"] = True
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user

@api_router.post("/profile/photo")
async def upload_photo(request: Request, photo: PhotoUpload):
    user = await get_current_user(request)
    photos = user.get("photos", [])
    photos.append(photo.photo_data)
    
    update_data = {"photos": photos}
    if photo.is_primary or not user.get("profile_photo"):
        update_data["profile_photo"] = photo.photo_data
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    return {"message": "Photo uploaded successfully", "photo_count": len(photos)}

@api_router.delete("/profile/photo/{photo_index}")
async def delete_photo(photo_index: int, request: Request):
    user = await get_current_user(request)
    photos = user.get("photos", [])
    if photo_index < 0 or photo_index >= len(photos):
        raise HTTPException(status_code=404, detail="Photo not found")
    
    deleted_photo = photos.pop(photo_index)
    update_data = {"photos": photos}
    if user.get("profile_photo") == deleted_photo:
        update_data["profile_photo"] = photos[0] if photos else None
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    return {"message": "Photo deleted"}

@api_router.post("/profile/verify")
async def request_verification(request: Request, verification_type: str):
    user = await get_current_user(request)
    if verification_type not in ["photo", "id", "phone"]:
        raise HTTPException(status_code=400, detail="Invalid verification type")
    
    # In production, this would trigger actual verification
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"verified": True, "verification_type": verification_type}}
    )
    return {"message": "Verification successful", "verified": True}

@api_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    current_user = await get_current_user(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate distance if both have location
    if current_user.get("latitude") and user.get("latitude"):
        user["distance"] = calculate_distance(
            current_user["latitude"], current_user["longitude"],
            user["latitude"], user["longitude"]
        )
    return user

@api_router.get("/icebreakers/prompts")
async def get_icebreaker_prompts():
    return {"prompts": ICEBREAKER_PROMPTS}

# ==================== DISCOVERY ENDPOINTS ====================

@api_router.get("/discover")
async def discover_users(
    request: Request,
    professions: Optional[str] = Query(None),
    min_age: Optional[int] = Query(None),
    max_age: Optional[int] = Query(None),
    max_distance: Optional[int] = Query(None),
    hot_travelers_only: bool = False,
    skip: int = 0,
    limit: int = 20
):
    current_user = await get_current_user(request)
    
    query = {"user_id": {"$ne": current_user["user_id"]}, "onboarding_complete": True}
    
    if professions:
        profession_list = [p.strip().lower() for p in professions.split(",")]
        query["profession"] = {"$in": profession_list}
    
    if min_age:
        query["age"] = {"$gte": min_age}
    if max_age:
        query.setdefault("age", {})["$lte"] = max_age
    
    # Get acted users (limited to prevent unbounded query)
    acted_users = await db.matches.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0, "target_user_id": 1}
    ).sort("created_at", -1).limit(500).to_list(500)
    acted_ids = [m["target_user_id"] for m in acted_users]
    if acted_ids:
        query["user_id"]["$nin"] = acted_ids
    
    # Prioritize boosted users
    pipeline = [
        {"$match": query},
        {"$addFields": {"priority": {"$cond": [{"$eq": ["$boost_active", True]}, 1, 0]}}},
        {"$sort": {"priority": -1, "last_active": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$project": {"_id": 0, "password_hash": 0}}
    ]
    
    users = await db.users.aggregate(pipeline).to_list(limit)
    
    # Calculate distances
    for user in users:
        if current_user.get("latitude") and user.get("latitude"):
            user["distance"] = calculate_distance(
                current_user["latitude"], current_user["longitude"],
                user["latitude"], user["longitude"]
            )
    
    # Batch check hot traveler status (fixes N+1 query)
    user_ids = [u["user_id"] for u in users]
    hot_traveler_map = await batch_check_hot_travelers(user_ids)
    for user in users:
        user.update(hot_traveler_map.get(user["user_id"], {"is_hot_traveler": False}))
    
    # Filter by distance if specified
    if max_distance and current_user.get("latitude"):
        users = [u for u in users if u.get("distance", 0) <= max_distance]
    
    # Filter to hot travelers only if requested
    if hot_travelers_only:
        users = [u for u in users if u.get("is_hot_traveler")]
    
    # Sort: hot travelers first, then by priority
    users.sort(key=lambda x: (not x.get("is_hot_traveler", False), -x.get("priority", 0)))
    
    hot_count = sum(1 for u in users if u.get("is_hot_traveler"))
    return {"users": users, "count": len(users), "hot_travelers_count": hot_count}

async def check_hot_traveler(user_id: str, target_lat: float = None, target_lon: float = None) -> dict:
    """Check if user is a hot traveler (has active travel schedule in the area)"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Find active schedules (start_date <= today <= end_date)
    active_schedule = await db.schedules.find_one({
        "user_id": user_id,
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }, {"_id": 0})
    
    if active_schedule:
        return {
            "is_hot_traveler": True,
            "traveling_to": active_schedule.get("destination"),
            "trip_title": active_schedule.get("title"),
            "trip_ends": active_schedule.get("end_date")
        }
    return {"is_hot_traveler": False}

async def batch_check_hot_travelers(user_ids: List[str]) -> Dict[str, dict]:
    """Batch check hot traveler status for multiple users - fixes N+1 query"""
    if not user_ids:
        return {}
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Single query to get all active schedules for the given users
    active_schedules = await db.schedules.find({
        "user_id": {"$in": user_ids},
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }, {"_id": 0}).to_list(None)
    
    # Create a map of user_id -> hot traveler info
    hot_traveler_map = {}
    for schedule in active_schedules:
        user_id = schedule["user_id"]
        if user_id not in hot_traveler_map:  # Take first active schedule if multiple
            hot_traveler_map[user_id] = {
                "is_hot_traveler": True,
                "traveling_to": schedule.get("destination"),
                "trip_title": schedule.get("title"),
                "trip_ends": schedule.get("end_date")
            }
    
    # Return map with default values for non-hot travelers
    result = {}
    for user_id in user_ids:
        result[user_id] = hot_traveler_map.get(user_id, {"is_hot_traveler": False})
    
    return result

@api_router.get("/discover/nearby")
async def get_nearby_users(request: Request, radius: int = 50):
    """Get users within a radius (miles) for map view"""
    current_user = await get_current_user(request)
    
    if not current_user.get("latitude"):
        return {"users": [], "message": "Location not set"}
    
    query = {
        "user_id": {"$ne": current_user["user_id"]},
        "onboarding_complete": True,
        "latitude": {"$exists": True, "$ne": None}
    }
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(100)
    
    nearby = []
    for user in users:
        if user.get("latitude"):
            distance = calculate_distance(
                current_user["latitude"], current_user["longitude"],
                user["latitude"], user["longitude"]
            )
            if distance <= radius:
                user["distance"] = distance
                nearby.append(user)
    
    # Batch check hot traveler status (fixes N+1 query)
    nearby_user_ids = [u["user_id"] for u in nearby]
    hot_traveler_map = await batch_check_hot_travelers(nearby_user_ids)
    for user in nearby:
        user.update(hot_traveler_map.get(user["user_id"], {"is_hot_traveler": False}))
    
    # Sort: hot travelers first, then by distance
    nearby.sort(key=lambda x: (not x.get("is_hot_traveler", False), x.get("distance", 999)))
    
    hot_count = sum(1 for u in nearby if u.get("is_hot_traveler"))
    return {"users": nearby, "count": len(nearby), "hot_travelers_count": hot_count}

@api_router.post("/discover/action")
async def match_action(request: Request, target_user_id: str, action: str):
    current_user = await get_current_user(request)
    
    if action not in ["like", "super_like", "pass"]:
        raise HTTPException(status_code=400, detail="Action must be 'like', 'super_like', or 'pass'")
    
    # Check super like availability
    if action == "super_like":
        if current_user.get("super_likes_remaining", 0) <= 0:
            raise HTTPException(status_code=400, detail="No super likes remaining")
        await db.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$inc": {"super_likes_remaining": -1}}
        )
    
    existing = await db.matches.find_one({
        "user_id": current_user["user_id"], "target_user_id": target_user_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Already acted on this user")
    
    match = Match(user_id=current_user["user_id"], target_user_id=target_user_id, action=action)
    doc = match.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.matches.insert_one(doc)
    
    is_match = False
    
    if action in ["like", "super_like"]:
        # Notify target of super like
        if action == "super_like":
            target_user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0})
            await create_notification(
                user_id=target_user_id,
                notif_type="super_like",
                title="Someone Super Liked You!",
                message=f"{current_user.get('name', 'Someone')} super liked your profile!",
                data={"from_user_id": current_user["user_id"]}
            )
        
        mutual = await db.matches.find_one({
            "user_id": target_user_id,
            "target_user_id": current_user["user_id"],
            "action": {"$in": ["like", "super_like"]}
        }, {"_id": 0})
        
        if mutual:
            is_match = True
            target_user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0})
            
            # Create match record
            await db.mutual_matches.insert_one({
                "match_id": f"mm_{uuid.uuid4().hex[:12]}",
                "users": sorted([current_user["user_id"], target_user_id]),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await create_notification(
                user_id=current_user["user_id"],
                notif_type="new_match",
                title="It's a Match!",
                message=f"You and {target_user.get('name', 'someone')} liked each other!",
                data={"matched_user_id": target_user_id, "matched_user_name": target_user.get("name"), "matched_user_photo": target_user.get("profile_photo")}
            )
            
            await create_notification(
                user_id=target_user_id,
                notif_type="new_match",
                title="It's a Match!",
                message=f"You and {current_user.get('name', 'someone')} liked each other!",
                data={"matched_user_id": current_user["user_id"], "matched_user_name": current_user.get("name"), "matched_user_photo": current_user.get("profile_photo")}
            )
    
    return {"action": action, "is_match": is_match}

@api_router.post("/boost")
async def activate_boost(request: Request):
    """Activate profile boost for 30 minutes"""
    current_user = await get_current_user(request)
    
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"boost_active": True, "boost_expires": expires.isoformat()}}
    )
    
    return {"message": "Boost activated", "expires_at": expires.isoformat()}

@api_router.get("/matches")
async def get_matches(request: Request):
    current_user = await get_current_user(request)
    
    my_likes = await db.matches.find(
        {"user_id": current_user["user_id"], "action": {"$in": ["like", "super_like"]}},
        {"_id": 0}
    ).to_list(1000)
    liked_ids = [m["target_user_id"] for m in my_likes]
    
    mutual_matches = await db.matches.find({
        "user_id": {"$in": liked_ids},
        "target_user_id": current_user["user_id"],
        "action": {"$in": ["like", "super_like"]}
    }, {"_id": 0}).to_list(1000)
    
    matched_user_ids = [m["user_id"] for m in mutual_matches]
    matched_users = await db.users.find(
        {"user_id": {"$in": matched_user_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    # Add last message info
    for user in matched_users:
        conv_id = get_conversation_id(current_user["user_id"], user["user_id"])
        last_msg = await db.messages.find_one(
            {"conversation_id": conv_id},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        user["last_message"] = last_msg
    
    return {"matches": matched_users}

@api_router.get("/likes-received")
async def get_likes_received(request: Request):
    """Get users who liked you (premium feature)"""
    current_user = await get_current_user(request)
    
    likes = await db.matches.find({
        "target_user_id": current_user["user_id"],
        "action": {"$in": ["like", "super_like"]}
    }, {"_id": 0}).to_list(100)
    
    # Check if current user has liked them back
    my_likes = await db.matches.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "target_user_id": 1}
    ).to_list(1000)
    my_liked_ids = set(m["target_user_id"] for m in my_likes)
    
    # Get pending likes (not yet mutual)
    pending_ids = [l["user_id"] for l in likes if l["user_id"] not in my_liked_ids]
    
    users = await db.users.find(
        {"user_id": {"$in": pending_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    # Mark super likes
    super_like_ids = set(l["user_id"] for l in likes if l["action"] == "super_like")
    for user in users:
        user["is_super_like"] = user["user_id"] in super_like_ids
    
    return {"likes": users, "count": len(users)}

# ==================== CHAT ENDPOINTS ====================

@api_router.get("/conversations")
async def get_conversations(request: Request):
    current_user = await get_current_user(request)
    
    # Get messages with pagination limit to prevent unbounded query
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["user_id"]},
            {"recipient_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
    
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
    
    other_ids = [c["other_user_id"] for c in conversations.values()]
    users = await db.users.find({"user_id": {"$in": other_ids}}, {"_id": 0, "password_hash": 0}).to_list(100)
    user_map = {u["user_id"]: u for u in users}
    
    result = []
    for conv in conversations.values():
        conv["other_user"] = user_map.get(conv["other_user_id"], {})
        result.append(conv)
    
    result.sort(key=lambda x: x["last_message"].get("created_at", ""), reverse=True)
    return {"conversations": result}

@api_router.get("/chat/{user_id}")
async def get_chat_messages(user_id: str, request: Request):
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    messages = await db.messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # Mark as read and set read_at
    await db.messages.update_many(
        {"conversation_id": conv_id, "recipient_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"messages": messages}

@api_router.post("/chat/{user_id}")
async def send_message(user_id: str, request: Request, message: ChatMessageCreate):
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    my_like = await db.matches.find_one({
        "user_id": current_user["user_id"], "target_user_id": user_id, "action": {"$in": ["like", "super_like"]}
    }, {"_id": 0})
    
    their_like = await db.matches.find_one({
        "user_id": user_id, "target_user_id": current_user["user_id"], "action": {"$in": ["like", "super_like"]}
    }, {"_id": 0})
    
    if not (my_like and their_like):
        raise HTTPException(status_code=403, detail="You can only message matched users")
    
    chat_msg = ChatMessage(
        conversation_id=conv_id,
        sender_id=current_user["user_id"],
        recipient_id=user_id,
        content=message.content,
        message_type=message.message_type,
        media_url=message.media_url
    )
    
    doc = chat_msg.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    
    await create_notification(
        user_id=user_id,
        notif_type="new_message",
        title="New Message",
        message=f"{current_user.get('name', 'Someone')}: {message.content[:50]}...",
        data={"sender_id": current_user["user_id"], "conversation_id": conv_id}
    )
    
    # Send via WebSocket if recipient is online
    if user_id in manager.active_connections:
        await manager.send_personal_message({"type": "new_message", "message": doc}, user_id)
    
    return doc

@api_router.post("/chat/{user_id}/read")
async def mark_messages_read(user_id: str, request: Request):
    """Mark all messages from a user as read and notify them"""
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    read_at = datetime.now(timezone.utc).isoformat()
    result = await db.messages.update_many(
        {"conversation_id": conv_id, "recipient_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": read_at}}
    )
    
    # Notify sender of read receipt
    if user_id in manager.active_connections:
        await manager.send_personal_message({
            "type": "read_receipt",
            "conversation_id": conv_id,
            "read_by": current_user["user_id"],
            "read_at": read_at
        }, user_id)
    
    return {"marked_read": result.modified_count}

@api_router.post("/chat/{user_id}/typing")
async def send_typing_indicator(user_id: str, request: Request, is_typing: bool = True):
    """Send typing indicator to other user"""
    current_user = await get_current_user(request)
    
    if user_id in manager.active_connections:
        await manager.send_personal_message({
            "type": "typing",
            "user_id": current_user["user_id"],
            "is_typing": is_typing
        }, user_id)
    
    return {"sent": True}

# ==================== TRAVEL SCHEDULE ENDPOINTS ====================

@api_router.get("/schedules")
async def get_my_schedules(request: Request):
    current_user = await get_current_user(request)
    schedules = await db.schedules.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("start_date", 1).to_list(100)
    return {"schedules": schedules}

@api_router.post("/schedules")
async def create_schedule(request: Request, schedule_data: TravelScheduleCreate):
    current_user = await get_current_user(request)
    schedule = TravelSchedule(user_id=current_user["user_id"], **schedule_data.model_dump())
    doc = schedule.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.schedules.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, request: Request):
    current_user = await get_current_user(request)
    result = await db.schedules.delete_one({"schedule_id": schedule_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}

@api_router.get("/schedules/user/{user_id}")
async def get_user_schedules(user_id: str, request: Request):
    await get_current_user(request)
    schedules = await db.schedules.find({"user_id": user_id}, {"_id": 0}).sort("start_date", 1).to_list(100)
    return {"schedules": schedules}

@api_router.get("/schedules/nearby")
async def get_nearby_schedules(request: Request, days_ahead: int = 30):
    """Find travelers visiting your area soon"""
    current_user = await get_current_user(request)
    
    if not current_user.get("latitude"):
        return {"schedules": []}
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    future = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
    
    schedules = await db.schedules.find({
        "user_id": {"$ne": current_user["user_id"]},
        "start_date": {"$gte": today, "$lte": future},
        "latitude": {"$exists": True}
    }, {"_id": 0}).to_list(100)
    
    nearby = []
    for sched in schedules:
        if sched.get("latitude"):
            distance = calculate_distance(
                current_user["latitude"], current_user["longitude"],
                sched["latitude"], sched["longitude"]
            )
            if distance <= 100:  # Within 100 miles
                sched["distance"] = distance
                user = await db.users.find_one({"user_id": sched["user_id"]}, {"_id": 0, "password_hash": 0})
                sched["user"] = user
                nearby.append(sched)
    
    return {"schedules": nearby}

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(request: Request, unread_only: bool = False):
    current_user = await get_current_user(request)
    query = {"user_id": current_user["user_id"]}
    if unread_only:
        query["read"] = False
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"notifications": notifications}

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
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
    current_user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    current_user = await get_current_user(request)
    count = await db.notifications.count_documents({"user_id": current_user["user_id"], "read": False})
    return {"count": count}

# ==================== GIF SEARCH (GIPHY) ====================

@api_router.get("/gifs/search")
async def search_gifs(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)):
    """Search for GIFs using GIPHY API"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.giphy.com/v1/gifs/search",
                params={"api_key": GIPHY_API_KEY, "q": q, "limit": limit, "rating": "pg-13"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            gifs = []
            for item in data.get("data", []):
                gifs.append({
                    "id": item["id"],
                    "title": item.get("title", "GIF"),
                    "url": item["url"],
                    "preview_url": item["images"]["fixed_width_small"]["url"],
                    "original_url": item["images"]["original"]["url"],
                    "width": item["images"]["fixed_width"]["width"],
                    "height": item["images"]["fixed_width"]["height"]
                })
            return {"gifs": gifs}
    except Exception as e:
        logger.error(f"GIPHY API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to search GIFs")

@api_router.get("/gifs/trending")
async def get_trending_gifs(limit: int = Query(20, ge=1, le=50)):
    """Get trending GIFs"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.giphy.com/v1/gifs/trending",
                params={"api_key": GIPHY_API_KEY, "limit": limit, "rating": "pg-13"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            gifs = []
            for item in data.get("data", []):
                gifs.append({
                    "id": item["id"],
                    "title": item.get("title", "GIF"),
                    "url": item["url"],
                    "preview_url": item["images"]["fixed_width_small"]["url"],
                    "original_url": item["images"]["original"]["url"]
                })
            return {"gifs": gifs}
    except Exception as e:
        logger.error(f"GIPHY trending error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trending GIFs")

# ==================== MEDIA UPLOAD ====================

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/media/upload")
async def upload_media(request: Request, file: UploadFile = File(...), media_type: str = Form("image")):
    """Upload photo or video for profile or chat"""
    current_user = await get_current_user(request)
    
    # Validate file type
    allowed_image = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    allowed_video = ["video/mp4", "video/quicktime", "video/webm"]
    
    if media_type == "image" and file.content_type not in allowed_image:
        raise HTTPException(status_code=400, detail="Invalid image format")
    if media_type == "video" and file.content_type not in allowed_video:
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    # Check file size (50MB max for video, 10MB for images)
    max_size = 50 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {max_size // (1024*1024)}MB")
    
    # Save file
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Store in database
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "user_id": current_user["user_id"],
        "filename": filename,
        "media_type": media_type,
        "content_type": file.content_type,
        "size": len(content),
        "url": f"/api/media/{filename}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    
    return media_doc

@api_router.get("/media/{filename}")
async def get_media(filename: str):
    """Serve uploaded media files"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    
    with open(filepath, "rb") as f:
        content = f.read()
    
    # Determine content type
    ext = filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "gif": "image/gif", "webp": "image/webp", "mp4": "video/mp4",
        "webm": "video/webm", "mov": "video/quicktime"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return Response(content=content, media_type=content_type)

# ==================== SOCIAL MEDIA LINKS ====================

@api_router.put("/profile/social-links")
async def update_social_links(request: Request):
    """Update user's social media links"""
    current_user = await get_current_user(request)
    data = await request.json()
    
    social_links = {
        "twitter": data.get("twitter", ""),
        "instagram": data.get("instagram", ""),
        "facebook": data.get("facebook", ""),
        "tiktok": data.get("tiktok", ""),
        "snapchat": data.get("snapchat", "")
    }
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"social_links": social_links}}
    )
    
    return {"message": "Social links updated", "social_links": social_links}

@api_router.get("/profile/{user_id}/social-links")
async def get_social_links(user_id: str, request: Request):
    """Get user's social media links"""
    await get_current_user(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "social_links": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"social_links": user.get("social_links", {})}

# ==================== MESSAGE REACTIONS ====================

@api_router.post("/messages/{message_id}/reaction")
async def add_message_reaction(message_id: str, request: Request):
    """Add emoji reaction to a message"""
    current_user = await get_current_user(request)
    data = await request.json()
    emoji = data.get("emoji")
    
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")
    
    # Valid reactions
    valid_emojis = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "💯", "🎉"]
    if emoji not in valid_emojis:
        raise HTTPException(status_code=400, detail="Invalid reaction emoji")
    
    # Update message with reaction
    result = await db.messages.update_one(
        {"message_id": message_id},
        {"$addToSet": {"reactions": {"user_id": current_user["user_id"], "emoji": emoji, "created_at": datetime.now(timezone.utc).isoformat()}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Send real-time notification
    message = await db.messages.find_one({"message_id": message_id}, {"_id": 0})
    if message and message.get("sender_id") != current_user["user_id"]:
        await manager.send_personal_message({
            "type": "reaction",
            "message_id": message_id,
            "user_id": current_user["user_id"],
            "emoji": emoji
        }, message["sender_id"])
    
    return {"message": "Reaction added", "emoji": emoji}

@api_router.delete("/messages/{message_id}/reaction")
async def remove_message_reaction(message_id: str, request: Request):
    """Remove emoji reaction from a message"""
    current_user = await get_current_user(request)
    
    await db.messages.update_one(
        {"message_id": message_id},
        {"$pull": {"reactions": {"user_id": current_user["user_id"]}}}
    )
    
    return {"message": "Reaction removed"}

# ==================== ENHANCED CHAT WITH MEDIA ====================

@api_router.post("/chat/{user_id}/media")
async def send_media_message(user_id: str, request: Request):
    """Send a message with media (photo/video/GIF)"""
    current_user = await get_current_user(request)
    data = await request.json()
    
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conv_id,
        "sender_id": current_user["user_id"],
        "recipient_id": user_id,
        "content": data.get("content", ""),
        "message_type": data.get("message_type", "text"),  # text, image, video, gif
        "media_url": data.get("media_url"),
        "gif_data": data.get("gif_data"),  # For GIFs: {id, preview_url, original_url}
        "reactions": [],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    message.pop("_id", None)
    
    # Send via WebSocket
    await manager.send_personal_message({"type": "new_message", "message": message}, user_id)
    
    # Create notification
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": "new_message",
        "content": f"{current_user['name']} sent you a {'photo' if message['message_type'] == 'image' else 'video' if message['message_type'] == 'video' else 'GIF' if message['message_type'] == 'gif' else 'message'}",
        "from_user_id": current_user["user_id"],
        "from_user_name": current_user["name"],
        "from_user_photo": current_user.get("profile_photo"),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    notification.pop("_id", None)
    await manager.send_personal_message({"type": "notification", "notification": notification}, user_id)
    
    return message

# ==================== NOTIFICATION PREFERENCES ====================

@api_router.get("/settings/notifications")
async def get_notification_settings(request: Request):
    """Get user's notification preferences"""
    current_user = await get_current_user(request)
    
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0, "notification_settings": 1})
    
    # Default settings
    defaults = {
        "new_matches": True,
        "new_messages": True,
        "super_likes": True,
        "likes_received": True,
        "profile_views": False,
        "marketing": False,
        "sound": True,
        "vibration": True
    }
    
    return {"settings": user.get("notification_settings", defaults)}

@api_router.put("/settings/notifications")
async def update_notification_settings(request: Request):
    """Update user's notification preferences"""
    current_user = await get_current_user(request)
    data = await request.json()
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"notification_settings": data}}
    )
    
    return {"message": "Notification settings updated", "settings": data}

# ==================== USER ONLINE STATUS ====================

@api_router.get("/users/online-status")
async def get_online_users(request: Request):
    """Get online status of matched users"""
    current_user = await get_current_user(request)
    
    # Get matched users
    matches = await db.mutual_matches.find(
        {"$or": [{"user_id": current_user["user_id"]}, {"target_user_id": current_user["user_id"]}]}
    ).to_list(100)
    
    matched_user_ids = set()
    for m in matches:
        if m["user_id"] == current_user["user_id"]:
            matched_user_ids.add(m["target_user_id"])
        else:
            matched_user_ids.add(m["user_id"])
    
    # Get online status
    users = await db.users.find(
        {"user_id": {"$in": list(matched_user_ids)}},
        {"_id": 0, "user_id": 1, "name": 1, "profile_photo": 1, "online": 1, "last_active": 1}
    ).to_list(100)
    
    # Check WebSocket connections for real-time status
    for user in users:
        user["online"] = manager.is_online(user["user_id"])
    
    return {"users": users}

# ==================== PROFILE VIEWS ====================

@api_router.post("/profile/{user_id}/view")
async def record_profile_view(user_id: str, request: Request):
    """Record when a user views another profile"""
    current_user = await get_current_user(request)
    
    if current_user["user_id"] == user_id:
        return {"message": "Cannot view own profile"}
    
    view = {
        "view_id": f"view_{uuid.uuid4().hex[:12]}",
        "viewer_id": current_user["user_id"],
        "viewed_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.profile_views.insert_one(view)
    
    # Send notification if enabled
    viewed_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "notification_settings": 1})
    if viewed_user and viewed_user.get("notification_settings", {}).get("profile_views", False):
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": "profile_view",
            "content": f"{current_user['name']} viewed your profile",
            "from_user_id": current_user["user_id"],
            "from_user_name": current_user["name"],
            "from_user_photo": current_user.get("profile_photo"),
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        notification.pop("_id", None)
        await manager.send_personal_message({"type": "notification", "notification": notification}, user_id)
    
    return {"message": "View recorded"}

@api_router.get("/profile/views")
async def get_profile_views(request: Request, days: int = 7):
    """Get users who viewed your profile"""
    current_user = await get_current_user(request)
    
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    views = await db.profile_views.find(
        {"viewed_id": current_user["user_id"], "created_at": {"$gte": since}}
    ).sort("created_at", -1).to_list(50)
    
    # Get viewer details
    viewer_ids = list(set(v["viewer_id"] for v in views))
    viewers = await db.users.find(
        {"user_id": {"$in": viewer_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(50)
    
    viewers_map = {u["user_id"]: u for u in viewers}
    
    result = []
    for view in views:
        viewer = viewers_map.get(view["viewer_id"])
        if viewer:
            result.append({
                "viewer": viewer,
                "viewed_at": view["created_at"]
            })
    
    return {"views": result, "count": len(result)}

# ==================== WEBSOCKET ====================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    await db.users.update_one({"user_id": user_id}, {"$set": {"online": True}})
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                recipient_id = data.get("recipient_id")
                content = data.get("content")
                message_type = data.get("message_type", "text")
                media_url = data.get("media_url")
                gif_data = data.get("gif_data")
                
                conv_id = get_conversation_id(user_id, recipient_id)
                
                message = {
                    "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                    "conversation_id": conv_id,
                    "sender_id": user_id,
                    "recipient_id": recipient_id,
                    "content": content,
                    "message_type": message_type,
                    "media_url": media_url,
                    "gif_data": gif_data,
                    "reactions": [],
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.messages.insert_one(message)
                message.pop("_id", None)
                
                await manager.send_personal_message({"type": "new_message", "message": message}, recipient_id)
                await websocket.send_json({"type": "message_sent", "message": message})
            
            elif data.get("type") == "typing":
                recipient_id = data.get("recipient_id")
                is_typing = data.get("is_typing", True)
                await manager.send_typing_indicator(user_id, recipient_id, is_typing)
            
            elif data.get("type") == "reaction":
                message_id = data.get("message_id")
                emoji = data.get("emoji")
                
                await db.messages.update_one(
                    {"message_id": message_id},
                    {"$addToSet": {"reactions": {"user_id": user_id, "emoji": emoji, "created_at": datetime.now(timezone.utc).isoformat()}}}
                )
                
                msg = await db.messages.find_one({"message_id": message_id}, {"_id": 0, "sender_id": 1})
                if msg and msg["sender_id"] != user_id:
                    await manager.send_personal_message({
                        "type": "reaction",
                        "message_id": message_id,
                        "user_id": user_id,
                        "emoji": emoji
                    }, msg["sender_id"])
            
            elif data.get("type") == "read":
                conv_id = data.get("conversation_id")
                sender_id = data.get("sender_id")
                read_at = datetime.now(timezone.utc).isoformat()
                
                await db.messages.update_many(
                    {"conversation_id": conv_id, "sender_id": sender_id, "read": False},
                    {"$set": {"read": True, "read_at": read_at}}
                )
                
                await manager.send_personal_message({
                    "type": "read_receipt",
                    "conversation_id": conv_id,
                    "read_by": user_id,
                    "read_at": read_at
                }, sender_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"online": False, "last_active": datetime.now(timezone.utc).isoformat()}}
        )
        await manager.broadcast_status(user_id, False)

# Include the router
app.include_router(api_router)

# CORS: Use environment variable for dynamic origin configuration
# In production, set CORS_ORIGINS env var with comma-separated domains (or "*" for all)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
