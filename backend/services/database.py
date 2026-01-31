"""Database configuration and connection management."""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment-based configuration
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com')
GIPHY_API_KEY = os.environ.get('GIPHY_API_KEY', 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else [
    "http://localhost:3000",
    "https://localhost:3000"
]

def get_db():
    return db

def get_client():
    return client
