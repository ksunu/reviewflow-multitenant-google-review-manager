# Review Manager: Project Context for LLMs

## Product and stack

Review Manager is a multi-workspace web app for managing Google business locations and reviews, drafting AI responses, and collaborating with workspace members. The application lives under `client/` and uses Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, Google Maps/Places, and optional Ollama/OpenAI generation.

Use `client/src/` as the source root. The TypeScript alias `@/*` maps to `client/src/*`.

## Architecture

- `client/src/app/`: route pages, layouts, Route Handlers, and Server Actions.
- `client/src/components/`: shared UI, auth, dashboard, location, map, and review components.
- `client/src/lib/supabase/`: browser and cookie-backed server clients, current-user lookup, and workspace authorization.
- `client/src/lib/ai/`: AI response schema/prompt utilities.
- `client/src/lib/helpers/`: Google Places data helpers.
- `client/src/lib/i18n/`: English/Spanish i18next setup; locale JSON is under `client/public/locales/`.
- `client/src/components/ui/`: local UI primitives; keep these if imported by active pages/components.

Next.js project guidance is in `client/AGENTS.md`. It requires checking the installed Next.js documentation under `client/node_modules/next/dist/docs/` before changing Next-specific APIs.

## Main user flows

1. **Sign-in and registration:** `client/src/app/page.tsx` opens `AuthModal`. `AuthModal` uses Supabase email/password sign-up and sign-in.
2. **Workspace selection and creation:** `/dashboard` loads the user’s workspace memberships. `/dashboard/new` calls the `create_workspace` Supabase RPC. Workspace pages are under `/dashboard/[workspaceId]`.
3. **Workspace access:** `getWorkspaceAuthorization` in `client/src/lib/supabase/authorization.ts` verifies the current Supabase user and their `workspace_members` row. Server Actions and Route Handlers should enforce access themselves; do not rely only on a layout check.
4. **Locations:** the workspace locations page loads locations and passes them to `locations-client.tsx`. Add/edit/delete operations use `client/src/app/actions/locations.ts`; the add-location UI uses Google Maps/Places components.
5. **Review sync:** `syncLocationReviews` in `client/src/app/actions/syncReviews.ts` authorizes workspace membership, loads the selected location, requests Google Places reviews, validates rating/timestamp values, inserts unseen rows, and updates `locations.last_synced_at`. The review page calls this action and reports the number inserted.
6. **AI reply draft:** `ReviewCard` opens `AIReplyDialog`, which posts to `/api/workspaces/[workspaceId]/ai-reply`. The handler validates input, authorizes the workspace, loads the review/location context, tries local Ollama, then optional OpenAI, then a template fallback. It saves the draft and consumes quota in the database through `save_ai_reply_atomically`.
7. **Workspace team:** `/dashboard/[workspaceId]/team` lists and manages workspace members.

## Supabase data model

The following summarizes the schema shared by the user for debugging. Confirm the live database before changing SQL; the supplied schema was described as context, not an executable migration.

- `workspaces`: `id`, `name`, `slug`, `business_type`, `ai_replies_used_this_month`, `ai_reply_limit`, `created_at`. The shared schema does **not** include `subscription_tier`, `language`, or a direct tenant relationship.
- `workspace_members`: `workspace_id`, `user_id`, and role (`owner`, `admin`, `member`); `user_id` references `auth.users`.
- `locations`: workspace ownership, name, Google Place ID, address/coordinates, business type, `last_synced_at`.
- `reviews`: workspace/location ownership, rating, author, review content/date, sentiment, AI draft, status, reply status, and Google metadata. In the shared schema, `review_date` is `text`; `sentiment` is nullable `text` (not an enum/check-constrained column). Expected analyzed values are `positive`, `neutral`, and `negative`; `NULL` means the review has not been analyzed.
- `tenants`, `tenant_users`, and `operational_digests` also exist in the supplied schema, but no workspace-to-tenant relationship was shown. Do not assume tenant subscription state can be used for a workspace until that relationship is established.
- RLS policies refer to helpers such as `user_belongs_to_workspace` and `check_user_workspace_role`; some supplied policy expressions also query `workspace_members` directly.

### Database functions and indexes expected by the app

- `public.save_ai_reply_atomically(uuid, uuid, text, text)` saves an AI draft and increments `workspaces.ai_replies_used_this_month` atomically, after membership, review ownership, posted-state, and quota checks. Its `search_path` was corrected to `public, auth, pg_temp` after a `42P01` relation error in RLS evaluation.
- Pending Supabase application: migration `supabase/migrations/202610130001_allow_unanalyzed_ai_reply.sql` allows `p_sentiment` to be `NULL` and preserves the review's current sentiment in that case. This is required because `NULL` means “not analyzed”; AI reply drafting is not sentiment analysis.
- `public.reviews_workspace_location_review_identity_idx` is a unique index on `(workspace_id, location_id, review_date, author_name)`. The user confirmed this exact index exists in Supabase. Review sync uses it as its upsert conflict target and ignores duplicates to preserve existing replies/statuses.
- The confirmed RPC and unique review index exist in Supabase; the RPC update is versioned in `supabase/migrations/202610130001_allow_unanalyzed_ai_reply.sql`. Keep future database schema changes in versioned migrations.

## External services and environment variables

Names only; never put secret values in this file or commit them.

- Required Supabase client config: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Google Maps browser UI: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Review sync prefers server-only `GOOGLE_MAPS_API_KEY`, with the public Maps key as fallback.
- Optional AI provider: `OPENAI_API_KEY`. The OpenAI client is only initialized when configured; Ollama/template fallback should remain usable without it.
- `SYNC_REVIEWS_WEBHOOK_SECRET` is not referenced in current source and there is no review-sync webhook handler. It is not needed unless a webhook integration is added.

## Current behavior and constraints

- Review sync calls the Google Places Details **Legacy** endpoint with newest-first ordering. Google returns at most five reviews per request, so this is not a complete review-history importer.
- Review sync has a 15-second upstream timeout, validates review ratings and timestamps, reports actual inserted rows, and checks relevant Supabase read/write errors.
- The Analytics Overview has one workspace selector shared by all three charts. The sentiment chart counts `reviews.sentiment` values directly and shows `NULL` rows as a separate “Not analyzed” category. Syncing reviews does not analyze or populate sentiment; AI reply generation also leaves the sentiment unchanged. The legacy `/api/ai/generate-reply` handler can return model-generated sentiment, but no in-app caller was found and it does not persist that result.
- The 24-hour sync cooldown block is currently commented out in `syncReviews.ts` (user change). Subscription-tier gating cannot be correctly restored from the shared schema because it has no workspace tier field/relationship.
- The mock-review endpoint at `/api/workspaces/[workspaceId]/sync` returns 404 in production; it exists only as a development helper.
- `/api/ai/generate-reply` is a separate legacy Route Handler. No in-app caller was found during cleanup, but Route Handlers can be externally called, so review compatibility before deleting it.
- `client/src/app/auth/callback/route.ts` is an auth callback; do not remove it solely because no component imports it. Supabase dashboard redirect configuration may call it.
- AI provider calls use an 8-second Ollama timeout and a 20-second OpenAI timeout with retries disabled. If both providers fail, the handler uses a local template.

## Development and verification

Run commands from `client/`:

```bash
yarn dev
yarn lint
yarn build
```

`client/package.json` does not define a test script and the repository has no configured test suite. Do not claim tests passed unless a test setup is added and run. `git diff --check` is a useful whitespace check, not a test.

When making changes, keep authorization at each server-side entry point, match queries to the live Supabase schema, preserve the atomic AI-save and review-deduplication invariants, and avoid editing dependencies/generated output. The user prefers one prioritized change at a time with a concise explanation before moving to the next item.
