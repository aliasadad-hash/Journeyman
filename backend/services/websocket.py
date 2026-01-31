"""WebSocket connection manager for real-time chat."""
from fastapi import WebSocket
from typing import Dict
from datetime import datetime, timezone


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_status[user_id] = {"online": True, "last_seen": datetime.now(timezone.utc).isoformat()}
        await self.broadcast_status(user_id, True)
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.user_status[user_id] = {"online": False, "last_seen": datetime.now(timezone.utc).isoformat()}
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)
    
    async def broadcast_status(self, user_id: str, online: bool):
        status_msg = {
            "type": "status_update",
            "user_id": user_id,
            "online": online,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        for uid, ws in list(self.active_connections.items()):
            if uid != user_id:
                try:
                    await ws.send_json(status_msg)
                except:
                    pass
    
    async def send_typing_indicator(self, from_user: str, to_user: str, is_typing: bool):
        if to_user in self.active_connections:
            try:
                await self.active_connections[to_user].send_json({
                    "type": "typing",
                    "user_id": from_user,
                    "is_typing": is_typing
                })
            except:
                pass
    
    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections


# Global manager instance
manager = ConnectionManager()
