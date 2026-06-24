# GuestPass Landing Page Branch

This branch is the public-facing GuestPass website build.

## Build Entry

- `src/main.tsx` boots `src/LandingApp.tsx`.
- `src/LandingApp.tsx` contains only public website routes:
  - `/`
  - `/our-solution`
  - `/about`
  - `/contact`
  - `/events`
  - `/cart`
  - `/checkout`
  - `/account`
  - `/account/auth`
  - `/auth/callback`
  - `/resend-confirmation`

## Separation Boundary

The internal console files can remain in the repository, but this branch does not import them from the Vite entry point.

Do not import these internal console surfaces into `src/LandingApp.tsx`:

- `components/dashboard/*`
- `components/events/event-list`
- `components/guests/*`
- internal protected routes such as `/dashboard`, `/admin/events`, and `/guests`
- console-only providers such as `EventsProvider` and `GuestsProvider`

Keeping that boundary lets this branch deploy as the lighter public website while the main app console stays separate.

## Verification

Run:

```bash
npm run build
```

The landing build should not emit the previous oversized internal `event-list` chunk warning.
