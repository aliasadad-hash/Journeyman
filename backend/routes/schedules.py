"""Travel schedule routes."""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta

from services.database import db
from models.schemas import TravelSchedule, TravelScheduleCreate
from utils.helpers import get_current_user, calculate_distance

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("")
async def get_my_schedules(request: Request):
    """Get current user's travel schedules."""
    current_user = await get_current_user(request)
    schedules = await db.schedules.find(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    ).sort("start_date", 1).to_list(100)
    return {"schedules": schedules}


@router.post("")
async def create_schedule(request: Request, schedule_data: TravelScheduleCreate):
    """Create a new travel schedule."""
    current_user = await get_current_user(request)
    schedule = TravelSchedule(user_id=current_user["user_id"], **schedule_data.model_dump())
    doc = schedule.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.schedules.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, request: Request):
    """Delete a travel schedule."""
    current_user = await get_current_user(request)
    result = await db.schedules.delete_one({
        "schedule_id": schedule_id, "user_id": current_user["user_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted"}


@router.get("/user/{user_id}")
async def get_user_schedules(user_id: str, request: Request):
    """Get another user's public schedules."""
    await get_current_user(request)
    schedules = await db.schedules.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("start_date", 1).to_list(100)
    return {"schedules": schedules}


@router.get("/nearby")
async def get_nearby_schedules(request: Request, days_ahead: int = 30):
    """Find travelers visiting your area soon."""
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
            if distance <= 100:
                sched["distance"] = distance
                user = await db.users.find_one(
                    {"user_id": sched["user_id"]}, {"_id": 0, "password_hash": 0}
                )
                sched["user"] = user
                nearby.append(sched)
    
    return {"schedules": nearby}
