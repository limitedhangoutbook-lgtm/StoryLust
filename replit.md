# replit.md

## Overview
TurnPage is a choose-your-own-adventure mobile web application built with a modern full-stack architecture. The application features interactive storytelling with branching narratives, user authentication, reading progress tracking, and a premium content system with virtual currency (diamonds). The app is optimized for mobile devices with a Progressive Web App (PWA) design.

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
- **API Design**: RESTful APIs with structured error handling

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
- **Typography System**: Implemented professional font system with Crimson Text, EB Garamond, Libre Baskerville, and Georgia
- **Touch Navigation**: Full-screen swipe gestures working perfectly for story progression (left=continue, right=back)
- **Clean UI**: Simplified navigation without blur effects or obstructive elements - major visual improvement
- **Reading Experience**: Kindle-like interface with advanced typography features (ligatures, kerning, antialiasing)
- **Settings Panel**: Typography customization with font family, size, and line spacing controls
- **Swipe Implementation**: Successfully completed touch gesture system with proper event handling and responsive design
- **Story Creation System**: Built visual story creator based on user sketches with choice nodes (circles) and ending nodes (squares)
- **Admin-Only Access**: Restricted story creation to authorized partners only via email whitelist
- **Choice Node Architecture**: Implemented foundation for endless branching story structures without coding required

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