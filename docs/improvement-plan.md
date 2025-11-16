# Improvement Plan

Each item below is an actionable task with a brief description, expected changes, and dependencies. We can tackle them independently, though auth-related items naturally depend on one another.

## Architectural Tasks
1. **Improve PWA prompt gating**
   - Read dismissal timestamps (and install state) before rendering the prompt.
   - Persist the dismissal flag early so the prompt never flashes after a recent dismissal.
2. **Adopt `firebase-admin` on the server**
   - Initialize the admin SDK using service-account env vars.
   - Update API routes to call admin Firestore, leaving the client SDK for browser-only code.
3. **Add authentication and user scoping**
   - Choose an auth provider (Firebase Auth or NextAuth).
   - Persist user identity in Firestore by nesting data under `/users/{uid}/content`.
   - Gate API routes and UI actions on the authenticated user.

## Code Quality Tasks
1. **Secure Firebase configuration**
   - Move the Firebase config to environment variables.
   - Throw descriptive errors when required env vars are missing.
2. **Limit global transitions**
   - Remove `* { transition: ... }` from `globals.css`.
   - Apply transitions only to components that need them (buttons, cards, etc.).
