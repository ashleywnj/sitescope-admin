# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 15 project called "sitescope-admin" bootstrapped with `create-next-app`. It uses:
- React 19.1.0 with TypeScript
- Tailwind CSS v4 for styling
- Firebase hosting for deployment
- Turbopack for fast builds and development

## Development Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture
- **App Router**: Uses Next.js 15 App Router (not Pages Router)
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Fonts**: Uses Geist Sans and Geist Mono fonts from Google Fonts
- **Path aliases**: `@/*` maps to `./src/*`
- **Deployment**: Configured for Firebase hosting with us-central1 region

## Key Files
- `src/app/layout.tsx` - Root layout with font configuration and metadata
- `src/app/page.tsx` - Homepage component
- `src/app/globals.css` - Global styles with Tailwind and CSS variables
- `eslint.config.mjs` - ESLint configuration extending Next.js rules
- `firebase.json` - Firebase hosting configuration

## Development Notes
- Uses TypeScript with strict mode enabled
- ESLint configured with Next.js core-web-vitals and TypeScript rules
- Dark mode support via CSS prefers-color-scheme
- Custom CSS variables for theming (--background, --foreground)