# Wild Branch - Quick Share for AI Assistants

## What is Wild Branch?
A mobile-first Progressive Web App for interactive erotica stories with premium content unlocked via eggplant currency (🍆).

## Key Context for AI Assistants
- **NEVER use "node" terminology** - User strongly dislikes this. Always use "page" instead.
- **Page-based navigation**: Flexible system - stories can have choice points at any page (current examples use page 5 for testing)
- **Premium system**: Flexible eggplant costs - can be any amount (current examples use 2-5 eggplants)
- **Target audience**: Initially str8-to-gay content, expanding to all genres (not just omegaverse)
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

## Sample Data (Current Test Examples)
- User has 83 eggplants (spent 17 on premium choices)
- Alpha Academy Chronicles: 16 pages with omegaverse content
- Desert Seduction: 10 pages with diverse choice branches
- Current test stories have first choice on page 5 and premium costs of 2-5 eggplants (system supports any values)

Use this context when helping with WildBranch development or feature discussions.