# replit.md

## Overview
TurnPage is a choose-your-own-adventure mobile web application designed for interactive storytelling with branching narratives. It includes user authentication, reading progress tracking, and a premium content system utilizing virtual currency. The application is optimized for mobile devices and built as a Progressive Web App (PWA).

## User Preferences
Preferred communication style: Simple, everyday language.
User feedback: Very appreciative of thorough help and comprehensive solutions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite
- **Theme**: Dark-mode-first design with custom rose-gold and gold accents.
- **Mobile-First Design**: PWA with service worker and manifest, responsive UI, bottom navigation, and full-screen swipe gestures for story navigation. Professional typography with multiple serif font options.
- **Flexible Story Structure**: Choice points can be positioned at any page (not fixed to page 5), eggplant costs are configurable per choice.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit's OIDC authentication system with Passport.js
- **Session Management**: express-session with PostgreSQL store
- **Database ORM**: Drizzle ORM
- **Database**: Neon serverless PostgreSQL
- **API Design**: Clean, unified RESTful APIs.
- **Storage**: Single-class storage layer with complete CRUD operations.
- **File Structure**: Organized into `index.ts` (main server), `auth.ts` (authentication), `routes.ts` (API endpoints), `storage.ts` (database operations), `db.ts` (database connection), and `vite.ts` (development server).

### Key Components
- **Database Schema**: Includes Users, Stories, Story Nodes, Story Choices, Reading Progress, User Choices, and Sessions.
- **Authentication System**: Replit OIDC, PostgreSQL-backed sessions (7-day TTL), automatic user creation/updates, HTTPS-only cookies.
- **Content Management**: Flexible page-based storytelling, content filtering by audience (categories) and spice levels (1-3 chili peppers), eggplant-gated premium content with configurable costs.
- **Payment Integration**: Stripe for payment processing, virtual diamond system, multiple diamond purchase tiers.
- **Story Creation System**: Visual story creator with choice nodes (circles) and ending nodes (squares), supporting endless branching.
- **User System**: Four-tier system (guest, registered, admin, mega-admin) with role-based access control.
- **Reading Experience**: Kindle-like interface with advanced typography, automatic story position saving/restoration for all users, touch navigation with swipe gestures.
- **Deployment Strategy**: Vite for frontend build, esbuild for backend, static files served from `dist/public`, Node.js (ES module support), PostgreSQL, HTTPS. Scalability via serverless database, database-backed sessions, CDN for static assets, and stateless API design.

## External Dependencies

### Core Technologies
- **Database**: Neon serverless PostgreSQL
- **Authentication**: Replit OIDC service
- **Payments**: Stripe API
- **UI Components**: Radix UI primitives with shadcn/ui
- **Fonts**: Google Fonts

### Development Tools
- **Build System**: Vite
- **Code Quality**: ESLint and TypeScript strict mode
- **Database Migrations**: Drizzle Kit

### Third-Party Libraries
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with class-variance-authority
- **Icons**: Lucide React
- **Date Handling**: date-fns