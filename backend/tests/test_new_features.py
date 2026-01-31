"""
Journeyman Dating App - New Features Tests
Tests for GIF picker, emoji picker, media upload, social links, settings, notifications
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGifEndpoints:
    """Test GIPHY integration endpoints"""
    
    def test_gif_search(self):
        """Test GIF search endpoint returns results"""
        response = requests.get(f"{BASE_URL}/api/gifs/search?q=hello&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "gifs" in data
        assert len(data["gifs"]) > 0
        
        # Verify GIF structure
        gif = data["gifs"][0]
        assert "id" in gif
        assert "title" in gif
        assert "preview_url" in gif
        assert "original_url" in gif
        print(f"SUCCESS: GIF search returned {len(data['gifs'])} results")
    
    def test_gif_trending(self):
        """Test trending GIFs endpoint"""
        response = requests.get(f"{BASE_URL}/api/gifs/trending?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "gifs" in data
        assert len(data["gifs"]) > 0
        print(f"SUCCESS: Trending GIFs returned {len(data['gifs'])} results")
    
    def test_gif_search_empty_query(self):
        """Test GIF search with empty query returns error"""
        response = requests.get(f"{BASE_URL}/api/gifs/search?q=")
        # Should return 422 for validation error (min_length=1)
        assert response.status_code == 422
        print("SUCCESS: Empty GIF search query correctly rejected")


class TestSocialLinksEndpoints:
    """Test social media links endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Social Test {unique_id}",
            "email": f"social_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_update_social_links(self, authenticated_user):
        """Test updating social media links"""
        social_data = {
            "twitter": "testuser",
            "instagram": "testuser_ig",
            "facebook": "testuser.fb",
            "tiktok": "@testuser",
            "snapchat": "testsnap"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/profile/social-links",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=social_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "social_links" in data
        assert data["social_links"]["twitter"] == "testuser"
        assert data["social_links"]["instagram"] == "testuser_ig"
        print("SUCCESS: Social links updated successfully")
    
    def test_get_social_links(self, authenticated_user):
        """Test getting social links for a user"""
        # First update social links
        requests.put(
            f"{BASE_URL}/api/profile/social-links",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"twitter": "mytwitter"}
        )
        
        # Then get them
        response = requests.get(
            f"{BASE_URL}/api/profile/{authenticated_user['user_id']}/social-links",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "social_links" in data
        assert data["social_links"]["twitter"] == "mytwitter"
        print("SUCCESS: Social links retrieved successfully")


class TestSettingsEndpoints:
    """Test notification settings endpoints"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Settings Test {unique_id}",
            "email": f"settings_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_get_notification_settings(self, authenticated_user):
        """Test getting notification settings"""
        response = requests.get(
            f"{BASE_URL}/api/settings/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "settings" in data
        # Verify default settings structure
        settings = data["settings"]
        assert "new_matches" in settings
        assert "new_messages" in settings
        assert "super_likes" in settings
        assert "sound" in settings
        print(f"SUCCESS: Notification settings retrieved: {settings}")
    
    def test_update_notification_settings(self, authenticated_user):
        """Test updating notification settings"""
        new_settings = {
            "new_matches": False,
            "new_messages": True,
            "super_likes": False,
            "likes_received": True,
            "profile_views": True,
            "marketing": False,
            "sound": False,
            "vibration": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/settings/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json=new_settings
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["settings"]["new_matches"] == False
        assert data["settings"]["sound"] == False
        print("SUCCESS: Notification settings updated")


class TestMessageReactions:
    """Test message reaction endpoints"""
    
    @pytest.fixture
    def two_matched_users(self):
        """Create two users who have matched with each other"""
        # Create user 1
        unique_id1 = uuid.uuid4().hex[:8]
        user1_data = {"name": f"User1 {unique_id1}", "email": f"user1_{unique_id1}@example.com", "password": "testpass123"}
        res1 = requests.post(f"{BASE_URL}/api/auth/register", json=user1_data)
        user1 = res1.json()
        
        # Complete onboarding for user1
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user1['session_token']}"},
            json={"bio": "Test", "profession": "trucker", "location": "LA", "age": 25}
        )
        
        # Create user 2
        unique_id2 = uuid.uuid4().hex[:8]
        user2_data = {"name": f"User2 {unique_id2}", "email": f"user2_{unique_id2}@example.com", "password": "testpass123"}
        res2 = requests.post(f"{BASE_URL}/api/auth/register", json=user2_data)
        user2 = res2.json()
        
        # Complete onboarding for user2
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user2['session_token']}"},
            json={"bio": "Test", "profession": "airline", "location": "NY", "age": 28}
        )
        
        # User1 likes User2
        requests.post(
            f"{BASE_URL}/api/discover/action?target_user_id={user2['user_id']}&action=like",
            headers={"Authorization": f"Bearer {user1['session_token']}"}
        )
        
        # User2 likes User1 (creates match)
        requests.post(
            f"{BASE_URL}/api/discover/action?target_user_id={user1['user_id']}&action=like",
            headers={"Authorization": f"Bearer {user2['session_token']}"}
        )
        
        return {
            "user1": {"user_id": user1["user_id"], "token": user1["session_token"]},
            "user2": {"user_id": user2["user_id"], "token": user2["session_token"]}
        }
    
    def test_send_message_and_react(self, two_matched_users):
        """Test sending a message and adding a reaction"""
        user1 = two_matched_users["user1"]
        user2 = two_matched_users["user2"]
        
        # User1 sends message to User2
        msg_response = requests.post(
            f"{BASE_URL}/api/chat/{user2['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"},
            json={"recipient_id": user2["user_id"], "content": "Hello! Testing reactions"}
        )
        assert msg_response.status_code == 200
        message = msg_response.json()
        message_id = message["message_id"]
        print(f"SUCCESS: Message sent with ID: {message_id}")
        
        # User2 adds reaction to the message
        reaction_response = requests.post(
            f"{BASE_URL}/api/messages/{message_id}/reaction",
            headers={"Authorization": f"Bearer {user2['token']}"},
            json={"emoji": "❤️"}
        )
        assert reaction_response.status_code == 200
        data = reaction_response.json()
        assert data["emoji"] == "❤️"
        print("SUCCESS: Reaction added to message")
    
    def test_invalid_reaction_emoji(self, two_matched_users):
        """Test that invalid emoji reactions are rejected"""
        user1 = two_matched_users["user1"]
        user2 = two_matched_users["user2"]
        
        # Send a message first
        msg_response = requests.post(
            f"{BASE_URL}/api/chat/{user2['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"},
            json={"recipient_id": user2["user_id"], "content": "Test message"}
        )
        message_id = msg_response.json()["message_id"]
        
        # Try invalid emoji
        reaction_response = requests.post(
            f"{BASE_URL}/api/messages/{message_id}/reaction",
            headers={"Authorization": f"Bearer {user2['token']}"},
            json={"emoji": "🤡"}  # Not in valid list
        )
        assert reaction_response.status_code == 400
        print("SUCCESS: Invalid emoji correctly rejected")


class TestMediaUpload:
    """Test media upload endpoint (may fail without S3 credentials)"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Media Test {unique_id}",
            "email": f"media_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_media_upload_without_file(self, authenticated_user):
        """Test media upload endpoint exists and validates input"""
        response = requests.post(
            f"{BASE_URL}/api/media/upload",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        # Should return 422 for missing file
        assert response.status_code == 422
        print("SUCCESS: Media upload endpoint validates file requirement")


class TestNotifications:
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
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
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
    
    def test_mark_all_notifications_read(self, authenticated_user):
        """Test marking all notifications as read"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        print("SUCCESS: All notifications marked as read")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
