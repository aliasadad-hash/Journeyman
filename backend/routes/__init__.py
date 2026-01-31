"""Route modules index."""
from .auth import router as auth_router
from .profile import router as profile_router
from .discovery import router as discovery_router
from .chat import router as chat_router
from .schedules import router as schedules_router
from .notifications import router as notifications_router
from .media import router as media_router

__all__ = [
    "auth_router",
    "profile_router", 
    "discovery_router",
    "chat_router",
    "schedules_router",
    "notifications_router",
    "media_router"
]
