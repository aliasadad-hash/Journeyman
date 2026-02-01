"""Media and GIF routes with AWS S3 support."""
from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form, Response
from datetime import datetime, timezone
from pathlib import Path
import uuid
import httpx
import logging
import os
import boto3
from botocore.exceptions import ClientError

from services.database import db, GIPHY_API_KEY
from utils.helpers import get_current_user

router = APIRouter(tags=["media"])
logger = logging.getLogger(__name__)

# Local fallback directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize S3 client if credentials are available
s3_client = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET_NAME:
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        logger.info(f"S3 client initialized for bucket: {S3_BUCKET_NAME}")
    except Exception as e:
        logger.error(f"Failed to initialize S3 client: {e}")
        s3_client = None


def get_s3_url(filename: str) -> str:
    """Get the public URL for an S3 object."""
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"


async def upload_to_s3(content: bytes, filename: str, content_type: str) -> str:
    """Upload file to S3 and return the URL."""
    if not s3_client:
        raise ValueError("S3 client not configured")
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=filename,
            Body=content,
            ContentType=content_type
        )
        return get_s3_url(filename)
    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        raise


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
    """Upload photo or video for profile or chat. Uses S3 if configured, local storage otherwise."""
    current_user = await get_current_user(request)
    
    allowed_image = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    allowed_video = ["video/mp4", "video/quicktime", "video/webm"]
    
    if media_type == "image" and file.content_type not in allowed_image:
        raise HTTPException(status_code=400, detail="Invalid image format. Allowed: JPEG, PNG, GIF, WebP")
    if media_type == "video" and file.content_type not in allowed_video:
        raise HTTPException(status_code=400, detail="Invalid video format. Allowed: MP4, MOV, WebM")
    
    # Size limits: 10MB for images, 50MB for videos
    max_size = 50 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {max_size // (1024*1024)}MB")
    
    # Generate unique filename with user folder
    ext = file.filename.split(".")[-1] if "." in file.filename else ("jpg" if media_type == "image" else "mp4")
    filename = f"{current_user['user_id']}/{uuid.uuid4()}.{ext}"
    
    # Try S3 upload, fallback to local storage
    if s3_client:
        try:
            url = await upload_to_s3(content, filename, file.content_type)
            storage_type = "s3"
            logger.info(f"Uploaded to S3: {filename}")
        except Exception as e:
            logger.error(f"S3 upload failed, falling back to local: {e}")
            # Fallback to local storage
            local_filename = filename.replace("/", "_")
            filepath = UPLOAD_DIR / local_filename
            with open(filepath, "wb") as f:
                f.write(content)
            url = f"/api/media/{local_filename}"
            storage_type = "local"
    else:
        # Local storage
        local_filename = filename.replace("/", "_")
        filepath = UPLOAD_DIR / local_filename
        with open(filepath, "wb") as f:
            f.write(content)
        url = f"/api/media/{local_filename}"
        storage_type = "local"
    
    # Save media record to database
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "user_id": current_user["user_id"],
        "filename": filename,
        "media_type": media_type,
        "content_type": file.content_type,
        "size": len(content),
        "url": url,
        "storage_type": storage_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    
    return media_doc


@router.post("/media/profile-photo")
async def upload_profile_photo(request: Request, file: UploadFile = File(...)):
    """Upload and set profile photo. Automatically updates user profile."""
    current_user = await get_current_user(request)
    
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid format. Use JPEG, PNG, or WebP")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit for profile photos
        raise HTTPException(status_code=400, detail="Profile photo must be under 5MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"profiles/{current_user['user_id']}/avatar_{uuid.uuid4().hex[:8]}.{ext}"
    
    if s3_client:
        try:
            url = await upload_to_s3(content, filename, file.content_type)
        except Exception as e:
            logger.error(f"S3 profile upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload profile photo")
    else:
        local_filename = filename.replace("/", "_")
        filepath = UPLOAD_DIR / local_filename
        with open(filepath, "wb") as f:
            f.write(content)
        url = f"/api/media/{local_filename}"
    
    # Update user profile with new photo
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"profile_photo": url}}
    )
    
    return {"url": url, "message": "Profile photo updated"}


@router.post("/media/gallery")
async def add_gallery_photo(request: Request, file: UploadFile = File(...)):
    """Add photo to user's profile gallery (up to 6 photos)."""
    current_user = await get_current_user(request)
    
    # Check current photo count
    current_photos = current_user.get("photos", [])
    if len(current_photos) >= 6:
        raise HTTPException(status_code=400, detail="Maximum 6 photos allowed. Delete one first.")
    
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid format. Use JPEG, PNG, or WebP")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Photo must be under 10MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"gallery/{current_user['user_id']}/{uuid.uuid4()}.{ext}"
    
    if s3_client:
        try:
            url = await upload_to_s3(content, filename, file.content_type)
        except Exception as e:
            logger.error(f"S3 gallery upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload photo")
    else:
        local_filename = filename.replace("/", "_")
        filepath = UPLOAD_DIR / local_filename
        with open(filepath, "wb") as f:
            f.write(content)
        url = f"/api/media/{local_filename}"
    
    # Add to user's photos array
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$push": {"photos": url}}
    )
    
    return {"url": url, "message": "Photo added to gallery", "total_photos": len(current_photos) + 1}


@router.delete("/media/gallery")
async def remove_gallery_photo(request: Request, photo_url: str = Query(...)):
    """Remove a photo from user's gallery."""
    current_user = await get_current_user(request)
    
    # Remove from user's photos array
    result = await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$pull": {"photos": photo_url}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found in gallery")
    
    # Optionally delete from S3 (commented out to keep backups)
    # if s3_client and photo_url.startswith(f"https://{S3_BUCKET_NAME}"):
    #     key = photo_url.split(f"{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/")[-1]
    #     s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
    
    return {"message": "Photo removed from gallery"}


@router.get("/media/status")
async def get_media_status():
    """Check if S3 is configured and working."""
    if s3_client:
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            return {
                "s3_configured": True,
                "bucket": S3_BUCKET_NAME,
                "region": AWS_REGION,
                "status": "connected"
            }
        except Exception as e:
            return {
                "s3_configured": True,
                "bucket": S3_BUCKET_NAME,
                "status": "error",
                "error": str(e)
            }
    else:
        return {
            "s3_configured": False,
            "status": "using_local_storage"
        }


@router.get("/media/{filename}")
async def get_media(filename: str):
    """Serve locally uploaded media files."""
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
