"""Profile management routes."""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
import uuid

from services.database import db
from services.websocket import manager
from models.schemas import ProfileUpdate, PhotoUpload
from utils.helpers import get_current_user, calculate_distance, ICEBREAKER_PROMPTS

router = APIRouter(tags=["profile"])


@router.get("/profile")
async def get_profile(request: Request):
    """Get current user profile."""
    user = await get_current_user(request)
    return user


@router.put("/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    """Update current user profile."""
    user = await get_current_user(request)
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user


@router.post("/profile/complete-onboarding")
async def complete_onboarding(request: Request, profile_data: ProfileUpdate):
    """Complete onboarding and update profile."""
    user = await get_current_user(request)
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_data["onboarding_complete"] = True
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated_user


@router.post("/profile/photo")
async def upload_photo(request: Request, photo: PhotoUpload):
    """Upload a profile photo."""
    user = await get_current_user(request)
    photos = user.get("photos", [])
    photos.append(photo.photo_data)
    
    update_data = {"photos": photos}
    if photo.is_primary or not user.get("profile_photo"):
        update_data["profile_photo"] = photo.photo_data
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    return {"message": "Photo uploaded successfully", "photo_count": len(photos)}


@router.delete("/profile/photo/{photo_index}")
async def delete_photo(photo_index: int, request: Request):
    """Delete a profile photo."""
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


@router.post("/profile/verify")
async def request_verification(request: Request, verification_type: str):
    """Request profile verification."""
    user = await get_current_user(request)
    if verification_type not in ["photo", "id", "phone"]:
        raise HTTPException(status_code=400, detail="Invalid verification type")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"verified": True, "verification_type": verification_type}}
    )
    return {"message": "Verification successful", "verified": True}


@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    """Get another user's profile."""
    current_user = await get_current_user(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user.get("latitude") and user.get("latitude"):
        user["distance"] = calculate_distance(
            current_user["latitude"], current_user["longitude"],
            user["latitude"], user["longitude"]
        )
    return user


@router.get("/icebreakers/prompts")
async def get_icebreaker_prompts():
    """Get available icebreaker prompts."""
    return {"prompts": ICEBREAKER_PROMPTS}


@router.put("/profile/social-links")
async def update_social_links(request: Request):
    """Update user's social media links."""
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


@router.get("/profile/{user_id}/social-links")
async def get_social_links(user_id: str, request: Request):
    """Get user's social media links."""
    await get_current_user(request)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "social_links": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"social_links": user.get("social_links", {})}


@router.post("/profile/{user_id}/view")
async def record_profile_view(user_id: str, request: Request):
    """Record when a user views another profile."""
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


@router.get("/profile/views")
async def get_profile_views(request: Request, days: int = 7):
    """Get users who viewed your profile."""
    current_user = await get_current_user(request)
    
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    views = await db.profile_views.find(
        {"viewed_id": current_user["user_id"], "created_at": {"$gte": since}}
    ).sort("created_at", -1).to_list(50)
    
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
            result.append({"viewer": viewer, "viewed_at": view["created_at"]})
    
    return {"views": result, "count": len(result)}
