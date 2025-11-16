# Jan.io Architecture

## Overview
Jan.io is a life-organizer built on the Next.js App Router. It groups user content into four categories (notes, personal tasks, work tasks, interesting stuff) and supports installation as a Progressive Web App (PWA). The UI uses client components for interaction-heavy areas, while server components provide the initial shell and metadata.

## Frontend
- **Entry point**: `src/app/page.js` renders a Suspense boundary and delegates to the client component `HomeContent`, so SSR delivers initial HTML before client data fetches resolve.
- **Global layout**: `src/app/layout.js` applies Geist fonts, global CSS, viewport/manifest metadata, and Apple touch icon tags to every route.
- **Home experience**: `src/app/HomeContent.js` manages tabs, item CRUD, drag-and-drop ordering, and URL synchronization. It fetches `/api/content?category=...` for each category on mount, keeps state per category, and POSTs whole category arrays back after any mutation.
- **UI building blocks**:
  - `src/app/components/Tabs.js` provides a minimal tabs system via React context.
  - `src/app/components/ItemList.js` renders draggable cards using `@dnd-kit`, emitting updated arrays with adjusted `order` fields.
  - `src/app/components/ItemDetail.js` shows and edits the active item, enabling due-date editing only for task categories.
  - `src/app/components/PWAInstallPrompt.js` listens for `beforeinstallprompt` and prompts users to install the PWA, suppressing itself once installed or dismissed.
- **Styling**: Tailwind CSS v4 powers utility classes. Custom CSS variables, scrollbars, and focus rings live in `src/app/globals.css`. Icons come from `lucide-react`.

## Backend & Persistence
- **API route**: `src/app/api/content/route.js` exposes GET and POST handlers.
  - GET reads Firestore documents in the `content` collection filtered by the `type` field matching the requested category.
  - POST performs a full replace: it deletes existing docs for the category and writes the submitted array back using a Firestore batch.
- **Firestore setup**: `src/lib/db.js` initializes the Firebase client SDK once per server process and exports helpers (`collection`, `query`, etc.) used by the API route.
- **Data model**: Each document stores `{ type, id, title, description, order, dueDate?, createdAt }`. Sample JSON data in `public/content/*.json` mirrors this shape and can be used to seed Firestore.
- **Limitations**: Persistence is single-tenant with “last write wins” semantics; there is no authentication or per-user partitioning, so Firestore security rules must guard access.

## Progressive Web App
- **Service worker**: `next.config.mjs` wraps the Next config with `@ducanh2912/next-pwa`, generating a service worker that caches navigation, serves `public/offline.html`, and reloads when connectivity returns.
- **Manifest & icons**: `public/manifest.json` plus Apple touch icons declared in the layout provide install metadata (name, theme color, icons, display mode).
- **Install UX**: `PWAInstallPrompt` offers an install CTA on platforms that do not show the native banner.

## Assets & Public Files
- `public/content/*`: category seed data.
- `public/offline.html`: offline fallback page served by the service worker.
- `public/icons/*`: PWA icons referenced by the manifest and Apple touch icon tags.

## Build & Tooling
- **Scripts**: `npm run dev|build|start|lint` leverage Next.js with Turbopack for dev/build.
- **Dependencies** include Next.js 15, React 19, Firebase SDK, `@dnd-kit` for drag-and-drop, `lucide-react` for icons, and `@ducanh2912/next-pwa` for PWA support.
- **Styling toolchain**: Tailwind CSS v4 with the official PostCSS plugin configured in `postcss.config.mjs`.
