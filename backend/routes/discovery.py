"""Discovery and matching routes."""
from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid

from services.database import db
from services.websocket import manager
from models.schemas import Match
from utils.helpers import get_current_user, calculate_distance, create_notification

router = APIRouter(tags=["discovery"])


async def check_hot_traveler(user_id: str, target_lat: float = None, target_lon: float = None) -> dict:
    """Check if user is a hot traveler (has active travel schedule in the area)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
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
    """Batch check hot traveler status for multiple users - fixes N+1 query."""
    if not user_ids:
        return {}
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    active_schedules = await db.schedules.find({
        "user_id": {"$in": user_ids},
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }, {"_id": 0}).to_list(None)
    
    hot_traveler_map = {}
    for schedule in active_schedules:
        user_id = schedule["user_id"]
        if user_id not in hot_traveler_map:
            hot_traveler_map[user_id] = {
                "is_hot_traveler": True,
                "traveling_to": schedule.get("destination"),
                "trip_title": schedule.get("title"),
                "trip_ends": schedule.get("end_date")
            }
    
    result = {}
    for user_id in user_ids:
        result[user_id] = hot_traveler_map.get(user_id, {"is_hot_traveler": False})
    
    return result


@router.get("/discover")
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
    """Discover potential matches."""
    current_user = await get_current_user(request)
    
    query = {"user_id": {"$ne": current_user["user_id"]}, "onboarding_complete": True}
    
    if professions:
        profession_list = [p.strip().lower() for p in professions.split(",")]
        query["profession"] = {"$in": profession_list}
    
    if min_age:
        query["age"] = {"$gte": min_age}
    if max_age:
        query.setdefault("age", {})["$lte"] = max_age
    
    acted_users = await db.matches.find(
        {"user_id": current_user["user_id"]}, 
        {"_id": 0, "target_user_id": 1}
    ).sort("created_at", -1).limit(500).to_list(500)
    acted_ids = [m["target_user_id"] for m in acted_users]
    if acted_ids:
        query["user_id"]["$nin"] = acted_ids
    
    pipeline = [
        {"$match": query},
        {"$addFields": {"priority": {"$cond": [{"$eq": ["$boost_active", True]}, 1, 0]}}},
        {"$sort": {"priority": -1, "last_active": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$project": {"_id": 0, "password_hash": 0}}
    ]
    
    users = await db.users.aggregate(pipeline).to_list(limit)
    
    for user in users:
        if current_user.get("latitude") and user.get("latitude"):
            user["distance"] = calculate_distance(
                current_user["latitude"], current_user["longitude"],
                user["latitude"], user["longitude"]
            )
    
    user_ids = [u["user_id"] for u in users]
    hot_traveler_map = await batch_check_hot_travelers(user_ids)
    for user in users:
        user.update(hot_traveler_map.get(user["user_id"], {"is_hot_traveler": False}))
    
    if max_distance and current_user.get("latitude"):
        users = [u for u in users if u.get("distance", 0) <= max_distance]
    
    if hot_travelers_only:
        users = [u for u in users if u.get("is_hot_traveler")]
    
    users.sort(key=lambda x: (not x.get("is_hot_traveler", False), -x.get("priority", 0)))
    
    hot_count = sum(1 for u in users if u.get("is_hot_traveler"))
    return {"users": users, "count": len(users), "hot_travelers_count": hot_count}


@router.get("/discover/nearby")
async def get_nearby_users(request: Request, radius: int = 50):
    """Get users within a radius (miles) for map view."""
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
    
    nearby_user_ids = [u["user_id"] for u in nearby]
    hot_traveler_map = await batch_check_hot_travelers(nearby_user_ids)
    for user in nearby:
        user.update(hot_traveler_map.get(user["user_id"], {"is_hot_traveler": False}))
    
    nearby.sort(key=lambda x: (not x.get("is_hot_traveler", False), x.get("distance", 999)))
    
    hot_count = sum(1 for u in nearby if u.get("is_hot_traveler"))
    return {"users": nearby, "count": len(nearby), "hot_travelers_count": hot_count}


@router.post("/discover/action")
async def match_action(request: Request, target_user_id: str, action: str):
    """Like, super like, or pass on a user."""
    current_user = await get_current_user(request)
    
    if action not in ["like", "super_like", "pass"]:
        raise HTTPException(status_code=400, detail="Action must be 'like', 'super_like', or 'pass'")
    
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
        if action == "super_like":
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
                data={
                    "matched_user_id": target_user_id,
                    "matched_user_name": target_user.get("name"),
                    "matched_user_photo": target_user.get("profile_photo")
                }
            )
            
            await create_notification(
                user_id=target_user_id,
                notif_type="new_match",
                title="It's a Match!",
                message=f"You and {current_user.get('name', 'someone')} liked each other!",
                data={
                    "matched_user_id": current_user["user_id"],
                    "matched_user_name": current_user.get("name"),
                    "matched_user_photo": current_user.get("profile_photo")
                }
            )
    
    return {"action": action, "is_match": is_match}


@router.post("/boost")
async def activate_boost(request: Request):
    """Activate profile boost for 30 minutes."""
    current_user = await get_current_user(request)
    
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"boost_active": True, "boost_expires": expires.isoformat()}}
    )
    
    return {"message": "Boost activated", "expires_at": expires.isoformat()}


@router.get("/matches")
async def get_matches(request: Request):
    """Get mutual matches."""
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
    
    from utils.helpers import get_conversation_id
    for user in matched_users:
        conv_id = get_conversation_id(current_user["user_id"], user["user_id"])
        last_msg = await db.messages.find_one(
            {"conversation_id": conv_id},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        user["last_message"] = last_msg
    
    return {"matches": matched_users}


@router.get("/likes-received")
async def get_likes_received(request: Request):
    """Get users who liked you (premium feature)."""
    current_user = await get_current_user(request)
    
    likes = await db.matches.find({
        "target_user_id": current_user["user_id"],
        "action": {"$in": ["like", "super_like"]}
    }, {"_id": 0}).to_list(100)
    
    my_likes = await db.matches.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "target_user_id": 1}
    ).to_list(1000)
    my_liked_ids = set(m["target_user_id"] for m in my_likes)
    
    pending_ids = [l["user_id"] for l in likes if l["user_id"] not in my_liked_ids]
    
    users = await db.users.find(
        {"user_id": {"$in": pending_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    super_like_ids = set(l["user_id"] for l in likes if l["action"] == "super_like")
    for user in users:
        user["is_super_like"] = user["user_id"] in super_like_ids
    
    return {"likes": users, "count": len(users)}


@router.get("/users/online-status")
async def get_online_users(request: Request):
    """Get online status of matched users."""
    current_user = await get_current_user(request)
    
    matches = await db.mutual_matches.find(
        {"$or": [{"user_id": current_user["user_id"]}, {"target_user_id": current_user["user_id"]}]}
    ).to_list(100)
    
    matched_user_ids = set()
    for m in matches:
        if m.get("user_id") == current_user["user_id"]:
            matched_user_ids.add(m.get("target_user_id"))
        else:
            matched_user_ids.add(m.get("user_id"))
    
    users = await db.users.find(
        {"user_id": {"$in": list(matched_user_ids)}},
        {"_id": 0, "user_id": 1, "name": 1, "profile_photo": 1, "online": 1, "last_active": 1}
    ).to_list(100)
    
    for user in users:
        user["online"] = manager.is_online(user["user_id"])
    
    return {"users": users}
