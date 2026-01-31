"""Helper functions and utilities."""
from fastapi import Request, HTTPException
from datetime import datetime, timezone
from math import radians, cos, sin, asin, sqrt
from services.database import db
from services.websocket import manager
from models.schemas import Notification


async def get_current_user(request: Request) -> dict:
    """Get current authenticated user from session token."""
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
    """Generate consistent conversation ID from two user IDs."""
    sorted_ids = sorted([user1_id, user2_id])
    return f"conv_{sorted_ids[0]}_{sorted_ids[1]}"


async def create_notification(user_id: str, notif_type: str, title: str, message: str, data: dict = {}):
    """Create and send a notification to a user."""
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
    """Calculate distance in miles between two coordinates using Haversine formula."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    miles = 3956 * c
    return round(miles, 1)


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
