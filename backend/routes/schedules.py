"""Travel schedule routes."""
from fastapi import APIRouter, HTTPException, Request, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

from services.database import db
from services.websocket import manager
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
    
    # Find overlapping travelers and send notifications
    if doc.get("latitude") and doc.get("longitude"):
        await notify_overlapping_travelers(current_user, doc)
    
    return doc


async def notify_overlapping_travelers(current_user: dict, new_schedule: dict):
    """Notify users who have overlapping schedules at the same destination."""
    # Find schedules that overlap in time and location
    overlapping = await db.schedules.find({
        "user_id": {"$ne": current_user["user_id"]},
        "latitude": {"$exists": True, "$ne": None},
        "start_date": {"$lte": new_schedule["end_date"]},
        "end_date": {"$gte": new_schedule["start_date"]}
    }, {"_id": 0}).to_list(100)
    
    notified_users = set()
    
    for sched in overlapping:
        if not sched.get("latitude"):
            continue
        
        # Check if destinations are within 50 miles
        distance = calculate_distance(
            new_schedule["latitude"], new_schedule["longitude"],
            sched["latitude"], sched["longitude"]
        )
        
        if distance <= 50 and sched["user_id"] not in notified_users:
            notified_users.add(sched["user_id"])
            
            # Create notification
            notification = {
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": sched["user_id"],
                "type": "trip_overlap",
                "title": "Trip Match! 🎉",
                "content": f"{current_user['name']} is planning to visit {new_schedule['destination']} while you're there!",
                "from_user_id": current_user["user_id"],
                "from_user_name": current_user["name"],
                "from_user_photo": current_user.get("profile_photo"),
                "trip_data": {
                    "destination": new_schedule["destination"],
                    "start_date": new_schedule["start_date"],
                    "end_date": new_schedule["end_date"]
                },
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
            notification.pop("_id", None)
            
            # Send real-time notification
            await manager.send_personal_message({
                "type": "notification",
                "notification": notification
            }, sched["user_id"])


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


@router.post("/plan-trip")
async def plan_trip_preview(request: Request):
    """
    Preview potential meetups for a planned trip BEFORE creating the schedule.
    
    This is the "Trip Planning Mode" - shows who's already there or will be there
    during your planned dates.
    """
    current_user = await get_current_user(request)
    data = await request.json()
    
    destination = data.get("destination")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    radius_miles = data.get("radius_miles", 50)
    
    if not all([latitude, longitude, start_date, end_date]):
        raise HTTPException(status_code=400, detail="latitude, longitude, start_date, end_date required")
    
    # Find users who live at that destination
    locals_at_destination = await db.users.find({
        "user_id": {"$ne": current_user["user_id"]},
        "latitude": {"$exists": True, "$ne": None},
        "onboarding_complete": True
    }, {"_id": 0, "password_hash": 0}).to_list(200)
    
    # Filter by distance
    locals_nearby = []
    for user in locals_at_destination:
        if user.get("latitude"):
            distance = calculate_distance(latitude, longitude, user["latitude"], user["longitude"])
            if distance <= radius_miles:
                user["distance_miles"] = round(distance, 1)
                user["match_type"] = "local"
                user["match_reason"] = f"Lives in {destination or 'this area'}"
                locals_nearby.append(user)
    
    # Find travelers with overlapping schedules at that destination
    overlapping_schedules = await db.schedules.find({
        "user_id": {"$ne": current_user["user_id"]},
        "latitude": {"$exists": True, "$ne": None},
        "start_date": {"$lte": end_date},
        "end_date": {"$gte": start_date}
    }, {"_id": 0}).to_list(200)
    
    travelers_there = []
    traveler_ids = set()
    
    for sched in overlapping_schedules:
        if not sched.get("latitude"):
            continue
        
        distance = calculate_distance(latitude, longitude, sched["latitude"], sched["longitude"])
        
        if distance <= radius_miles and sched["user_id"] not in traveler_ids:
            traveler_ids.add(sched["user_id"])
            
            # Determine overlap type
            sched_start = sched["start_date"]
            sched_end = sched["end_date"]
            
            if sched_start <= start_date and sched_end >= end_date:
                overlap_text = "There your entire trip"
            elif sched_start <= start_date:
                overlap_text = f"There until {sched_end}"
            elif sched_end >= end_date:
                overlap_text = f"Arriving {sched_start}"
            else:
                overlap_text = f"{sched_start} to {sched_end}"
            
            # Get user profile
            user = await db.users.find_one(
                {"user_id": sched["user_id"]},
                {"_id": 0, "password_hash": 0}
            )
            
            if user:
                user["match_type"] = "traveler"
                user["match_reason"] = f"Also visiting: {overlap_text}"
                user["trip_destination"] = sched.get("destination")
                user["trip_dates"] = f"{sched_start} - {sched_end}"
                user["distance_miles"] = round(distance, 1)
                travelers_there.append(user)
    
    # Remove duplicates (users who are both local and traveling)
    local_ids = set(u["user_id"] for u in locals_nearby)
    travelers_there = [t for t in travelers_there if t["user_id"] not in local_ids]
    
    # Combine and sort
    all_potential_meetups = locals_nearby + travelers_there
    all_potential_meetups.sort(key=lambda x: x.get("distance_miles", 999))
    
    return {
        "destination": destination,
        "dates": f"{start_date} to {end_date}",
        "potential_meetups": all_potential_meetups,
        "locals_count": len(locals_nearby),
        "travelers_count": len(travelers_there),
        "total_count": len(all_potential_meetups),
        "message": f"Found {len(all_potential_meetups)} potential meetups at {destination or 'this destination'}!"
    }


@router.get("/trip-matches")
async def get_trip_matches(request: Request):
    """
    Get all potential meetup opportunities based on your scheduled trips.
    
    This aggregates matches for ALL your upcoming trips.
    """
    current_user = await get_current_user(request)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get user's upcoming schedules
    my_schedules = await db.schedules.find({
        "user_id": current_user["user_id"],
        "end_date": {"$gte": today},
        "latitude": {"$exists": True, "$ne": None}
    }, {"_id": 0}).sort("start_date", 1).to_list(20)
    
    if not my_schedules:
        return {
            "trips": [],
            "total_matches": 0,
            "message": "Add a trip with location to see potential meetups"
        }
    
    trips_with_matches = []
    total_matches = 0
    
    for schedule in my_schedules:
        # Find overlapping schedules
        overlapping = await db.schedules.find({
            "user_id": {"$ne": current_user["user_id"]},
            "latitude": {"$exists": True, "$ne": None},
            "start_date": {"$lte": schedule["end_date"]},
            "end_date": {"$gte": schedule["start_date"]}
        }, {"_id": 0}).to_list(100)
        
        matches = []
        matched_ids = set()
        
        for other_sched in overlapping:
            if not other_sched.get("latitude"):
                continue
            
            distance = calculate_distance(
                schedule["latitude"], schedule["longitude"],
                other_sched["latitude"], other_sched["longitude"]
            )
            
            if distance <= 50 and other_sched["user_id"] not in matched_ids:
                matched_ids.add(other_sched["user_id"])
                
                user = await db.users.find_one(
                    {"user_id": other_sched["user_id"]},
                    {"_id": 0, "password_hash": 0}
                )
                
                if user:
                    matches.append({
                        "user": user,
                        "their_destination": other_sched.get("destination"),
                        "their_dates": f"{other_sched['start_date']} - {other_sched['end_date']}",
                        "distance_miles": round(distance, 1)
                    })
        
        trips_with_matches.append({
            "schedule": schedule,
            "matches": matches,
            "match_count": len(matches)
        })
        total_matches += len(matches)
    
    return {
        "trips": trips_with_matches,
        "total_matches": total_matches,
        "message": f"Found {total_matches} potential meetups across {len(my_schedules)} trips!"
    }
