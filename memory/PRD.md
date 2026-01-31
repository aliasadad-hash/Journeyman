# Journeyman - PRD (Product Requirements Document)

## Original Problem Statement
Build a dating app named "Journeyman" for men who travel frequently for work (truck drivers, airline employees, military personnel), men who are vacationing, and men interested in meeting travelers ("admirers").

## User Personas
1. **Truckers** - Long-haul drivers seeking connections on the road
2. **Airline Employees** - Pilots, flight attendants with frequent travel schedules
3. **Military Personnel** - Service members often relocating or deployed
4. **Admirers** - People interested in dating travelers
5. **Vacationers** - People traveling for leisure wanting to meet locals or other travelers

## Core Requirements
- **App Name**: Journeyman
- **Color Scheme**: "Popping Blue" base (#0B1120) with Gold/Yellow (#EAB308) text
- **Authentication**: Both JWT custom auth and Google Social Login
- **User Types**: Trucker, Airline, Military, Admirer, Vacationer

## Features Implemented ✅
### Authentication (Jan 2026)
- [x] Email/password registration and login
- [x] Google OAuth integration via Emergent Auth
- [x] JWT session management with cookies
- [x] Session persistence across page reloads

### Profile Management (Jan 2026)
- [x] User profile creation with profession selection
- [x] Multi-step onboarding flow
- [x] Profile photo upload (base64 encoded)
- [x] Bio, location, age, interests fields
- [x] Profile editing functionality

### Discovery & Matching (Jan 2026)
- [x] Browse other users with card-based UI
- [x] Filter by profession (multi-select)
- [x] Like/Pass actions on profiles
- [x] Mutual match detection with notifications
- [x] View matched users list

### Messaging (Jan 2026)
- [x] Real-time chat between matched users
- [x] Conversation list with unread counts
- [x] Message history persistence
- [x] WebSocket support for live updates

### Travel Schedules (Jan 2026)
- [x] Create travel schedule with destination, dates, notes
- [x] View personal schedule list
- [x] Delete schedules
- [x] View other users' public schedules

### Notifications (Jan 2026)
- [x] In-app notifications for new matches
- [x] Notifications for new messages
- [x] Unread count badge
- [x] Mark as read functionality

## Technical Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Emergent Auth + JWT

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] AI-powered bio generation (GPT-5.2)
- [ ] Ice breaker suggestions (Claude)
- [ ] Smart matching algorithm (Gemini)

### P1 - High Priority
- [ ] Push notifications (mobile/web)
- [ ] Location-based discovery
- [ ] "Vacation Zones" feature for travelers meeting locals
- [ ] Report/block user functionality

### P2 - Medium Priority
- [ ] Multiple profile photos
- [ ] Video profile option
- [ ] Premium subscription features
- [ ] Read receipts in chat
- [ ] Typing indicators

### P3 - Future Enhancements
- [ ] Route matching for truckers
- [ ] Flight schedule integration for airline employees
- [ ] Group chat for travelers in same area
- [ ] Events/meetups feature

## Architecture Notes
- Backend API prefix: `/api/`
- Frontend communicates via `REACT_APP_BACKEND_URL`
- MongoDB collections: users, user_sessions, matches, messages, schedules, notifications
- Session tokens stored in httpOnly cookies with 7-day expiry

## Last Updated
January 31, 2026 - MVP Complete
