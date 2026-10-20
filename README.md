# ReviewFlow — Multi-Tenant Google Review Manager

ReviewFlow is a multi-tenant review management app for businesses that operate multiple locations. Workspace members can connect locations, sync Google reviews, monitor rating and sentiment trends, and draft customer replies with AI.

> Portfolio project / MVP. Google review import currently uses the Places Details Legacy API, which returns up to five reviews per request. Read the limitations below before treating this as a complete review-ingestion system.

## Features

- Supabase email/password authentication and first-workspace onboarding.
- Workspace-based data isolation with owner, admin, and member roles.
- Location management with Google Places autocomplete and map display.
- Review sync with duplicate protection and per-location sync timestamps.
- Review feed with location/status filters and pagination.
- Rating, rating-distribution, and sentiment analytics.
- AI-assisted response drafts using Ollama when available, with OpenAI and template fallbacks.
- Light and dark themes, responsive dashboard navigation, and English/Spanish locale resources.

## Technology

- Next.js App Router, React, and TypeScript
- Supabase Auth and Postgres with Row Level Security (RLS), RPCs, and migrations
- Google Maps JavaScript API and Places API
- Vercel AI SDK with optional Ollama and OpenAI providers
- Tailwind CSS, shadcn-style UI components, Recharts, TanStack Query
- Vitest and React Testing Library

## Architecture

The application is a single Next.js project rooted at the repository root.

```text
src/
  app/                 Pages, layouts, Route Handlers, and Server Actions
    actions/           Location, onboarding, and review-sync actions
    api/               AI and workspace-scoped API endpoints
    dashboard/         Workspace selection and workspace-scoped screens
  components/          Shared UI, auth, maps, charts, navigation, and dialogs
  hooks/               Reusable client-side data hooks
  lib/
    supabase/          Browser/server clients and workspace authorization
    ai/                Prompt and structured-response definitions
    helpers/           Google Places helpers
  types/               Shared database and application types
supabase/migrations/   Captured schema and versioned database changes
public/locales/        English and Spanish translation resources
```

### Request and data flow

1. The browser signs in through Supabase Auth. Onboarding uses a database RPC to create a workspace, its owner membership, and the first location transactionally.
2. Dashboard pages use workspace membership to scope location, review, and analytics queries. Server Actions and Route Handlers also perform their own authorization checks; access is not entrusted to the UI layout alone.
3. Location review sync validates Google Places data, inserts new reviews using the review identity key, and updates `locations.last_synced_at`.
4. AI drafting checks the session and workspace membership, validates the request, loads the review and location context, generates a response, and saves the draft with quota accounting through an atomic database RPC.
5. Workspace analytics use the `workspace_review_stats` view where applicable. The sentiment chart queries review sentiment directly so null sentiment can be shown as “Not analyzed.”

## Run locally

### Requirements

- Node.js 20.9 or newer (Node.js 22 is used in CI)
- Yarn Classic 1.22.x
- A Supabase project
- A Google Maps API key for maps, Places autocomplete, and review sync

### Setup

```bash
git clone https://github.com/ksunu/review-manage.git
cd review-manage
yarn install --frozen-lockfile
cp .env.example .env.local
```

Fill `.env.local` with the values for your own Supabase and Google projects. Do not commit `.env.local` or production credentials.

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser/server session Supabase client |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For map UI | Browser Maps API and Places autocomplete; restrict this key by referrer and API |
| `GOOGLE_MAPS_API_KEY` | For sync | Server-side Google Places requests; preferred by sync if configured |
| `OPENAI_API_KEY` | Optional | OpenAI fallback for AI reply generation |

The AI endpoint can use a local Ollama service at `http://localhost:11434` before falling back to OpenAI and a local template. Do not expose provider secrets through `NEXT_PUBLIC_*` variables.

## Database and security

The `supabase/migrations/` directory contains the pulled Supabase schema snapshots and subsequent migrations. Review those files before changing tables, RLS policies, views, RPCs, or grants. Treat the snapshots as history and add schema updates as new timestamped migrations.

The app relies on workspace membership authorization and RLS. Configure Supabase Auth redirect URLs for local and deployed environments. RPCs, policies, Google API key restrictions, and view security should be verified in the target Supabase project before deployment. Applying a migration locally does not update the hosted Supabase project automatically.

## Commands

```bash
yarn dev       # Local development server
yarn lint      # ESLint
yarn build     # Production build
yarn start     # Serve the production build
yarn test      # Run Vitest suite
```

Tests mock Supabase clients and cover selected authorization, AI request, and analytics behavior. They do not replace integration checks against live Postgres RLS policies, RPCs, Google APIs, or AI providers.

## Known limitations

- The current Google Places Details Legacy endpoint returns at most five reviews per request; it is not a full review-history importer. Review the current Google Business Profile API options and eligibility before expanding ingestion.
- Sentiment is not automatically inferred for synced reviews; a null database value is surfaced as “Not analyzed.”
- AI replies are drafts and should be reviewed by a person before posting. Google posting/publishing is not implemented in this MVP.
- Workspace roles and quota limits are enforced through database authorization/RPC paths; do not rely on client-side checks for security.

## Deployment

Deploy as a Next.js app (for example, on Vercel), configure the environment variables above, and set matching Supabase Auth redirect URLs. Review `supabase/migrations/` and apply required migrations to the target database through the team’s normal Supabase workflow. The GitHub Actions workflow runs lint, build, and tests on pull requests to `main`.

## Project context

For a deeper implementation and schema reference maintained for code-assistant work, see [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).
