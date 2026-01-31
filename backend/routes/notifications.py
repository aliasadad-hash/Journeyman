"""Notification routes."""
from fastapi import APIRouter, HTTPException, Request

from services.database import db
from utils.helpers import get_current_user

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
async def get_notifications(request: Request, unread_only: bool = False):
    """Get user's notifications."""
    current_user = await get_current_user(request)
    query = {"user_id": current_user["user_id"]}
    if unread_only:
        query["read"] = False
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"notifications": notifications}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark a notification as read."""
    current_user = await get_current_user(request)
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read."""
    current_user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}


@router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    """Get count of unread notifications."""
    current_user = await get_current_user(request)
    count = await db.notifications.count_documents({
        "user_id": current_user["user_id"], "read": False
    })
    return {"count": count}


@router.get("/settings/notifications")
async def get_notification_settings(request: Request):
    """Get user's notification preferences."""
    current_user = await get_current_user(request)
    
    user = await db.users.find_one(
        {"user_id": current_user["user_id"]}, {"_id": 0, "notification_settings": 1}
    )
    
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


@router.put("/settings/notifications")
async def update_notification_settings(request: Request):
    """Update user's notification preferences."""
    current_user = await get_current_user(request)
    data = await request.json()
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"notification_settings": data}}
    )
    
    return {"message": "Notification settings updated", "settings": data}
