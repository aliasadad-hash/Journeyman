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

### Travel Schedules (Jan 2026)
- [x] Create travel schedule with destination, dates
- [x] Option to mark "looking to meet"
- [x] View other users' public schedules
- [x] Nearby travelers discovery

### Notifications (Jan 2026)
- [x] In-app notifications for new matches
- [x] Super Like notifications
- [x] New message notifications
- [x] Unread count badge
- [x] Mark as read functionality

## Technical Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Emergent Auth + JWT
- **Real-time**: WebSockets

## API Endpoints
- Auth: /api/auth/register, /api/auth/login, /api/auth/session, /api/auth/me, /api/auth/logout
- Profile: /api/profile, /api/profile/photo, /api/profile/verify, /api/profile/{user_id}
- Discovery: /api/discover, /api/discover/nearby, /api/discover/action, /api/matches, /api/likes-received
- Premium: /api/boost
- Chat: /api/conversations, /api/chat/{user_id}, /api/chat/{user_id}/read, /api/chat/{user_id}/typing
- Schedules: /api/schedules, /api/schedules/{id}, /api/schedules/user/{user_id}, /api/schedules/nearby
- Notifications: /api/notifications, /api/notifications/{id}/read, /api/notifications/read-all
- Misc: /api/icebreakers/prompts

## Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 100% (All UI flows working)

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

### P2 - Medium Priority
- [ ] Video profile option
- [ ] Premium subscription system
- [ ] Route matching for truckers
- [ ] Flight schedule integration
- [ ] Group chat for travelers

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

## Last Updated
January 31, 2026 - Premium MVP Complete with all requested features
