# GuestPass Repo Guide

## Project Overview
GuestPass is an event management dashboard optimized for rapid iterations using mock data and local state. The app primarily targets a Next.js App Router runtime, but there is also a Vite + Express preview stack used during local development.

Authentication scaffolding has been removed: the dashboard loads directly at `/` with mock user state. The next major milestone is wiring the dashboard to Supabase for real events, guests, and invite delivery flows.

## Key Technologies
- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui & Radix primitives.
- **State/Context**: Custom React contexts for events and guests (currently powered by browser `localStorage`).
- **Utilities**: QR code generation with `qrcode` + `pdf-lib`, toast notifications, responsive layout helpers.
- **Backend/Services**: Supabase (Postgres, storage, functions). Local Express server at `server/index.mjs` mirrors `/api/generate-bundle` for development.

## Local Development
1. Copy `.env.example` to `.env.local` and populate Supabase or dummy credentials (never commit real secrets).
2. Install dependencies: `npm install` (or `pnpm install`).
3. Run `npm run dev:all` to start the Express helper server and Vite dev server simultaneously.
4. Visit `http://localhost:5173` for the dashboard preview.

## Current State & Known Work
- **Authentication**: Sign-in/sign-up UI removed. Dashboard relies on mock admin/usher toggles.
- **Events/Guests**: Contexts read/write to localStorage. Demo seed records are bundled in `lib/events-context.tsx` and `lib/guests-context.tsx`.
- **Bundling/QR**: `/api/generate-bundle` (and its Express analog) generates QR PNG/PDF bundles and uploads them to Supabase Storage.
- **Pending Tasks**:
  - Replace local contexts with Supabase-backed queries/mutations (SSR-friendly).
  - Implement invite generation + email delivery backed by Supabase functions/storage.
  - Remove the now-dead `lib/auth-context.tsx`, `components/auth`, and `app/(protected)` if not needed.
  - Harden environment handling and avoid committing sensitive secrets.

## Coding Standards
- Prefer TypeScript for new modules.
- Reuse context hooks and modular components under `components/`.
- Keep UI logic declarative; avoid mutation-heavy patterns.
- Use shadcn UI primitives for an accessible, consistent look.

## Testing & QA
- No automated test suite yet; rely on manual QA through the dashboard.
- Verify QR bundle generation/download paths in Chrome or Edge during dev.

## Notes for Contributors
- Treat `.env.local` as sensitive; sanitize before sharing.
- Coordinate Supabase schema changes when moving contexts off localStorage.
- Document major architectural decisions in `.zencoder/rules/` for future collaborators.