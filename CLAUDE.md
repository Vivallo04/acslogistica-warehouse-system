# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**WMS Database Setup:**
Set the following environment variables for MySQL connection:
- `MYSQL_HOST` - MySQL server host (default: localhost)
- `MYSQL_PORT` - MySQL server port (default: 3306)
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - Database name (default: acslogistica_drupal)

**Package Manager:** This project uses npm for consistency.

**Testing:** Frontend has no test framework configured yet.

## Architecture

This is a **WareHouse Management System (WMS)** for "ACS Logística", consisting of:

**Frontend:** Next.js 15 web application for package receiving and management
**Backend:** MySQL database integration with existing Drupal system
**API Layer:** Next.js API routes providing RESTful services

### WMS Core Features

**Package Management:**
- Real-time package registration with barcode scanning
- Tracking number validation and duplicate prevention
- Package status tracking throughout WareHouse workflow
- Integration with existing Drupal database structure

**Batch Operations:**
- High-speed scanning mode for processing multiple packages
- Default value templates for common package characteristics
- Running counters and verification displays
- Session management with pause/resume capabilities

**Database Integration:**
- MySQL connection with Drupal compatibility layer
- Field mapping between modern API and Drupal schema
- Transaction support for data consistency
- Connection pooling for high-volume operations

### Key Technologies

**Frontend:**
- **Next.js 15** with App Router
- **TypeScript** with strict configuration
- **Firebase** for authentication
- **Tailwind CSS** with shadcn/ui components
- **Radix UI** primitives
- **React Hook Form** with Zod validation
- **Recharts** for analytics and reporting

**Backend & Database:**
- **MySQL** with mysql2 client for Drupal database
- **Zod** for comprehensive API validation
- **Next.js API Routes** for RESTful services
- **TypeScript interfaces** for type safety
- **Database abstraction layer** for Drupal compatibility

### Authentication & Authorization
The app implements a simplified role-based access control system:

**User Roles:**
- `super_admin` - Full system access and configuration
- `manager` - Package management and reporting access
- `pending` - Awaiting approval

**Permission System:** Located in `lib/auth.ts`, permissions control access to system features and administrative functions.

**Authentication Flow:**
- Firebase Auth with corporate email validation
- Role determination based on email patterns and manual approval
- Protected routes use `ProtectedRoute` component with permission checks
- Session management for WareHouse operations

### WMS Architecture Patterns

**API Structure:**
```
/api/packages - Package CRUD operations with filtering
/api/packages/[id] - Individual package operations
/api/pallets - Pallet/tarima management
/api/statistics - Real-time metrics and reporting
/api/batch - Batch scanning session management
/api/batch/[sessionId]/scan - Individual package scans
/api/health - Database connectivity and system status
```

**Database Layer:**
- `lib/mysql.ts` - MySQL connection utilities with Drupal compatibility
- `lib/db-mapper.ts` - Database abstraction layer mapping modern fields to Drupal
- `types/wms.ts` - TypeScript interfaces for all WMS entities
- `lib/validation.ts` - Zod schemas for comprehensive API validation

**Component Architecture:**
- UI components in `components/ui/` (shadcn/ui)
- WMS business components in `components/` (to be created)
- Utility functions in `lib/utils.ts`
- Firebase configuration in `lib/firebase.ts`
- Database utilities in `lib/mysql.ts` and `lib/db-mapper.ts`

### Development Notes

**Environment Variables:**
Required environment variables in `.env`:

*Firebase Configuration:*
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

*MySQL Configuration:*
- `MYSQL_HOST` - Database host (default: localhost)
- `MYSQL_PORT` - Database port (default: 3306)
- `MYSQL_USER` - Database username
- `MYSQL_PASSWORD` - Database password
- `MYSQL_DATABASE` - Database name (default: acslogistica_drupal)

**Database Compatibility:**
- The system reads/writes to existing Drupal database tables
- Field mappings preserve Drupal's data structure
- Unix timestamp conversion for Drupal compatibility
- Node-based content model for packages
- Taxonomy terms for pallets/tarimas

**API Testing:**
- Use `/api/health` endpoint to test database connectivity
- All API routes include comprehensive error handling
- Zod validation provides detailed error messages
- Support for development/staging/production environments

**Styling:**
- Tailwind with custom theme in `tailwind.config.ts`
- CSS variables for theming
- shadcn/ui component system configured in `components.json`

**Next.js Configuration:**
- ESLint and TypeScript errors ignored during builds (development setup)
- Images optimized by default
- Absolute imports with `@/` prefix

**Monitoring:**
- Sentry integration for error tracking and performance monitoring
- Conditional configuration based on `SENTRY_AUTH_TOKEN` availability
- Server-side instrumentation with trace sampling

### State Management
- React Context for authentication state
- No external state management library (future: consider Zustand for WMS state)
- Server state managed through React hooks and API calls
- Real-time updates via WebSocket (to be implemented)

### Testing & Quality
- Run `npm run lint` after making changes to ensure code quality
- TypeScript strict mode enabled for type safety
- ESLint configured with Next.js rules
- Comprehensive API validation with Zod schemas
- Database abstraction layer ensures data integrity