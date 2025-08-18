# replit.md

## Overview
Wild Branch is a choose-your-own-adventure mobile web application designed for interactive storytelling with branching narratives. It includes user authentication, reading progress tracking, and a premium content system utilizing virtual currency. The application is optimized for mobile devices and built as a Progressive Web App (PWA).

## User Preferences
Preferred communication style: Simple, everyday language.
User feedback: Very appreciative of thorough help and comprehensive solutions.
Story Map Design: Implemented user's bubble design specifications with eggplant purple color scheme, two-word names, and proper content filtering.
Color Preference: Eggplant purple tones for premium content instead of pink/bright colors.
Graph Terminology: Standard "node" terminology is acceptable for technical graph visualization components.

## System Architecture

### Current State (V1.2 Streamlined Navigation)
- **Production-ready core functionality** with solid technical foundation and complete codebase cleanup
- **Phase 1 Complete**: Modular architecture integrated directly into V1.2 system
- **Analytics Enhancement**: Choice purchasing and user actions now tracked with conversion metrics
- **Architectural Improvement**: Added story engine abstraction while maintaining existing functionality
- **Code Quality**: All debug statements removed, LSP errors resolved, production-ready error handling
- **Navigation System**: Completely rebuilt swipe navigation with improved sensitivity and reliability - both swipe and button navigation working properly
- **Streamlined Story Navigation (V1.2)**: Replaced complex story maps with elegant jump menu system to maintain reader flow state and reduce cognitive load
- **UX Philosophy**: Adopted "edging" flow state approach - breadcrumb navigation and compact jump menus prevent spoilers while enabling easy story exploration
- **Premium Choice UX**: Enhanced premium choices with soft confirmation modals and "Sign In to Unlock" buttons for logged-out users, improving conversion flow
- **Payment Processor Research**: Evaluated Epoch and SegPay as Stripe alternatives for adult content - keeping Stripe for now but migration plan ready if needed
- **Advanced Analytics System**: Implemented comprehensive premium choice analytics tracking interest rates, purchase completion rates, A/B testing capabilities, and preview mode for testing without payments
- External validation: ChatGPT assessment confirms modern tech stack and clean structure

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
- **Story Navigation System**: Clean jump menu interface with unlocked pages and premium content preview, designed to maintain flow state without spoilers.
- **User System**: Four-tier system (guest, registered, admin, mega-admin) with role-based access control.
- **Reading Experience**: Kindle-like interface with advanced typography, automatic story position saving/restoration for all users, touch navigation with swipe gestures.
- **Deployment Strategy**: Vite for frontend build, esbuild for backend, static files served from `dist/public`, Node.js (ES module support), PostgreSQL, HTTPS. Scalability via serverless database, database-backed sessions, CDN for static assets, and stateless API design.

### Future Architecture (V2.0+ Roadmap)
- **Modular Design**: Planned decoupling of story engine, auth providers, and content management
- **Enhanced UX**: Emotion-driven components with tension mechanics and visual breadcrumbs
- **Analytics Layer**: A/B testing framework and conversion optimization
- **Scalability**: Plugin-based architecture for multi-provider auth and swappable monetization strategies
- See `ARCHITECTURE_ROADMAP.md` for detailed implementation plan

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