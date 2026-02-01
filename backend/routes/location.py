"""Location and city search routes."""
from fastapi import APIRouter, Query
import httpx
import logging

router = APIRouter(prefix="/location", tags=["location"])
logger = logging.getLogger(__name__)

# Using OpenStreetMap Nominatim API (free, no API key required)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


@router.get("/cities")
async def search_cities(q: str = Query(..., min_length=3, max_length=100)):
    """
    Search for cities by name (minimum 3 characters).
    Returns city suggestions with coordinates.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_URL,
                params={
                    "q": q,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 15,
                    "type": "city",
                    "dedupe": 1
                },
                headers={
                    "User-Agent": "Journeyman-Dating-App/2.0"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            cities = []
            seen = set()
            
            for item in data:
                address = item.get("address", {})
                item_type = item.get("type", "")
                item_class = item.get("class", "")
                
                # Filter to only include cities, towns, villages
                if item_class not in ["place", "boundary"] and item_type not in ["city", "town", "village", "municipality", "administrative"]:
                    continue
                
                # Build city name with context
                city = (
                    address.get("city") or 
                    address.get("town") or 
                    address.get("village") or
                    address.get("municipality") or
                    item.get("name", "")
                )
                state = address.get("state", "")
                country = address.get("country", "")
                
                if not city:
                    continue
                
                # Create display name
                parts = [city]
                if state:
                    parts.append(state)
                if country:
                    parts.append(country)
                display_name = ", ".join(parts)
                
                # Dedupe
                key = display_name.lower()
                if key in seen:
                    continue
                seen.add(key)
                
                cities.append({
                    "display_name": display_name,
                    "city": city,
                    "state": state,
                    "country": country,
                    "latitude": float(item.get("lat", 0)),
                    "longitude": float(item.get("lon", 0))
                })
            
            return {"cities": cities}
    
    except httpx.TimeoutException:
        logger.error("City search timeout")
        return {"cities": [], "error": "Search timed out"}
    except Exception as e:
        logger.error(f"City search error: {e}")
        return {"cities": [], "error": "Search failed"}


@router.get("/reverse")
async def reverse_geocode(lat: float, lon: float):
    """
    Get city name from coordinates (reverse geocoding).
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1
                },
                headers={
                    "User-Agent": "Journeyman-Dating-App/2.0"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            address = data.get("address", {})
            city = (
                address.get("city") or 
                address.get("town") or 
                address.get("village") or
                address.get("municipality", "")
            )
            state = address.get("state", "")
            country = address.get("country", "")
            
            parts = [p for p in [city, state, country] if p]
            display_name = ", ".join(parts)
            
            return {
                "display_name": display_name,
                "city": city,
                "state": state,
                "country": country,
                "latitude": lat,
                "longitude": lon
            }
    
    except Exception as e:
        logger.error(f"Reverse geocode error: {e}")
        return {"error": "Reverse geocoding failed"}
