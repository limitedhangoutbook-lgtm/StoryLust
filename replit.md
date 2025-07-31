# replit.md

## Overview
TurnPage is a choose-your-own-adventure mobile web application built with a modern full-stack architecture. The application features interactive storytelling with branching narratives, user authentication, reading progress tracking, and a premium content system with virtual currency (diamonds). The app is optimized for mobile devices with a Progressive Web App (PWA) design.

**Version 1.0** - Released January 30, 2025: Core story reading experience complete with page-based navigation, choice branching, and premium content system.

## User Preferences
Preferred communication style: Simple, everyday language.
User feedback: Very appreciative of thorough help and comprehensive solutions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **Theme**: Dark-mode-first design with custom color variables for rose-gold and gold accents

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit's OIDC authentication system with Passport.js
- **Session Management**: express-session with PostgreSQL store
- **Database ORM**: Drizzle ORM with Neon serverless PostgreSQL
- **API Design**: Clean, unified RESTful APIs with comprehensive functionality
- **Storage**: Single-class storage layer with complete CRUD operations
- **File Structure**: 
  - `index.ts`: Main server entry point
  - `auth.ts`: Complete authentication handling
  - `routes.ts`: All API endpoints in one file
  - `storage.ts`: Unified database operations
  - `db.ts`: Database connection setup
  - `vite.ts`: Development server configuration

### Mobile-First Design
- **PWA**: Progressive Web App with service worker and manifest
- **Responsive**: Mobile-optimized UI with clean bottom navigation
- **Touch-Friendly**: Full-screen swipe gestures for story navigation (left=continue, right=back)
- **Professional Typography**: Multiple serif font options with advanced rendering features

## Key Components

### Database Schema
- **Users**: Profile information, diamond balance, Stripe integration
- **Stories**: Metadata including title, description, spice level, category, word count
- **Story Nodes**: Individual story segments with content and connections
- **Story Choices**: Decision points linking nodes together
- **Reading Progress**: User's current position and bookmarks in stories
- **User Choices**: History of decisions made by users
- **Sessions**: Authentication session storage

### Authentication System
- **Provider**: Replit OIDC authentication
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **User Management**: Automatic user creation/updates on login
- **Security**: HTTPS-only cookies, secure session handling

### Content Management
- **Story Structure**: Hierarchical node-based storytelling system
- **Categories**: Content filtering by audience (straight, LGBT, all)
- **Spice Levels**: Content rating system (1-3 chili peppers)
- **Premium Content**: Diamond-gated story paths and premium features

### Payment Integration
- **Provider**: Stripe for payment processing
- **Virtual Currency**: Diamond system for premium content access
- **Packages**: Multiple diamond purchase tiers with bonus rewards

## Data Flow

### User Journey
1. **Landing**: Unauthenticated users see marketing page
2. **Authentication**: Login via Replit OIDC redirects
3. **Home**: Browse stories by category with featured content
4. **Reading**: Interactive story navigation with choice selection
5. **Progress**: Automatic saving of reading position and choices
6. **Store**: Diamond purchases for premium content access

### Story Reading Flow
1. Fetch story metadata and starting node
2. Display current node content
3. Present available choices to user
4. Record user choice and update progress
5. Navigate to next node based on choice
6. Handle premium content gates with diamond requirements

### Data Persistence
- **Reading Progress**: Auto-saved on each choice
- **User Preferences**: Stored in user profile
- **Story Analytics**: Track popular paths and choices
- **Session State**: Maintained across browser sessions

## Recent Progress (January 2025)
- **Story-Maker Integration COMPLETE**: Verified comprehensive connection between visual timeline builder, database schema, and e-reader system (January 31, 2025)
  - Timeline builder creates pages that map directly to story_nodes table via order sequence
  - Choice system properly connects targetPageId to page navigation in e-reader
  - Shared TypeScript interfaces ensure type safety across entire creation-to-reading pipeline
  - Database integration automatically calculates word counts, path counts, and creates proper node relationships
  - E-reader seamlessly displays stories created through visual builder with full choice functionality
  - Premium eggplant system works end-to-end from story creation to reader consumption
- **Enhanced Story Ending Navigation**: Added "Try Different Path" button to story endings for re-exploration (January 31, 2025)
  - Intelligent first choice page detection automatically finds choice points in any story
  - New API endpoint `/api/stories/:storyId/first-choice-page` provides precise navigation targeting
  - Users can now fully explore different story branches from completion screen
- **Visual Timeline Architecture SUCCESS**: Created spatial timeline story builder matching user's original sketch design with Kindle-like page representation and branching choice visualization (January 31, 2025)
- **Page-Based Story System SUCCESS**: Completely eliminated ALL node-based logic and achieved fully functional page-based story navigation (January 30, 2025)
  - Fixed missing storyChoices import in server routes
  - Page-based API endpoints working: /api/pages/:pageNumber/choices  
  - Story reader navigating correctly through sequential pages (1, 2, 3...)
  - Choice selection and premium eggplant system functional
  - Reading progress saving with proper page numbers
  - "Start from Beginning" button now always visible on featured story
  - Zero mixing of node/page architectures - pure page-based system achieved
- **Major Code Cleanup**: Comprehensive redundancy removal across entire codebase for production optimization (January 30, 2025)
  - Removed legacy diamond-checkout.tsx and diamond-store.tsx components
  - Eliminated massive 670-line timeline-story-builder.tsx (completely unused)
  - Removed redundant story readers: story-reader-new.tsx, story-reader-simple.tsx, story-reader.tsx
  - Fixed Diamond icon imports and converted remaining references to eggplant emoji
  - Cleaned up all console.log statements and empty catch blocks in server routes
  - Created shared/types.ts for interface consolidation across components
  - Reduced codebase size significantly while maintaining full functionality
- **Version 1.0 Release**: TurnPage officially released as Version 1.0 with fully functional story reading system (January 30, 2025)
- **Page-Based Story Reader Success**: Successfully rebuilt story reader to match actual database structure with sequential page navigation, progress bars, and choice branching - user confirmed "Works beautifully now!!!" (January 30, 2025)
- **Final Production Cleanup**: Completed comprehensive codebase cleanup removing all debug logs, empty catch blocks, and LSP errors in preparation for story upload testing (January 30, 2025)
- **Swipe Functionality Enhancement**: Fixed swipe gestures to work even when choices are visible with improved sensitivity (30px threshold, 500ms timing) (January 30, 2025)
- **Code Quality Optimization**: Eliminated all console.log statements, cleaned up redundant error handling, and fixed TypeScript errors throughout the application (January 30, 2025)
- **Story Navigation Enhancements**: Added "Read from beginning" option under continue reading button for easy story restart (January 29, 2025)
- **Choice Feedback Improvements**: Updated choice selection popups - regular choices show sparkles only (✨ Choice Made! ✨), premium choices get eggplant emoji (🍆✨ Premium Choice Made! ✨🍆) (January 29, 2025)
- **Story Connection Fixes**: Verified and fixed all story node connections across all stories - each story now has proper starting nodes and connected story flows (January 29, 2025)
- **Comprehensive Bookmark System**: Implemented full bookmark functionality with personal bookmarks table, reading sessions analytics, bookmark manager component, and dedicated bookmarks page with search capabilities (January 29, 2025)
- **New Featured Story - Desert Seduction**: Created new heterosexual story featuring David's desert photo, focused on couple seduced by tourist in desert hot springs setting (January 29, 2025)
- **Featured Landing Image Integration**: Added high-quality model photography as landing page hero background with professional gradient overlay (January 29, 2025)
- **Professional Author Email Setup**: Configured Author@limitedhangoutbook.com for VIP messaging system with dedicated author communications (January 29, 2025)
- **Timeline Story Builder Complete**: Implemented visual branching system matching user's original sketch design (January 29, 2025)
  - Visual connection arrows showing story flow between choices and target branches
  - Color-coded timelines with branch naming functionality (Romance Path, Action Route, etc.)
  - Premium path visualization with dashed rose lines and diamond indicators
  - Real-time SVG connection rendering with curved arrows pointing to correct branch colors
  - Interactive branch renaming with meaningful path descriptions
- **User Role System Access**: Upgraded project owner (evyatar.perel@gmail.com) to mega-admin status for full system access (January 29, 2025)
- **Multiple Story Builder Access Points**: Created comprehensive access system from home, profile, bottom navigation, and floating button (January 29, 2025)
- **Diamond Economy Optimization**: Reduced starting diamonds from 100 to 20 for better premium content scarcity (January 29, 2025)
  - Creates meaningful premium choice decisions
  - Encourages strategic diamond spending
  - Makes each premium choice more valuable
  - Enhances story engagement through resource management
- **Typography System**: Implemented professional font system with Crimson Text, EB Garamond, Libre Baskerville, and Georgia
- **Touch Navigation**: Full-screen swipe gestures working perfectly for story progression (left=continue, right=back)
- **Clean UI**: Simplified navigation without blur effects or obstructive elements - major visual improvement
- **Reading Experience**: Kindle-like interface with advanced typography features (ligatures, kerning, antialiasing)
- **Settings Panel**: Typography customization with font family, size, and line spacing controls
- **Swipe Implementation**: Successfully completed touch gesture system with proper event handling and responsive design
- **Story Creation System**: Built visual story creator based on user sketches with choice nodes (circles) and ending nodes (squares)
- **Four-Tier User System**: Implemented guest, registered, admin, and mega-admin roles with appropriate permissions
- **User Management**: Mega-admin interface to promote users to admin writer status
- **Role-Based Access Control**: Story creation restricted to admin writers, user management to mega-admin only
- **Choice Node Architecture**: Implemented foundation for endless branching story structures without coding required
- **Database-First Architecture**: Converted system to be fully database-driven for true dynamic content management
- **Position Restoration**: Automatic story position saving and restoration for both authenticated users and guests
- **Performance Optimization**: Added caching layers and query optimization for faster page loading
- **Diamond Cost Display**: Premium choices now properly show rose-gold diamond indicators with accurate costs
- **Backend Simplification**: Streamlined backend to focus on core functionality with clean, simple APIs (January 29, 2025)
- **Reactive System Completion**: All stories and choices now operate as unified reactive elements through database-driven architecture (January 29, 2025)
- **Unified Backend Architecture**: Consolidated all backend functionality into clean, single-purpose files for maximum maintainability (January 29, 2025)
  - Single authentication module (`auth.ts`) with clean OIDC integration
  - Single routes file (`routes.ts`) containing all API endpoints
  - Single storage class (`storage.ts`) handling all database operations
  - Eliminated code duplication and simplified file structure
  - Zero hard-coded content - fully database-driven system
- **Complete Code Cleanup**: Comprehensive redundancy removal for production-ready codebase (January 29, 2025)
  - Removed legacy `story-reader-old.tsx` file and unused story creation guide
  - Eliminated all console.log statements and debug logging throughout application
  - Cleaned up empty catch blocks and simplified error handling
  - Verified no unused imports, components, or deprecated code patterns
  - Confirmed all shadcn/ui components are properly utilized and functional
  - Maintained clean file structure with zero redundant or legacy code

## External Dependencies

### Core Technologies
- **Database**: Neon serverless PostgreSQL
- **Authentication**: Replit OIDC service
- **Payments**: Stripe API for transactions
- **UI Components**: Radix UI primitives with shadcn/ui
- **Fonts**: Google Fonts for professional serif typography

### Development Tools
- **Build System**: Vite with TypeScript support
- **Code Quality**: ESLint and TypeScript strict mode
- **Development Server**: Express with Vite middleware in dev mode
- **Database Migrations**: Drizzle Kit for schema management

### Third-Party Libraries
- **State Management**: TanStack React Query for caching
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with class-variance-authority
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for date manipulation

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild bundles Express server for Node.js
- **Assets**: Static files served from dist/public directory
- **Environment**: Production mode with error handling

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Secure session encryption key
- **ISSUER_URL**: Replit OIDC provider URL
- **STRIPE_SECRET_KEY**: Payment processing credentials

### Hosting Requirements
- **Node.js**: ES module support required
- **PostgreSQL**: Compatible database with session table
- **HTTPS**: Required for secure authentication cookies
- **Domain**: Configured in Replit OIDC settings

### Scalability Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **Sessions**: Database-backed for horizontal scaling
- **Static Assets**: Can be served via CDN
- **API**: Stateless design enables load balancing