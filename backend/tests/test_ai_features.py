"""
Journeyman Dating App - AI Features Tests
Tests for AI Bio Generation (GPT-5.2), Ice Breakers (Claude), Compatibility Score (Gemini)
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAIBioGeneration:
    """Test AI Bio Generation endpoint using GPT-5.2"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user with profile data"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"AI Bio Test {unique_id}",
            "email": f"aibio_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        
        # Complete onboarding with profile data for better bio generation
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {data['session_token']}"},
            json={
                "bio": "Test bio",
                "profession": "trucker",
                "location": "Los Angeles, CA",
                "age": 32,
                "interests": ["Travel", "Music", "Photography"]
            }
        )
        
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_generate_bio_confident_style(self, authenticated_user):
        """Test generating bio with confident style"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"style": "confident"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "bio" in data
        assert "style" in data
        assert data["style"] == "confident"
        assert len(data["bio"]) > 20  # Bio should have meaningful content
        print(f"SUCCESS: Generated confident bio: {data['bio'][:100]}...")
    
    def test_generate_bio_playful_style(self, authenticated_user):
        """Test generating bio with playful style"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"style": "playful"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["style"] == "playful"
        assert len(data["bio"]) > 20
        print(f"SUCCESS: Generated playful bio: {data['bio'][:100]}...")
    
    def test_generate_bio_mysterious_style(self, authenticated_user):
        """Test generating bio with mysterious style"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"style": "mysterious"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["style"] == "mysterious"
        assert len(data["bio"]) > 20
        print(f"SUCCESS: Generated mysterious bio: {data['bio'][:100]}...")
    
    def test_generate_bio_romantic_style(self, authenticated_user):
        """Test generating bio with romantic style"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"style": "romantic"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["style"] == "romantic"
        assert len(data["bio"]) > 20
        print(f"SUCCESS: Generated romantic bio: {data['bio'][:100]}...")
    
    def test_generate_bio_invalid_style(self, authenticated_user):
        """Test that invalid style is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"style": "invalid_style"}
        )
        assert response.status_code == 400
        print("SUCCESS: Invalid style correctly rejected")
    
    def test_generate_bio_unauthenticated(self):
        """Test that unauthenticated requests are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-bio",
            json={"style": "confident"}
        )
        assert response.status_code == 401
        print("SUCCESS: Unauthenticated request correctly rejected")


class TestAISaveGeneratedBio:
    """Test saving AI-generated bio to profile"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Save Bio Test {unique_id}",
            "email": f"savebio_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_save_generated_bio(self, authenticated_user):
        """Test saving a generated bio to profile"""
        test_bio = "Adventure seeker on the open road. Life's too short for boring routes."
        
        response = requests.post(
            f"{BASE_URL}/api/ai/save-generated-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"bio": test_bio}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["bio"] == test_bio
        print("SUCCESS: Bio saved to profile")
        
        # Verify bio was actually saved by fetching profile
        profile_response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert profile_response.status_code == 200
        profile = profile_response.json()
        assert profile["bio"] == test_bio
        print("SUCCESS: Bio verified in profile")
    
    def test_save_empty_bio_rejected(self, authenticated_user):
        """Test that empty bio is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/ai/save-generated-bio",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"},
            json={"bio": ""}
        )
        assert response.status_code == 400
        print("SUCCESS: Empty bio correctly rejected")


class TestAIIceBreakers:
    """Test AI Ice Breakers endpoint using Claude"""
    
    @pytest.fixture
    def two_matched_users(self):
        """Create two users who have matched with each other"""
        # Create user 1
        unique_id1 = uuid.uuid4().hex[:8]
        user1_data = {
            "name": f"IceBreaker User1 {unique_id1}",
            "email": f"icebreaker1_{unique_id1}@example.com",
            "password": "testpass123"
        }
        res1 = requests.post(f"{BASE_URL}/api/auth/register", json=user1_data)
        user1 = res1.json()
        
        # Complete onboarding for user1
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user1['session_token']}"},
            json={
                "bio": "Love traveling and meeting new people",
                "profession": "trucker",
                "location": "Los Angeles, CA",
                "age": 30,
                "interests": ["Travel", "Music", "Hiking"]
            }
        )
        
        # Create user 2
        unique_id2 = uuid.uuid4().hex[:8]
        user2_data = {
            "name": f"IceBreaker User2 {unique_id2}",
            "email": f"icebreaker2_{unique_id2}@example.com",
            "password": "testpass123"
        }
        res2 = requests.post(f"{BASE_URL}/api/auth/register", json=user2_data)
        user2 = res2.json()
        
        # Complete onboarding for user2
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user2['session_token']}"},
            json={
                "bio": "Pilot who loves adventure",
                "profession": "airline",
                "location": "New York, NY",
                "age": 28,
                "interests": ["Flying", "Photography", "Hiking"]
            }
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
            "user1": {"user_id": user1["user_id"], "token": user1["session_token"], "name": user1_data["name"]},
            "user2": {"user_id": user2["user_id"], "token": user2["session_token"], "name": user2_data["name"]}
        }
    
    def test_get_ice_breakers_for_match(self, two_matched_users):
        """Test getting ice breakers for a matched user"""
        user1 = two_matched_users["user1"]
        user2 = two_matched_users["user2"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/ice-breakers/{user2['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "ice_breakers" in data
        assert "match_name" in data
        assert len(data["ice_breakers"]) > 0
        assert len(data["ice_breakers"]) <= 3  # Should return up to 3 ice breakers
        
        # Verify ice breakers are meaningful strings
        for breaker in data["ice_breakers"]:
            assert isinstance(breaker, str)
            assert len(breaker) > 10  # Should be meaningful content
        
        print(f"SUCCESS: Got {len(data['ice_breakers'])} ice breakers for {data['match_name']}")
        for i, breaker in enumerate(data["ice_breakers"], 1):
            print(f"  {i}. {breaker[:80]}...")
    
    def test_ice_breakers_for_non_match_rejected(self, two_matched_users):
        """Test that ice breakers for non-matched user is rejected"""
        user1 = two_matched_users["user1"]
        
        # Create a third user who is NOT matched
        unique_id = uuid.uuid4().hex[:8]
        user3_data = {
            "name": f"Non Match {unique_id}",
            "email": f"nonmatch_{unique_id}@example.com",
            "password": "testpass123"
        }
        res3 = requests.post(f"{BASE_URL}/api/auth/register", json=user3_data)
        user3 = res3.json()
        
        # Try to get ice breakers for non-matched user
        response = requests.get(
            f"{BASE_URL}/api/ai/ice-breakers/{user3['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 403
        print("SUCCESS: Ice breakers for non-match correctly rejected")
    
    def test_ice_breakers_user_not_found(self, two_matched_users):
        """Test ice breakers for non-existent user"""
        user1 = two_matched_users["user1"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/ice-breakers/nonexistent_user_id",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 404
        print("SUCCESS: Non-existent user correctly returns 404")


class TestAICompatibilityScore:
    """Test AI Compatibility Score endpoint using Gemini"""
    
    @pytest.fixture
    def two_users(self):
        """Create two users for compatibility testing"""
        # Create user 1
        unique_id1 = uuid.uuid4().hex[:8]
        user1_data = {
            "name": f"Compat User1 {unique_id1}",
            "email": f"compat1_{unique_id1}@example.com",
            "password": "testpass123"
        }
        res1 = requests.post(f"{BASE_URL}/api/auth/register", json=user1_data)
        user1 = res1.json()
        
        # Complete onboarding for user1
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user1['session_token']}"},
            json={
                "bio": "Trucker who loves the open road and country music",
                "profession": "trucker",
                "location": "Nashville, TN",
                "age": 35,
                "interests": ["Country Music", "BBQ", "Fishing", "Road Trips"]
            }
        )
        
        # Create user 2
        unique_id2 = uuid.uuid4().hex[:8]
        user2_data = {
            "name": f"Compat User2 {unique_id2}",
            "email": f"compat2_{unique_id2}@example.com",
            "password": "testpass123"
        }
        res2 = requests.post(f"{BASE_URL}/api/auth/register", json=user2_data)
        user2 = res2.json()
        
        # Complete onboarding for user2
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {user2['session_token']}"},
            json={
                "bio": "Music lover who enjoys outdoor adventures",
                "profession": "admirer",
                "location": "Memphis, TN",
                "age": 32,
                "interests": ["Music", "Hiking", "Cooking", "Travel"]
            }
        )
        
        return {
            "user1": {"user_id": user1["user_id"], "token": user1["session_token"]},
            "user2": {"user_id": user2["user_id"], "token": user2["session_token"]}
        }
    
    def test_get_compatibility_score(self, two_users):
        """Test getting compatibility score between two users"""
        user1 = two_users["user1"]
        user2 = two_users["user2"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility/{user2['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "score" in data
        assert "reasons" in data
        assert "conversation_topics" in data
        assert "user_name" in data
        
        # Validate score is in valid range
        assert 0 <= data["score"] <= 100
        
        # Validate reasons and topics are lists
        assert isinstance(data["reasons"], list)
        assert isinstance(data["conversation_topics"], list)
        
        print(f"SUCCESS: Compatibility score: {data['score']}%")
        print(f"  Reasons: {data['reasons'][:2]}")
        print(f"  Topics: {data['conversation_topics'][:2]}")
    
    def test_compatibility_with_self_rejected(self, two_users):
        """Test that compatibility with self is rejected"""
        user1 = two_users["user1"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility/{user1['user_id']}",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 400
        print("SUCCESS: Compatibility with self correctly rejected")
    
    def test_compatibility_user_not_found(self, two_users):
        """Test compatibility for non-existent user"""
        user1 = two_users["user1"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility/nonexistent_user_id",
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 404
        print("SUCCESS: Non-existent user correctly returns 404")


class TestAIBatchCompatibility:
    """Test batch compatibility endpoint"""
    
    @pytest.fixture
    def multiple_users(self):
        """Create multiple users for batch testing"""
        users = []
        
        # Create main user
        unique_id = uuid.uuid4().hex[:8]
        main_user_data = {
            "name": f"Batch Main {unique_id}",
            "email": f"batchmain_{unique_id}@example.com",
            "password": "testpass123"
        }
        res = requests.post(f"{BASE_URL}/api/auth/register", json=main_user_data)
        main_user = res.json()
        
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {main_user['session_token']}"},
            json={
                "bio": "Looking for connections",
                "profession": "trucker",
                "location": "Chicago, IL",
                "age": 30,
                "interests": ["Travel", "Music"]
            }
        )
        
        # Create 3 other users
        for i in range(3):
            uid = uuid.uuid4().hex[:8]
            user_data = {
                "name": f"Batch User{i} {uid}",
                "email": f"batchuser{i}_{uid}@example.com",
                "password": "testpass123"
            }
            res = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
            user = res.json()
            
            requests.post(
                f"{BASE_URL}/api/profile/complete-onboarding",
                headers={"Authorization": f"Bearer {user['session_token']}"},
                json={
                    "bio": f"User {i} bio",
                    "profession": ["trucker", "airline", "military"][i],
                    "location": ["LA", "NY", "Miami"][i],
                    "age": 25 + i,
                    "interests": ["Travel", "Sports"]
                }
            )
            users.append({"user_id": user["user_id"], "token": user["session_token"]})
        
        return {
            "main_user": {"user_id": main_user["user_id"], "token": main_user["session_token"]},
            "other_users": users
        }
    
    def test_batch_compatibility(self, multiple_users):
        """Test getting batch compatibility scores"""
        main_user = multiple_users["main_user"]
        other_users = multiple_users["other_users"]
        
        user_ids = ",".join([u["user_id"] for u in other_users])
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility-batch?user_ids={user_ids}",
            headers={"Authorization": f"Bearer {main_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "compatibilities" in data
        assert len(data["compatibilities"]) > 0
        
        for compat in data["compatibilities"]:
            assert "user_id" in compat
            assert "score" in compat
            assert "top_reason" in compat
            assert 0 <= compat["score"] <= 100
        
        print(f"SUCCESS: Got batch compatibility for {len(data['compatibilities'])} users")
        for c in data["compatibilities"]:
            print(f"  {c['user_name']}: {c['score']}% - {c['top_reason'][:50]}...")
    
    def test_batch_compatibility_empty(self, multiple_users):
        """Test batch compatibility with empty user_ids"""
        main_user = multiple_users["main_user"]
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility-batch?user_ids=",
            headers={"Authorization": f"Bearer {main_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["compatibilities"] == []
        print("SUCCESS: Empty user_ids returns empty list")
    
    def test_batch_compatibility_excludes_self(self, multiple_users):
        """Test that batch compatibility excludes self from results"""
        main_user = multiple_users["main_user"]
        other_users = multiple_users["other_users"]
        
        # Include self in the list
        user_ids = f"{main_user['user_id']},{other_users[0]['user_id']}"
        
        response = requests.get(
            f"{BASE_URL}/api/ai/compatibility-batch?user_ids={user_ids}",
            headers={"Authorization": f"Bearer {main_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Self should be excluded
        user_ids_in_response = [c["user_id"] for c in data["compatibilities"]]
        assert main_user["user_id"] not in user_ids_in_response
        print("SUCCESS: Self correctly excluded from batch results")


class TestExistingEndpointsStillWork:
    """Verify refactored backend routes still work"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Existing Test {unique_id}",
            "email": f"existing_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        data = response.json()
        
        # Complete onboarding
        requests.post(
            f"{BASE_URL}/api/profile/complete-onboarding",
            headers={"Authorization": f"Bearer {data['session_token']}"},
            json={
                "bio": "Test bio",
                "profession": "trucker",
                "location": "Test City",
                "age": 25
            }
        )
        
        return {"user_id": data["user_id"], "token": data["session_token"]}
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert data["version"] == "2.0.0"
        print(f"SUCCESS: API root returns version {data['version']}")
    
    def test_auth_me(self, authenticated_user):
        """Test /auth/me endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == authenticated_user["user_id"]
        print("SUCCESS: /auth/me endpoint works")
    
    def test_profile_get(self, authenticated_user):
        """Test /profile endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "profession" in data
        print("SUCCESS: /profile endpoint works")
    
    def test_discover(self, authenticated_user):
        """Test /discover endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data  # Discover returns 'users' not 'profiles'
        print(f"SUCCESS: /discover endpoint works, found {len(data['users'])} users")
    
    def test_schedules(self, authenticated_user):
        """Test /schedules endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "schedules" in data
        print("SUCCESS: /schedules endpoint works")
    
    def test_notifications(self, authenticated_user):
        """Test /notifications endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        print("SUCCESS: /notifications endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
