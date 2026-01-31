"""
Journeyman Dating App - Backend API Tests
Tests for authentication, profile, discovery, and other core features
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Test basic API health and root endpoint"""
    
    def test_api_root(self):
        """Test API root endpoint returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Journeyman" in data["message"]
        print(f"SUCCESS: API root returns: {data['message']}")


class TestAuthEndpoints:
    """Test authentication endpoints - register, login, logout"""
    
    @pytest.fixture
    def test_user_data(self):
        """Generate unique test user data"""
        unique_id = uuid.uuid4().hex[:8]
        return {
            "name": f"Test User {unique_id}",
            "email": f"test_{unique_id}@example.com",
            "password": "testpass123"
        }
    
    def test_register_new_user(self, test_user_data):
        """Test user registration creates new user and returns session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "session_token" in data
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
        assert data["onboarding_complete"] == False
        print(f"SUCCESS: User registered with ID: {data['user_id']}")
        
        # Store for cleanup
        return data
    
    def test_register_duplicate_email(self, test_user_data):
        """Test registration fails for duplicate email"""
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response2.status_code == 400
        print("SUCCESS: Duplicate email registration correctly rejected")
    
    def test_login_valid_credentials(self, test_user_data):
        """Test login with valid credentials"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json=test_user_data)
        
        # Then login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert "session_token" in data
        assert data["email"] == test_user_data["email"]
        print(f"SUCCESS: Login successful for {data['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials correctly rejected")
    
    def test_auth_me_with_token(self, test_user_data):
        """Test /auth/me returns user data with valid token"""
        # Register and get token
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        token = reg_response.json()["session_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == test_user_data["email"]
        print(f"SUCCESS: /auth/me returns user: {data['email']}")
    
    def test_auth_me_without_token(self):
        """Test /auth/me fails without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("SUCCESS: /auth/me correctly requires authentication")
    
    def test_logout(self, test_user_data):
        """Test logout invalidates session"""
        # Register and get token
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        token = reg_response.json()["session_token"]
        
        # Logout
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
            cookies={"session_token": token}
        )
        assert response.status_code == 200
        print("SUCCESS: Logout successful")


class TestProfileEndpoints:
    """Test profile management endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Profile Test {unique_id}",
            "email": f"profile_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        data = response.json()
        return {
            "user_id": data["user_id"],
            "token": data["session_token"],
            "email": data["email"]
        }
    
    def test_get_profile(self, authenticated_user):
        """Test getting user profile"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == authenticated_user["email"]
        print(f"SUCCESS: Profile retrieved for {data['email']}")
    
    def test_update_profile(self, authenticated_user):
        """Test updating user profile"""
        update_data = {
            "bio": "Test bio for profile update",
            "profession": "trucker",
            "location": "Los Angeles, CA",
            "age": 30,
            "interests": ["Travel", "Music", "Photography"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["bio"] == update_data["bio"]
        assert data["profession"] == update_data["profession"]
        assert data["age"] == update_data["age"]
        print(f"SUCCESS: Profile updated with bio: {data['bio'][:30]}...")
    
    def test_complete_onboarding(self, authenticated_user):
        """Test completing onboarding"""
        onboarding_data = {
            "bio": "Completed onboarding bio",
            "profession": "airline",
            "location": "New York, NY",
            "age": 28,
            "interests": ["Flying", "Travel"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=onboarding_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["onboarding_complete"] == True
        print("SUCCESS: Onboarding completed successfully")
    
    def test_upload_photo(self, authenticated_user):
        """Test photo upload"""
        photo_data = {
            "photo_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "is_primary": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/profile/photo",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=photo_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "photo_count" in data
        print(f"SUCCESS: Photo uploaded, count: {data['photo_count']}")


class TestDiscoveryEndpoints:
    """Test discovery and matching endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user with completed profile"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Discovery Test {unique_id}",
            "email": f"discover_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        data = response.json()
        
        # Complete onboarding
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {data['session_token']}"},
            json={
                "bio": "Test bio",
                "profession": "trucker",
                "location": "Test City",
                "age": 25,
                "latitude": 34.0522,
                "longitude": -118.2437
            }
        )
        
        return {
            "user_id": data["user_id"],
            "token": data["session_token"]
        }
    
    def test_discover_users(self, authenticated_user):
        """Test discovery endpoint returns users"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "count" in data
        print(f"SUCCESS: Discovery returned {data['count']} users")
    
    def test_discover_with_filters(self, authenticated_user):
        """Test discovery with profession filter"""
        response = requests.get(
            f"{BASE_URL}/api/discover?professions=trucker,airline",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        print(f"SUCCESS: Filtered discovery returned {data['count']} users")
    
    def test_get_matches(self, authenticated_user):
        """Test getting matches"""
        response = requests.get(
            f"{BASE_URL}/api/matches",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "matches" in data
        print(f"SUCCESS: Matches endpoint returned {len(data['matches'])} matches")
    
    def test_get_likes_received(self, authenticated_user):
        """Test getting likes received"""
        response = requests.get(
            f"{BASE_URL}/api/likes-received",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "likes" in data
        assert "count" in data
        print(f"SUCCESS: Likes received: {data['count']}")


class TestScheduleEndpoints:
    """Test travel schedule endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Schedule Test {unique_id}",
            "email": f"schedule_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        data = response.json()
        return {
            "user_id": data["user_id"],
            "token": data["session_token"]
        }
    
    def test_create_schedule(self, authenticated_user):
        """Test creating a travel schedule"""
        schedule_data = {
            "title": "Test Trip",
            "destination": "Las Vegas, NV",
            "latitude": 36.1699,
            "longitude": -115.1398,
            "start_date": "2026-02-01",
            "end_date": "2026-02-05",
            "notes": "Test trip notes",
            "looking_to_meet": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=schedule_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "schedule_id" in data
        assert data["title"] == schedule_data["title"]
        assert data["destination"] == schedule_data["destination"]
        print(f"SUCCESS: Schedule created with ID: {data['schedule_id']}")
        return data
    
    def test_get_schedules(self, authenticated_user):
        """Test getting user schedules"""
        response = requests.get(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "schedules" in data
        print(f"SUCCESS: Retrieved {len(data['schedules'])} schedules")
    
    def test_delete_schedule(self, authenticated_user):
        """Test deleting a schedule"""
        # First create a schedule
        schedule_data = {
            "title": "Delete Test Trip",
            "destination": "Phoenix, AZ",
            "start_date": "2026-03-01",
            "end_date": "2026-03-03"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=schedule_data
        )
        schedule_id = create_response.json()["schedule_id"]
        
        # Delete the schedule
        response = requests.delete(
            f"{BASE_URL}/api/schedules/{schedule_id}",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Schedule {schedule_id} deleted")


class TestNotificationEndpoints:
    """Test notification endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Notif Test {unique_id}",
            "email": f"notif_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        data = response.json()
        return {
            "user_id": data["user_id"],
            "token": data["session_token"]
        }
    
    def test_get_notifications(self, authenticated_user):
        """Test getting notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        print(f"SUCCESS: Retrieved {len(data['notifications'])} notifications")
    
    def test_get_unread_count(self, authenticated_user):
        """Test getting unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "count" in data
        print(f"SUCCESS: Unread count: {data['count']}")


class TestIcebreakerEndpoints:
    """Test icebreaker prompts endpoint"""
    
    def test_get_icebreaker_prompts(self):
        """Test getting icebreaker prompts"""
        response = requests.get(f"{BASE_URL}/api/icebreakers/prompts")
        assert response.status_code == 200
        data = response.json()
        
        assert "prompts" in data
        assert len(data["prompts"]) > 0
        print(f"SUCCESS: Retrieved {len(data['prompts'])} icebreaker prompts")


class TestBoostEndpoint:
    """Test profile boost endpoint"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Boost Test {unique_id}",
            "email": f"boost_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        data = response.json()
        return {
            "user_id": data["user_id"],
            "token": data["session_token"]
        }
    
    def test_activate_boost(self, authenticated_user):
        """Test activating profile boost"""
        response = requests.post(
            f"{BASE_URL}/api/boost",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "expires_at" in data
        print(f"SUCCESS: Boost activated, expires at: {data['expires_at']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
