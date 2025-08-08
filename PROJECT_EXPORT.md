# Wild Branch Project Export

## Project Overview
Wild Branch is a Progressive Web App for choose-your-own-adventure erotica stories featuring a premium content system with virtual eggplant currency.

## Key Features
- Interactive storytelling with branching narratives
- Four-tier user system (guest, registered, admin, mega-admin)
- Premium content unlocked with eggplant currency
- Kindle-like reading experience with professional typography
- Flexible page-based story navigation (choice points can be at any page)
- Persistent progress tracking and premium path ownership

## Technical Architecture

### Frontend
- React 18 + TypeScript
- Wouter for routing
- TanStack React Query for state management
- Tailwind CSS + shadcn/ui components
- Progressive Web App (PWA) with service worker

### Backend
- Node.js + Express.js
- TypeScript with ES modules
- Replit OIDC authentication
- PostgreSQL with Drizzle ORM
- Session-based authentication

### Database Schema
- Users (with eggplant currency)
- Stories and Story Pages (page-based navigation)
- Story Choices (free and premium)
- Reading Progress tracking
- Purchased Premium Paths
- User Choice History

## Current Status
- ✅ Complete page-based story system (no "node" terminology)
- ✅ Working eggplant purchase system with proper toast messages
- ✅ User authentication and session management
- ✅ 5 complete stories with premium choice branches
- ✅ Mobile-optimized reading experience
- ✅ Data persistence and progress tracking

## Recent Technical Achievements
- Migrated from node-based to page-based story architecture
- Fixed premium choice toast message bug (alreadyOwned logic)
- Comprehensive testing of all user flows
- Database schema optimization for scalability

## File Structure
```
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/              # TypeScript schemas and types
├── replit.md           # Project documentation and preferences
└── attached_assets/    # Story content and images
```

## For AI Assistant Context
When working with this project:
1. User strongly dislikes "node" terminology - use "page" everywhere
2. Premium content uses flexible eggplant currency (🍆) - any cost amount supported
3. Stories target str8-to-gay audience initially, expanding to all genres
4. Mobile-first design with PWA capabilities
5. Flexible page-based navigation: choice points can be positioned at any page

## Test Data
- User ID: 45675951
- Current eggplants: 83 (spent 17 on premium choices)
- Stories: Desert Seduction, Alpha Academy Chronicles, Campus Encounter, etc.
- Premium choice costs: 2-5 eggplants each

## Deployment
- Runs on Replit with PostgreSQL database
- Environment variables for authentication and database
- Ready for production deployment via Replit Deployments