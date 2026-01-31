"""Authentication routes."""
from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import uuid
import hashlib
import httpx

from services.database import db, AUTH_SERVICE_URL
from models.schemas import UserCreate, UserLogin
from utils.helpers import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/session")
async def create_session(request: Request, response: Response):
    """Create session from Google OAuth."""
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
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid session")
    
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data.get("name", existing_user.get("name")),
                "picture": user_data.get("picture", existing_user.get("picture"))
            }}
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
    
    return {
        "user_id": user_id, "email": user["email"], "name": user["name"],
        "picture": user.get("picture"), "onboarding_complete": user.get("onboarding_complete", False),
        "session_token": session_token
    }


@router.post("/register")
async def register_user(user_data: UserCreate, response: Response):
    """Register new user with email/password."""
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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


@router.post("/login")
async def login_user(credentials: UserLogin, response: Response):
    """Login with email/password."""
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
    return {
        "user_id": user["user_id"], "email": user["email"], "name": user["name"],
        "onboarding_complete": user.get("onboarding_complete", False), "session_token": session_token
    }


@router.get("/me")
async def get_me(request: Request):
    """Get current user profile."""
    user = await get_current_user(request)
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session."""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}
