"""Media and GIF routes."""
from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form, Response
from datetime import datetime, timezone
from pathlib import Path
import uuid
import httpx
import logging

from services.database import db, GIPHY_API_KEY
from utils.helpers import get_current_user

router = APIRouter(tags=["media"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.get("/gifs/search")
async def search_gifs(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)):
    """Search for GIFs using GIPHY API."""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.giphy.com/v1/gifs/search",
                params={"api_key": GIPHY_API_KEY, "q": q, "limit": limit, "rating": "pg-13"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            gifs = []
            for item in data.get("data", []):
                gifs.append({
                    "id": item["id"],
                    "title": item.get("title", "GIF"),
                    "url": item["url"],
                    "preview_url": item["images"]["fixed_width_small"]["url"],
                    "original_url": item["images"]["original"]["url"],
                    "width": item["images"]["fixed_width"]["width"],
                    "height": item["images"]["fixed_width"]["height"]
                })
            return {"gifs": gifs}
    except Exception as e:
        logger.error(f"GIPHY API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to search GIFs")


@router.get("/gifs/trending")
async def get_trending_gifs(limit: int = Query(20, ge=1, le=50)):
    """Get trending GIFs."""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.giphy.com/v1/gifs/trending",
                params={"api_key": GIPHY_API_KEY, "limit": limit, "rating": "pg-13"},
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            gifs = []
            for item in data.get("data", []):
                gifs.append({
                    "id": item["id"],
                    "title": item.get("title", "GIF"),
                    "url": item["url"],
                    "preview_url": item["images"]["fixed_width_small"]["url"],
                    "original_url": item["images"]["original"]["url"]
                })
            return {"gifs": gifs}
    except Exception as e:
        logger.error(f"GIPHY trending error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get trending GIFs")


@router.post("/media/upload")
async def upload_media(request: Request, file: UploadFile = File(...), media_type: str = Form("image")):
    """Upload photo or video for profile or chat."""
    current_user = await get_current_user(request)
    
    allowed_image = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    allowed_video = ["video/mp4", "video/quicktime", "video/webm"]
    
    if media_type == "image" and file.content_type not in allowed_image:
        raise HTTPException(status_code=400, detail="Invalid image format")
    if media_type == "video" and file.content_type not in allowed_video:
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    max_size = 50 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {max_size // (1024*1024)}MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "user_id": current_user["user_id"],
        "filename": filename,
        "media_type": media_type,
        "content_type": file.content_type,
        "size": len(content),
        "url": f"/api/media/{filename}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    
    return media_doc


@router.get("/media/{filename}")
async def get_media(filename: str):
    """Serve uploaded media files."""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    
    with open(filepath, "rb") as f:
        content = f.read()
    
    ext = filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "gif": "image/gif", "webp": "image/webp", "mp4": "video/mp4",
        "webm": "video/webm", "mov": "video/quicktime"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return Response(content=content, media_type=content_type)
