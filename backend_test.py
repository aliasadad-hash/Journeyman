#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import base64

class JourneymanAPITester:
    def __init__(self, base_url="https://travel-match-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            self.user_id = response['user_id']
            return True, response
        return False, {}

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not hasattr(self, 'test_email'):
            return False, {}
            
        login_data = {
            "email": self.test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            self.user_id = response['user_id']
            return True, response
        return False, {}

    def test_auth_me(self):
        """Test getting current user data"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_profile_update(self):
        """Test profile update"""
        profile_data = {
            "bio": "Updated test bio",
            "profession": "trucker",
            "location": "Los Angeles, CA",
            "age": 30,
            "interests": ["Travel", "Music"]
        }
        return self.run_test("Profile Update", "PUT", "profile", 200, profile_data)

    def test_complete_onboarding(self):
        """Test completing onboarding"""
        onboarding_data = {
            "bio": "Test bio for onboarding",
            "profession": "airline",
            "location": "New York, NY",
            "age": 28,
            "interests": ["Adventure", "Photography"]
        }
        return self.run_test("Complete Onboarding", "POST", "profile/complete-onboarding", 200, onboarding_data)

    def test_photo_upload(self):
        """Test photo upload"""
        # Create a simple base64 encoded test image
        test_image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        photo_data = {
            "photo_data": test_image_b64
        }
        return self.run_test("Photo Upload", "POST", "profile/photo", 200, photo_data)

    def test_discovery(self):
        """Test user discovery"""
        return self.run_test("User Discovery", "GET", "discover", 200)

    def test_discovery_with_filter(self):
        """Test user discovery with profession filter"""
        return self.run_test("Discovery with Filter", "GET", "discover?professions=trucker,airline", 200)

    def test_match_action(self):
        """Test match action (like/pass)"""
        # First get some users to match with
        success, response = self.run_test("Get Users for Matching", "GET", "discover", 200)
        
        if success and response.get('users'):
            target_user_id = response['users'][0]['user_id']
            return self.run_test("Match Action (Like)", "POST", f"discover/action?target_user_id={target_user_id}&action=like", 200)
        else:
            self.log_test("Match Action (Like)", False, "No users available for matching")
            return False, {}

    def test_get_matches(self):
        """Test getting matches"""
        return self.run_test("Get Matches", "GET", "matches", 200)

    def test_travel_schedules(self):
        """Test travel schedule CRUD operations"""
        # Create schedule
        schedule_data = {
            "title": "Test Trip",
            "destination": "San Francisco, CA",
            "start_date": "2025-02-01",
            "end_date": "2025-02-05",
            "notes": "Business trip"
        }
        
        success, response = self.run_test("Create Schedule", "POST", "schedules", 200, schedule_data)
        
        if success:
            # Get schedules
            self.run_test("Get My Schedules", "GET", "schedules", 200)
            
            # Delete schedule if we got an ID
            if 'schedule_id' in response:
                schedule_id = response['schedule_id']
                self.run_test("Delete Schedule", "DELETE", f"schedules/{schedule_id}", 200)
        
        return success, response

    def test_notifications(self):
        """Test notification endpoints"""
        # Get notifications
        self.run_test("Get Notifications", "GET", "notifications", 200)
        
        # Get unread count
        self.run_test("Get Unread Count", "GET", "notifications/unread-count", 200)
        
        # Mark all as read
        return self.run_test("Mark All Read", "POST", "notifications/read-all", 200)

    def test_conversations(self):
        """Test conversation endpoints"""
        return self.run_test("Get Conversations", "GET", "conversations", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Journeyman API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 50)

        # Test root endpoint
        self.test_root_endpoint()

        # Test authentication flow
        reg_success, reg_response = self.test_user_registration()
        
        if reg_success:
            # Store test user email for login test
            self.test_email = reg_response.get('email')
            
            # Test auth endpoints
            self.test_auth_me()
            
            # Test profile endpoints
            self.test_complete_onboarding()
            self.test_profile_update()
            self.test_photo_upload()
            
            # Test discovery and matching
            self.test_discovery()
            self.test_discovery_with_filter()
            self.test_match_action()
            self.test_get_matches()
            
            # Test travel schedules
            self.test_travel_schedules()
            
            # Test notifications
            self.test_notifications()
            
            # Test conversations
            self.test_conversations()
            
        else:
            print("❌ Registration failed, skipping authenticated tests")

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Tests Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = JourneymanAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())