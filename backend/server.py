"""
Journeyman Dating App - FastAPI Backend
A premium dating app for men who travel.
"""
from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid
import logging

# Import services
from services.database import db, client, CORS_ORIGINS
from services.websocket import manager

# Import route modules
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.discovery import router as discovery_router
from routes.chat import router as chat_router
from routes.schedules import router as schedules_router
from routes.notifications import router as notifications_router
from routes.media import router as media_router
from routes.ai import router as ai_router
from routes.location import router as location_router

# Import helpers for WebSocket
from utils.helpers import get_conversation_id

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Journeyman API", description="Connect on the Road", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    """API health check endpoint."""
    return {"message": "Journeyman API - Connect on the Road", "version": "2.0.0"}


# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(discovery_router)
api_router.include_router(chat_router)
api_router.include_router(schedules_router)
api_router.include_router(notifications_router)
api_router.include_router(media_router)
api_router.include_router(ai_router)

# Include the main router
app.include_router(api_router)


# WebSocket endpoint for real-time chat
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time messaging."""
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
                    {"$addToSet": {"reactions": {
                        "user_id": user_id,
                        "emoji": emoji,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }}}
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


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    client.close()
