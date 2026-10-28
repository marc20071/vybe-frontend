# VYBE Frontend

A responsive Next.js frontend concept for VYBE, a social discovery and short-video platform. It uses a dark premium visual system with violet/coral accents and a mobile-first layout.

## Requirements

- Node.js 20.9 or later
- npm
- The VYBE backend (optional while exploring the UI; API-driven actions need it)

## Start locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` to the backend API base URL, for example `http://localhost:4000/api`.

## Included

- Public landing/feed, explore, public video and profile routes
- Login, signup and password-recovery screens
- Following, upload, notifications, messages, saved posts and settings screens
- Reusable UI, feed, profile, story and messaging components
- API client and service modules for the separate backend
- Responsive layouts for desktop, tablet and mobile

## Demo vs production behavior

The feed cards and stories currently use intentionally labelled demo visuals. The play button is a UI preview, not a real video stream. API calls are prepared for the backend but require matching endpoints. Some controls are local visual states until the backend is integrated. Do not represent these demo interactions as persisted user actions.

## API expectations

The frontend currently expects endpoints under `/api`, including `/auth/me`, `/auth/login`, `/auth/signup`, `/feed`, `/posts`, `/stories`, `/conversations`, `/notifications`, `/search`, and `/uploads`. Adjust service files to match the backend contract.

## Guest access rule

Public content should remain viewable without authentication. Participating actions must prompt guests to sign in or create an account, and after successful authentication the frontend should return them to the requested destination. Enforce access rules in the backend too; hiding buttons is not security.

## Before production

- Integrate a real video player and media CDN/transcoding workflow.
- Add server-backed feed pagination and optimistic updates with rollback.
- Complete accessibility and browser/device testing.
- Add monitoring, consent/privacy pages, abuse reporting, moderation, rate limiting, and API security.
- Verify all privacy and authorization behavior on the backend.
"# vybe-frontend" 
