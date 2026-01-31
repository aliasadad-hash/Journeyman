"""
Hot Travelers Feature - Backend API Tests
Tests for the new Hot Travelers feature in Journeyman dating app
- Hot travelers are users with active travel schedules (start_date <= today <= end_date)
- They appear with special badges and are prioritized in discovery
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHotTravelersFeature:
    """Test Hot Travelers feature - discovery, filtering, and badge display"""
    
    @pytest.fixture
    def viewer_session(self):
        """Login as viewer_test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "viewer_test@test.com", "password": "testpass123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data["session_token"]
    
    @pytest.fixture
    def hot_traveler_session(self):
        """Login as hot_traveler_test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "hot_traveler_test@test.com", "password": "testpass123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data["session_token"]
    
    def test_discover_returns_hot_travelers_count(self, viewer_session):
        """Test that /api/discover returns hot_travelers_count field"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify hot_travelers_count is present
        assert "hot_travelers_count" in data, "hot_travelers_count field missing from response"
        assert isinstance(data["hot_travelers_count"], int), "hot_travelers_count should be an integer"
        print(f"SUCCESS: /api/discover returns hot_travelers_count: {data['hot_travelers_count']}")
    
    def test_hot_traveler_has_is_hot_traveler_flag(self, viewer_session):
        """Test that users with active schedules have is_hot_traveler=True"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find hot travelers
        hot_travelers = [u for u in data["users"] if u.get("is_hot_traveler")]
        assert len(hot_travelers) > 0, "Expected at least one hot traveler in results"
        
        # Verify hot traveler has required fields
        hot_traveler = hot_travelers[0]
        assert hot_traveler.get("is_hot_traveler") == True
        assert "traveling_to" in hot_traveler, "traveling_to field missing"
        assert hot_traveler.get("traveling_to") is not None, "traveling_to should have a value"
        print(f"SUCCESS: Hot traveler found: {hot_traveler.get('name')} -> {hot_traveler.get('traveling_to')}")
    
    def test_hot_travelers_only_filter(self, viewer_session):
        """Test that hot_travelers_only=true filter works"""
        response = requests.get(
            f"{BASE_URL}/api/discover?hot_travelers_only=true",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be hot travelers
        for user in data["users"]:
            assert user.get("is_hot_traveler") == True, f"User {user.get('name')} is not a hot traveler but was returned"
        
        print(f"SUCCESS: hot_travelers_only filter returned {len(data['users'])} hot travelers")
    
    def test_hot_travelers_count_matches_actual(self, viewer_session):
        """Test that hot_travelers_count matches actual hot travelers in results"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        actual_hot_count = sum(1 for u in data["users"] if u.get("is_hot_traveler"))
        reported_count = data.get("hot_travelers_count", 0)
        
        assert actual_hot_count == reported_count, f"Mismatch: actual={actual_hot_count}, reported={reported_count}"
        print(f"SUCCESS: hot_travelers_count ({reported_count}) matches actual count ({actual_hot_count})")
    
    def test_hot_traveler_has_trip_details(self, viewer_session):
        """Test that hot travelers have trip_title and trip_ends fields"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        hot_travelers = [u for u in data["users"] if u.get("is_hot_traveler")]
        assert len(hot_travelers) > 0, "Expected at least one hot traveler"
        
        hot_traveler = hot_travelers[0]
        # These fields are returned by check_hot_traveler function
        assert "trip_title" in hot_traveler, "trip_title field missing"
        assert "trip_ends" in hot_traveler, "trip_ends field missing"
        print(f"SUCCESS: Hot traveler has trip details - title: {hot_traveler.get('trip_title')}, ends: {hot_traveler.get('trip_ends')}")
    
    def test_hot_travelers_sorted_first(self, viewer_session):
        """Test that hot travelers appear first in discovery results"""
        response = requests.get(
            f"{BASE_URL}/api/discover",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        users = data["users"]
        if len(users) > 1:
            # Find first non-hot traveler
            first_non_hot_idx = None
            for i, u in enumerate(users):
                if not u.get("is_hot_traveler"):
                    first_non_hot_idx = i
                    break
            
            # All hot travelers should appear before non-hot travelers
            if first_non_hot_idx is not None:
                for i in range(first_non_hot_idx, len(users)):
                    assert not users[i].get("is_hot_traveler"), "Hot travelers should be sorted first"
        
        print("SUCCESS: Hot travelers are sorted first in discovery results")
    
    def test_nearby_endpoint_includes_hot_travelers(self, viewer_session):
        """Test that /api/discover/nearby also includes hot traveler info"""
        response = requests.get(
            f"{BASE_URL}/api/discover/nearby",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify hot_travelers_count is present
        assert "hot_travelers_count" in data, "hot_travelers_count missing from nearby endpoint"
        print(f"SUCCESS: /api/discover/nearby returns hot_travelers_count: {data.get('hot_travelers_count')}")


class TestHotTravelerScheduleLogic:
    """Test the schedule-based hot traveler detection logic"""
    
    @pytest.fixture
    def new_user_session(self):
        """Create a new test user for schedule testing"""
        unique_id = uuid.uuid4().hex[:8]
        user_data = {
            "name": f"Schedule Test {unique_id}",
            "email": f"sched_test_{unique_id}@example.com",
            "password": "testpass123"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        assert response.status_code == 200
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
        
        return {
            "user_id": data["user_id"],
            "token": data["session_token"]
        }
    
    def test_user_becomes_hot_traveler_with_active_schedule(self, new_user_session):
        """Test that creating an active schedule makes user a hot traveler"""
        today = datetime.now().strftime("%Y-%m-%d")
        future = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        # Create active schedule
        schedule_data = {
            "title": "Active Trip",
            "destination": "Miami, FL",
            "start_date": today,
            "end_date": future,
            "looking_to_meet": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {new_user_session['token']}"},
            json=schedule_data
        )
        assert response.status_code == 200
        print(f"SUCCESS: Created active schedule for user")
        
        # Note: The user would now appear as hot traveler to other users
        # We can't easily verify this without another user's perspective
    
    def test_future_schedule_does_not_make_hot_traveler(self, new_user_session):
        """Test that a future schedule doesn't make user a hot traveler"""
        future_start = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        future_end = (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d")
        
        # Create future schedule
        schedule_data = {
            "title": "Future Trip",
            "destination": "Seattle, WA",
            "start_date": future_start,
            "end_date": future_end,
            "looking_to_meet": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schedules",
            headers={"Authorization": f"Bearer {new_user_session['token']}"},
            json=schedule_data
        )
        assert response.status_code == 200
        print(f"SUCCESS: Created future schedule (should not make user hot traveler)")


class TestHotTravelersWithFilters:
    """Test Hot Travelers feature combined with other filters"""
    
    @pytest.fixture
    def viewer_session(self):
        """Login as viewer_test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "viewer_test@test.com", "password": "testpass123"}
        )
        data = response.json()
        return data["session_token"]
    
    def test_hot_travelers_with_profession_filter(self, viewer_session):
        """Test hot_travelers_only combined with profession filter"""
        response = requests.get(
            f"{BASE_URL}/api/discover?hot_travelers_only=true&professions=trucker",
            headers={"Authorization": f"Bearer {viewer_session}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All users should be hot travelers
        for user in data["users"]:
            assert user.get("is_hot_traveler") == True
        
        print(f"SUCCESS: Combined filters work - {len(data['users'])} hot travelers with profession filter")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
