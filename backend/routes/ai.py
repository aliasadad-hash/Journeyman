"""AI-powered feature routes."""
from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel

from services.database import db
from services.ai_features import bio_generator, ice_breaker_generator, smart_matcher, first_message_generator
from utils.helpers import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


class BioGenerateRequest(BaseModel):
    style: str = "confident"  # confident, playful, mysterious, romantic


class BioGenerateResponse(BaseModel):
    bio: str
    style: str


@router.post("/generate-bio", response_model=BioGenerateResponse)
async def generate_bio(request: Request, body: BioGenerateRequest):
    """
    Generate an AI-powered dating profile bio using GPT-5.2.
    
    Styles available: confident, playful, mysterious, romantic
    """
    user = await get_current_user(request)
    
    valid_styles = ["confident", "playful", "mysterious", "romantic"]
    if body.style not in valid_styles:
        raise HTTPException(status_code=400, detail=f"Style must be one of: {', '.join(valid_styles)}")
    
    try:
        bio = await bio_generator.generate_bio(
            name=user.get("name", "Traveler"),
            profession=user.get("profession", "traveler"),
            interests=user.get("interests", []),
            age=user.get("age"),
            style=body.style
        )
        
        return BioGenerateResponse(bio=bio, style=body.style)
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate bio. Please try again.")


@router.post("/save-generated-bio")
async def save_generated_bio(request: Request):
    """Save a generated bio to the user's profile."""
    user = await get_current_user(request)
    data = await request.json()
    bio = data.get("bio")
    
    if not bio:
        raise HTTPException(status_code=400, detail="Bio text required")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"bio": bio}}
    )
    
    return {"message": "Bio saved successfully", "bio": bio}


class IceBreakersResponse(BaseModel):
    ice_breakers: List[str]
    match_name: str


@router.get("/ice-breakers/{user_id}", response_model=IceBreakersResponse)
async def get_ice_breakers(user_id: str, request: Request):
    """
    Generate personalized ice breaker conversation starters using Claude.
    
    Returns 3 custom openers based on profile compatibility.
    """
    current_user = await get_current_user(request)
    
    # Get target user profile
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if they're matched
    my_like = await db.matches.find_one({
        "user_id": current_user["user_id"],
        "target_user_id": user_id,
        "action": {"$in": ["like", "super_like"]}
    })
    their_like = await db.matches.find_one({
        "user_id": user_id,
        "target_user_id": current_user["user_id"],
        "action": {"$in": ["like", "super_like"]}
    })
    
    if not (my_like and their_like):
        raise HTTPException(status_code=403, detail="You can only get ice breakers for matches")
    
    try:
        ice_breakers = await ice_breaker_generator.generate_ice_breakers(
            your_profile=current_user,
            their_profile=target_user,
            count=3
        )
        
        return IceBreakersResponse(
            ice_breakers=ice_breakers,
            match_name=target_user.get("name", "").split()[0] if target_user.get("name") else "your match"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate ice breakers. Please try again.")


class CompatibilityResponse(BaseModel):
    score: int
    reasons: List[str]
    conversation_topics: List[str]
    user_name: str


@router.get("/compatibility/{user_id}", response_model=CompatibilityResponse)
async def get_compatibility(user_id: str, request: Request):
    """
    Calculate AI-powered compatibility score using Gemini.
    
    Returns a score (0-100), reasons, and suggested conversation topics.
    """
    current_user = await get_current_user(request)
    
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot calculate compatibility with yourself")
    
    # Get target user profile
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        result = await smart_matcher.calculate_compatibility(
            user1_profile=current_user,
            user2_profile=target_user
        )
        
        return CompatibilityResponse(
            score=result["score"],
            reasons=result["reasons"],
            conversation_topics=result["conversation_topics"],
            user_name=target_user.get("name", "").split()[0] if target_user.get("name") else "User"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate compatibility. Please try again.")


@router.get("/compatibility-batch")
async def get_batch_compatibility(request: Request, user_ids: str):
    """
    Get compatibility scores for multiple users at once.
    
    Pass comma-separated user IDs in the query parameter.
    Limited to 5 users per request.
    """
    current_user = await get_current_user(request)
    
    ids = [uid.strip() for uid in user_ids.split(",") if uid.strip()]
    ids = [uid for uid in ids if uid != current_user["user_id"]][:5]
    
    if not ids:
        return {"compatibilities": []}
    
    results = []
    for user_id in ids:
        target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if target_user:
            try:
                result = await smart_matcher.calculate_compatibility(
                    user1_profile=current_user,
                    user2_profile=target_user
                )
                results.append({
                    "user_id": user_id,
                    "user_name": target_user.get("name", "").split()[0] if target_user.get("name") else "User",
                    "score": result["score"],
                    "top_reason": result["reasons"][0] if result["reasons"] else "Compatible travelers"
                })
            except:
                results.append({
                    "user_id": user_id,
                    "user_name": target_user.get("name", "").split()[0] if target_user.get("name") else "User",
                    "score": 75,
                    "top_reason": "Fellow traveler"
                })
    
    return {"compatibilities": results}


class FirstMessageRequest(BaseModel):
    tone: str = "friendly"  # friendly, flirty, witty, sincere


class FirstMessageResponse(BaseModel):
    message: str
    talking_points: List[str]
    confidence_score: int
    why_it_works: str
    their_name: str
    shared_interests: List[str]


@router.post("/first-message/{user_id}", response_model=FirstMessageResponse)
async def generate_first_message(user_id: str, request: Request, body: FirstMessageRequest):
    """
    Generate the perfect AI-powered first message for a new match.
    
    Combines compatibility analysis + ice breaker techniques to craft
    a personalized opening message that's likely to get a response.
    
    Tones available: friendly, flirty, witty, sincere
    """
    current_user = await get_current_user(request)
    
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    
    # Validate tone
    valid_tones = ["friendly", "flirty", "witty", "sincere"]
    if body.tone not in valid_tones:
        raise HTTPException(status_code=400, detail=f"Tone must be one of: {', '.join(valid_tones)}")
    
    # Get target user profile
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if they're matched (both liked each other)
    my_like = await db.matches.find_one({
        "user_id": current_user["user_id"],
        "target_user_id": user_id,
        "action": {"$in": ["like", "super_like"]}
    })
    their_like = await db.matches.find_one({
        "user_id": user_id,
        "target_user_id": current_user["user_id"],
        "action": {"$in": ["like", "super_like"]}
    })
    
    if not (my_like and their_like):
        raise HTTPException(status_code=403, detail="You can only generate messages for matches")
    
    try:
        result = await first_message_generator.generate_first_message(
            your_profile=current_user,
            their_profile=target_user,
            tone=body.tone
        )
        
        return FirstMessageResponse(
            message=result["message"],
            talking_points=result["talking_points"],
            confidence_score=result["confidence_score"],
            why_it_works=result["why_it_works"],
            their_name=result["their_name"],
            shared_interests=result["shared_interests"]
        )
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate message. Please try again.")
