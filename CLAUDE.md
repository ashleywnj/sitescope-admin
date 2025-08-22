# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 15 project called "sitescope-admin" bootstrapped with `create-next-app`. It's a multi-tenant photo documentation application with super-admin capabilities. It uses:
- React 19.1.0 with TypeScript
- Tailwind CSS v4 for styling
- Firebase Authentication, Firestore, Storage, and Cloud Functions
- Firebase hosting for deployment
- Turbopack for fast builds and development

## Development Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Cloud Functions Commands
- `cd functions && npm run build` - Build TypeScript functions
- `firebase deploy --only functions` - Deploy all Cloud Functions
- `firebase deploy --only functions:functionName` - Deploy specific function

## Architecture
- **App Router**: Uses Next.js 15 App Router (not Pages Router)
- **Multi-tenant**: Organization-based data isolation with user-organization relationships
- **Authentication**: Firebase Authentication with custom claims for role-based access
- **Database**: Firestore with security rules supporting admin access across all organizations
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Fonts**: Uses Geist Sans and Geist Mono fonts from Google Fonts
- **Path aliases**: `@/*` maps to `./src/*`
- **Deployment**: Configured for Firebase hosting with us-central1 region

## Super-Admin System
This application implements a secure super-admin system using Firebase Custom Claims that allows privileged users to manage all organizations and users across the entire system.

### Admin Routes
- `/admin` - Main admin dashboard (protected, admin-only)
- `/setup-admin` - Initial admin setup page (temporary, should be removed after first admin)
- `/debug-admin` - Debug page for checking admin status (temporary)

### Admin Features
- **User Management**: View all users, search by email, enable/disable accounts
- **Role Management**: Grant or revoke admin privileges for any user
- **Cross-Organization Access**: Admins can access data across all organizations
- **Security**: All admin actions are logged and require proper authentication

### Cloud Functions (Admin)
- `addAdminRole(email)` - Grant admin privileges (admin-only)
- `removeAdminRole(email)` - Revoke admin privileges (admin-only)
- `listAllUsers(maxResults?, pageToken?)` - List all users with pagination (admin-only)
- `getUserByEmail(email)` - Get user details by email (admin-only)
- `setUserDisabled(uid, disabled)` - Enable/disable user accounts (admin-only)
- `setupFirstAdmin(email)` - Initial admin setup (no restrictions, should be deleted after use)

### Admin Implementation
- **Custom Claims**: Uses Firebase `admin: true` custom claim for role identification
- **Client-side Protection**: Admin routes check claims and redirect non-admins
- **Server-side Security**: All Cloud Functions verify admin status before execution
- **Context Provider**: `AdminContext` manages admin state throughout the application
- **UI Integration**: Admin link appears in user menu for admin users only

### Security Notes
- Admin claims are set server-side only via Cloud Functions
- Regular users cannot elevate their own privileges
- Admin functions require authenticated requests with valid admin claims
- Database security rules should reference `request.auth.token.admin == true` for admin access

## Key Files
- `src/app/layout.tsx` - Root layout with font configuration and metadata
- `src/app/page.tsx` - Homepage/login component
- `src/app/protected/` - Main application routes for regular users
- `src/app/admin/` - Super-admin dashboard and management interface
- `src/app/admin/contexts/AdminContext.tsx` - Admin state management
- `src/app/admin/utils/adminAuth.ts` - Admin authentication utilities
- `src/app/protected/components/AdminAccess.tsx` - Admin link in user menu
- `functions/src/index.ts` - Cloud Functions including admin management
- `src/app/globals.css` - Global styles with Tailwind and CSS variables
- `eslint.config.mjs` - ESLint configuration extending Next.js rules
- `firebase.json` - Firebase hosting and functions configuration

## Development Notes
- Uses TypeScript with strict mode enabled
- ESLint configured with Next.js core-web-vitals and TypeScript rules
- Dark mode support via CSS prefers-color-scheme
- Custom CSS variables for theming (--background, --foreground)
- ClientOnly wrapper prevents hydration mismatches for Firebase-dependent components
- Static export configuration requires careful handling of dynamic Firebase features