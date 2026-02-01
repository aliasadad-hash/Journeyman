# Journeyman - PRD (Product Requirements Document)

## Original Problem Statement
Build a premium dating app named "Journeyman" for men who travel frequently for work (truck drivers, airline employees, military personnel), men who are vacationing, and men interested in meeting travelers ("admirers").

## User Personas
1. **Truckers** - Long-haul drivers seeking connections on the road
2. **Airline Employees** - Pilots, flight attendants with frequent travel schedules
3. **Military Personnel** - Service members often relocating or deployed
4. **Admirers** - People interested in dating travelers
5. **Vacationers** - People traveling for leisure wanting to meet locals or other travelers

## Core Requirements
- **App Name**: Journeyman
- **Color Scheme**: Deep midnight blue (#0B1120) with gold (#EAB308) accents
- **Authentication**: Both JWT custom auth and Google Social Login
- **User Types**: Trucker, Airline, Military, Admirer, Vacationer

## Premium Features Implemented ✅

### UI/UX (Jan 2026)
- [x] Swipe-based Tinder-style card interface with drag gestures
- [x] Glassmorphism effects throughout the app
- [x] Micro-animations (fade, slide, scale, glow effects)
- [x] Premium button styles with hover shimmer effects
- [x] Photo gallery with dot indicators
- [x] Match modal with celebration animation
- [x] Responsive mobile-first design
- [x] Dark theme with CARTO dark map tiles
- [x] **Athletic/Casual/Artistic silhouette backgrounds on landing page** (Jan 31, 2026)
- [x] **Dynamic breathing animations on silhouettes** (Jan 31, 2026)
- [x] **🔥 Hot Travelers Nearby feature** (Jan 31, 2026)
  - Orange flame badge on user cards with active travel schedules
  - "Hot Travelers in your area!" banner with count
  - Flame toggle button to filter hot travelers only
  - Destination display on hot traveler cards
  - Hot travelers prioritized in discovery results

### Component-Based Architecture (Jan 31, 2026) ✅
- [x] **Refactored from monolithic 1100+ line App.js to 94 lines**
- [x] **13 Page components in `/components/pages/`**
- [x] **3 Shared components in `/components/shared/`**
- [x] **AuthContext for state management in `/context/`**
- [x] **Reusable hooks in `/hooks/`**
- [x] **Utility functions in `/utils/`**

### Backend Modular Architecture (Jan 31, 2026) ✅
- [x] **Refactored from monolithic 1564-line server.py to 163 lines**
- [x] **7 Route modules in `/routes/`**: auth, profile, discovery, chat, schedules, notifications, media, ai
- [x] **Pydantic models in `/models/schemas.py`**
- [x] **Database & WebSocket services in `/services/`**
- [x] **Utility functions in `/utils/helpers.py`**

### AI-Powered Features (Jan 31, 2026) ✅ 
Using Emergent LLM Key for all AI integrations:
- [x] **Bio Generation (GPT-5.2)** - Auto-generate attractive profile bios
  - 4 styles: confident, playful, mysterious, romantic
  - Endpoint: POST /api/ai/generate-bio
- [x] **Ice Breakers (Claude Sonnet 4.5)** - Conversation starters for matches
  - Returns 3 personalized openers based on shared interests
  - Endpoint: GET /api/ai/ice-breakers/{user_id}
- [x] **Smart Matching (Gemini 3 Flash)** - AI-powered compatibility scoring
  - Returns score (0-100), reasons, and conversation topics
  - Endpoint: GET /api/ai/compatibility/{user_id}
  - Batch endpoint: GET /api/ai/compatibility-batch
- [x] **AI First Message (GPT-5.2)** - Perfect opening message generator
  - 4 tones: friendly, flirty, witty, sincere
  - Returns message + confidence score + talking points + why it works
  - Combines compatibility analysis with personalized messaging
  - Endpoint: POST /api/ai/first-message/{user_id}
- [x] **AI Conversation Revival (Claude Sonnet 4.5)** - Re-spark stalling chats ✨ NEW (Feb 1, 2026)
  - Auto-detects when conversations go quiet (24+ hours)
  - Generates 3 playful, personalized re-engagement messages
  - Analyzes WHY the conversation might have stalled
  - Provides tips for keeping conversations flowing
  - Urgency indicator (1-10) for how soon to reach out
  - Endpoint: POST /api/ai/revive-conversation/{user_id}

### Geolocation & Map (Jan 2026)
- [x] Browser geolocation API integration
- [x] Real-time location tracking with permission handling
- [x] Interactive Leaflet map with dark theme tiles
- [x] **City Autocomplete Feature** (Feb 1, 2026)
  - Type 3+ characters to search cities worldwide
  - Uses OpenStreetMap Nominatim API (free, no API key)
  - Shows city, state, country with MapPin icons
  - "Use Current Location" button for quick selection
  - Auto-fills latitude/longitude for accurate nearby matching
  - Endpoint: GET /api/location/cities?q={query}
  - Reverse geocoding: GET /api/location/reverse?lat={lat}&lon={lon}
- [x] **Travelers Passing Through Feature** (Feb 1, 2026) ✨ NEW
  - Shows users with travel schedules passing through your area
  - Displays "Here Now" vs "Arriving Soon" status
  - Configurable time range (7, 14, 30 days)
  - 50-mile radius search from your location
  - Expandable card list with trip details
  - Endpoint: GET /api/discover/passing-through?days_ahead=14&radius_miles=50
- [x] User pins with profile photos as markers
- [x] Custom "You are here" pulsing marker
- [x] Distance calculation using Haversine formula
- [x] Nearby users view (within 50 miles)
- [x] Map/List toggle view modes
- [x] Popup profiles with "View Profile" action
- [x] Online status indicators on map pins
- [x] Automatic profile location updates

### Authentication (Jan 2026)
- [x] Email/password registration and login
- [x] Google OAuth integration via Emergent Auth
- [x] JWT session management with cookies
- [x] Session persistence across page reloads

### Profile Management (Jan 2026)
- [x] Multi-step onboarding flow (4 steps)
- [x] Multiple photo uploads (up to 6 photos)
- [x] Profile verification badges (photo, ID, phone)
- [x] Icebreaker prompts and answers
- [x] Bio, location, age, interests fields
- [x] Profile editing functionality
- [x] Online/offline status indicators
- [x] **Photo Gallery Manager UI** (Feb 1, 2026) ✨ NEW
  - Upload up to 6 photos to profile gallery
  - Set any photo as main profile picture
  - Delete photos from gallery
  - Upload progress indicator
  - Supports JPEG, PNG, WebP (max 10MB)
  - Uses local storage (S3 ready when configured)

### Discovery & Matching (Jan 2026)
- [x] Swipe cards with Like/Pass/Super Like
- [x] Multi-profession filtering
- [x] Super Like feature (limited daily)
- [x] Profile Boost (30-minute priority)
- [x] Mutual match detection with modal
- [x] View likes received
- [x] Nearby users discovery (location-based)

### Messaging (Jan 2026)
- [x] Real-time chat between matched users
- [x] Read receipts with timestamps
- [x] Typing indicators (backend ready)
- [x] Image/GIF/Voice message types (backend ready)
- [x] Conversation list with unread counts
- [x] WebSocket support for live updates
- [x] **GIF picker with GIPHY integration** (Jan 31, 2026)
- [x] **Emoji picker with categories** (Jan 31, 2026)
- [x] **Message reactions (emoji reactions on messages)** (Jan 31, 2026)

### Travel Schedules (Jan 2026)
- [x] Create, view, delete travel schedules
- [x] View other users' travel schedules
- [x] Find nearby travelers
- [x] **Trip Planning Mode** (Feb 1, 2026) ✨ NEW
  - Preview potential meetups BEFORE creating a trip
  - Shows locals at destination + travelers with overlapping dates
  - Automatic notifications when schedules overlap
  - Trip matches summary on schedules page
  - Endpoints:
    - POST /api/schedules/plan-trip (preview meetups)
    - GET /api/schedules/trip-matches (all your trip matches)

### Notifications (Jan 2026)
- [x] In-app notifications for new matches
- [x] Super Like notifications
- [x] New message notifications
- [x] Unread count badge
- [x] Mark as read functionality
- [x] **Notification dropdown in header** (Jan 31, 2026)
- [x] **Notification settings page with toggles** (Jan 31, 2026)

### Social Media Linking (Jan 31, 2026)
- [x] **Social links editor modal on profile page**
- [x] **Twitter/X profile linking**
- [x] **Instagram profile linking**
- [x] **Facebook profile linking**
- [x] **TikTok profile linking**
- [x] **Snapchat profile linking**

### Settings Page (Jan 31, 2026)
- [x] **Notification preferences toggles**
- [x] **Account settings**
- [x] **Privacy settings**

## Technical Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Emergent Auth + JWT
- **Real-time**: WebSockets
- **Maps**: Leaflet.js with CARTO dark tiles

## File Structure (After Refactoring)
```
/app/frontend/src/
├── App.js (94 lines - main router)
├── components/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── AuthCallback.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── MatchesPage.jsx
│   │   ├── ChatsPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── ProfileViewPage.jsx
│   │   ├── SchedulesPage.jsx
│   │   ├── MyProfilePage.jsx
│   │   ├── NearbyPage.jsx
│   │   └── index.js
│   └── shared/
│       ├── Icons.jsx
│       ├── BottomNav.jsx
│       ├── SwipeCard.jsx
│       └── index.js
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useGeolocation.js
└── utils/
    ├── api.js
    └── constants.js
```

## API Endpoints (23 total - all passing)
- Auth: /api/auth/register, /api/auth/login, /api/auth/session, /api/auth/me, /api/auth/logout
- Profile: /api/profile, /api/profile/photo, /api/profile/verify, /api/profile/{user_id}
- Discovery: /api/discover, /api/discover/nearby, /api/discover/action, /api/matches, /api/likes-received
- Premium: /api/boost
- Chat: /api/conversations, /api/chat/{user_id}, /api/chat/{user_id}/read, /api/chat/{user_id}/typing
- Schedules: /api/schedules, /api/schedules/{id}, /api/schedules/user/{user_id}, /api/schedules/nearby
- Notifications: /api/notifications, /api/notifications/{id}/read, /api/notifications/read-all
- Misc: /api/icebreakers/prompts

## Test Results (Jan 31, 2026)
- Backend: 97% (66/68 tests passed including 23 AI feature tests)
- Frontend: 100% (All UI flows and AI components working)
- **AI Features Tested:** Bio Generator (GPT-5.2), Ice Breakers (Claude), Compatibility (Gemini)
- **Backend Refactoring:** Successfully split 1564-line monolith into 8 route modules

## Known Limitations
- Media upload endpoint exists but requires AWS S3 credentials configuration
- AI Compatibility requires complete user profiles (profession, bio, interests) to function

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] AI-powered bio generation (GPT-5.2)
- [ ] Ice breaker suggestions (Claude)
- [ ] Smart matching algorithm (Gemini)

### P1 - High Priority
- [ ] Push notifications (mobile/web)
- [ ] Real-time typing indicators (frontend)
- [ ] Image sharing in chat (frontend)
- [ ] Voice messages (frontend)
- [ ] "Vacation Zones" feature
- [ ] Profile photo upload UI enhancement

### P2 - Medium Priority
- [ ] Video profile option
- [ ] Premium subscription system
- [ ] Route matching for truckers
- [ ] Flight schedule integration
- [ ] Group chat for travelers
- [ ] In-app notifications UI component

### P3 - Future Enhancements
- [ ] Events/meetups feature
- [ ] Travel companion matching
- [ ] Safety features (share location)
- [ ] In-app video calls

## Architecture Notes
- Backend API prefix: `/api/`
- Frontend communicates via `REACT_APP_BACKEND_URL`
- MongoDB collections: users, user_sessions, matches, mutual_matches, messages, schedules, notifications
- Session tokens stored in httpOnly cookies with 7-day expiry
- WebSocket endpoint: /ws/{user_id}

### UI Bug Fixes (Feb 1, 2026)
- [x] **Chat UI Overlap Fix** - Resolved issue where "Made with Emergent" badge could overlap the Send button
  - Added bottom padding to chat input form (pb-16)
  - Set z-index on send button above badge layer (z-[10000])
  - Send button now clearly visible and clickable at all times

## Last Updated
February 1, 2026 - Major UX overhaul: Added hybrid navigation with back buttons, prominent Nearby/Location feature (FAB + banner), enhanced bottom nav with 5 tabs, improved screen interactivity
