# Improvement Plan

Each item below is an actionable task with a brief description, expected changes, and dependencies. We can tackle them independently, though auth-related items naturally depend on one another.

## Architectural Tasks
1. **Share category metadata**
   - Move the category array to `src/lib/categories.js`.
   - Import it from both the UI and API code to keep shape consistent.
2. **Granular Firestore mutations**
   - Replace the bulk delete-and-rewrite strategy with item-level create/update/delete methods.
   - Update the client to send delta operations or identify individual item changes.
   - Add optimistic updates and reconcile failures.
3. **Parallelize category fetches**
   - Convert the sequential loop in `HomeContent` to `Promise.all`.
   - Consider server-side data fetching (e.g., route segment loaders) once authentication is in place.
4. **Improve PWA prompt gating**
   - Read dismissal timestamps (and install state) before rendering the prompt.
   - Persist the dismissal flag early so the prompt never flashes after a recent dismissal.
5. **Adopt `firebase-admin` on the server**
   - Initialize the admin SDK using service-account env vars.
   - Update API routes to call admin Firestore, leaving the client SDK for browser-only code.
6. **Add authentication and user scoping**
   - Choose an auth provider (Firebase Auth or NextAuth).
   - Persist user identity in Firestore by nesting data under `/users/{uid}/content`.
   - Gate API routes and UI actions on the authenticated user.

## Code Quality Tasks
1. **Modularize `HomeContent`**
   - Extract data fetching, CRUD, and router sync into `useContentManager`.
   - Split the tab layout, list panel, and detail panel container components.
2. **Validate API requests**
   - Introduce a schema (Zod or manual checks) for POST payloads.
   - Normalize ordering and reject invalid states before writing to Firestore.
3. **Surface persistence errors**
   - Add a lightweight toast/snackbar system.
   - Display errors when fetch/save fails and optionally retry automatically.
4. **Remove unused code and lint**
   - Clean unused imports (e.g., `useState` in `ItemList`).
   - Run ESLint and fix any reported issues.
5. **Secure Firebase configuration**
   - Move the Firebase config to environment variables.
   - Throw descriptive errors when required env vars are missing.
6. **Limit global transitions**
   - Remove `* { transition: ... }` from `globals.css`.
   - Apply transitions only to components that need them (buttons, cards, etc.).
