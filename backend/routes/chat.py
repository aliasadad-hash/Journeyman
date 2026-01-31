"""Chat and messaging routes."""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import uuid

from services.database import db
from services.websocket import manager
from models.schemas import ChatMessage, ChatMessageCreate
from utils.helpers import get_current_user, get_conversation_id, create_notification

router = APIRouter(tags=["chat"])


@router.get("/conversations")
async def get_conversations(request: Request):
    """Get all conversations for current user."""
    current_user = await get_current_user(request)
    
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


@router.get("/chat/{user_id}")
async def get_chat_messages(user_id: str, request: Request):
    """Get chat messages with a specific user."""
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    messages = await db.messages.find({"conversation_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    await db.messages.update_many(
        {"conversation_id": conv_id, "recipient_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"messages": messages}


@router.post("/chat/{user_id}")
async def send_message(user_id: str, request: Request, message: ChatMessageCreate):
    """Send a text message to a user."""
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
    
    if user_id in manager.active_connections:
        await manager.send_personal_message({"type": "new_message", "message": doc}, user_id)
    
    return doc


@router.post("/chat/{user_id}/read")
async def mark_messages_read(user_id: str, request: Request):
    """Mark all messages from a user as read and notify them."""
    current_user = await get_current_user(request)
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    read_at = datetime.now(timezone.utc).isoformat()
    result = await db.messages.update_many(
        {"conversation_id": conv_id, "recipient_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": read_at}}
    )
    
    if user_id in manager.active_connections:
        await manager.send_personal_message({
            "type": "read_receipt",
            "conversation_id": conv_id,
            "read_by": current_user["user_id"],
            "read_at": read_at
        }, user_id)
    
    return {"marked_read": result.modified_count}


@router.post("/chat/{user_id}/typing")
async def send_typing_indicator(user_id: str, request: Request, is_typing: bool = True):
    """Send typing indicator to other user."""
    current_user = await get_current_user(request)
    
    if user_id in manager.active_connections:
        await manager.send_personal_message({
            "type": "typing",
            "user_id": current_user["user_id"],
            "is_typing": is_typing
        }, user_id)
    
    return {"sent": True}


@router.post("/chat/{user_id}/media")
async def send_media_message(user_id: str, request: Request):
    """Send a message with media (photo/video/GIF)."""
    current_user = await get_current_user(request)
    data = await request.json()
    
    conv_id = get_conversation_id(current_user["user_id"], user_id)
    
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conv_id,
        "sender_id": current_user["user_id"],
        "recipient_id": user_id,
        "content": data.get("content", ""),
        "message_type": data.get("message_type", "text"),
        "media_url": data.get("media_url"),
        "gif_data": data.get("gif_data"),
        "reactions": [],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    message.pop("_id", None)
    
    await manager.send_personal_message({"type": "new_message", "message": message}, user_id)
    
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


@router.post("/messages/{message_id}/reaction")
async def add_message_reaction(message_id: str, request: Request):
    """Add emoji reaction to a message."""
    current_user = await get_current_user(request)
    data = await request.json()
    emoji = data.get("emoji")
    
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")
    
    valid_emojis = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "💯", "🎉"]
    if emoji not in valid_emojis:
        raise HTTPException(status_code=400, detail="Invalid reaction emoji")
    
    result = await db.messages.update_one(
        {"message_id": message_id},
        {"$addToSet": {"reactions": {"user_id": current_user["user_id"], "emoji": emoji, "created_at": datetime.now(timezone.utc).isoformat()}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = await db.messages.find_one({"message_id": message_id}, {"_id": 0})
    if message and message.get("sender_id") != current_user["user_id"]:
        await manager.send_personal_message({
            "type": "reaction",
            "message_id": message_id,
            "user_id": current_user["user_id"],
            "emoji": emoji
        }, message["sender_id"])
    
    return {"message": "Reaction added", "emoji": emoji}


@router.delete("/messages/{message_id}/reaction")
async def remove_message_reaction(message_id: str, request: Request):
    """Remove emoji reaction from a message."""
    current_user = await get_current_user(request)
    
    await db.messages.update_one(
        {"message_id": message_id},
        {"$pull": {"reactions": {"user_id": current_user["user_id"]}}}
    )
    
    return {"message": "Reaction removed"}
