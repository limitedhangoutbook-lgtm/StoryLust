# TurnPage - Quick Share for AI Assistants

## What is TurnPage?
A mobile-first Progressive Web App for interactive erotica stories with premium content unlocked via eggplant currency (🍆).

## Key Context for AI Assistants
- **NEVER use "node" terminology** - User strongly dislikes this. Always use "page" instead.
- **Page-based navigation**: Stories have exactly 5 pages before first choice point
- **Premium system**: Users spend 2-5 eggplants to unlock premium story branches
- **Target audience**: Initially str8-to-gay content, expanding to omegaverse
- **Mobile-optimized**: Kindle-like reading experience with swipe navigation

## Current Status (Fully Working)
✅ Authentication system with Replit OIDC  
✅ 5 complete stories with branching narratives  
✅ Premium choice purchase system  
✅ Reading progress tracking  
✅ User data persistence  
✅ Mobile-responsive design  

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- ORM: Drizzle with proper schema relationships
- Authentication: Session-based with PostgreSQL store

## Recent Fixes
- Migrated entire codebase from "node" to "page" terminology
- Fixed premium choice toast messages (alreadyOwned bug)
- Comprehensive testing of all user flows completed

## For Development Work
- User preferences documented in `replit.md`
- Database uses page-based schema (story_pages, not story_nodes)
- All APIs return page numbers, not node IDs
- Premium paths stored with proper user ownership tracking

## Sample Data
- User has 83 eggplants (spent 17 on premium choices)
- Alpha Academy Chronicles: 16 pages with omegaverse content
- Desert Seduction: 10 pages with diverse choice branches
- Premium choices cost 2-5 eggplants each

Use this context when helping with TurnPage development or feature discussions.