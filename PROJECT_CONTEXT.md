# ReviewFlow: Project Context for LLMs

## Product and stack

ReviewFlow is a multi-workspace web app for managing Google business locations and reviews, drafting AI responses, and collaborating with workspace members. The Next.js app now lives at the repository root and uses Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS, Google Maps/Places, and optional Ollama/OpenAI generation.

Use `src/` as the source root. The TypeScript alias `@/*` maps to `src/*`.

## Architecture

- `src/app/`: route pages, layouts, Route Handlers, and Server Actions.
- `src/components/`: shared UI, auth, dashboard, location, map, and review components.
- `src/lib/supabase/`: browser and cookie-backed server clients, current-user lookup, and workspace authorization.
- `src/lib/ai/`: AI response schema/prompt utilities.
- `src/lib/helpers/`: Google Places data helpers.
- `src/lib/i18n/`: English/Spanish i18next setup; locale JSON is under `public/locales/`.
- `src/components/ui/`: local UI primitives; keep these if imported by active pages/components.

Next.js project guidance is in `AGENTS.md`. It requires checking the installed Next.js documentation under `node_modules/next/dist/docs/` before changing Next-specific APIs.

## Main user flows

1. **Sign-in and registration:** `src/app/page.tsx` opens `AuthModal`. `AuthModal` uses Supabase email/password sign-up and sign-in.
2. **Workspace selection and creation:** `/dashboard` loads the user’s workspace memberships. `/dashboard/new` calls the `create_workspace` Supabase RPC. First-time onboarding at `/onboarding` calls `create_workspace_with_location` to atomically create the workspace, owner membership, and first location. Workspace pages are under `/dashboard/[workspaceId]`.
3. **Workspace access:** `getWorkspaceAuthorization` in `src/lib/supabase/authorization.ts` verifies the current Supabase user and their `workspace_members` row. Server Actions and Route Handlers should enforce access themselves; do not rely only on a layout check.
4. **Locations:** the workspace locations page loads locations and passes them to `locations-client.tsx`. Add/edit/delete operations use `src/app/actions/locations.ts`; the add-location UI uses Google Maps/Places components.
5. **Review sync:** `syncLocationReviews` in `src/app/actions/syncReviews.ts` authorizes workspace membership, loads the selected location, requests Google Places reviews, validates rating/timestamp values, inserts unseen rows, and updates `locations.last_synced_at`. The review page calls this action and reports the number inserted.
6. **AI reply draft:** `ReviewCard` opens `AIReplyDialog`, which posts to `/api/workspaces/[workspaceId]/ai-reply`. The handler validates input, authorizes the workspace, loads the review/location context, tries local Ollama, then optional OpenAI, then a template fallback. It saves the draft and consumes quota in the database through `save_ai_reply_atomically`.
7. **Workspace team:** `/dashboard/[workspaceId]/team` lists and manages workspace members.

## Supabase data model

The pulled schema under `supabase/migrations/` is now the project’s database reference. Read the migration files before any database refactor and keep this summary aligned with them. They capture Supabase state; confirm the live database before applying further changes.

- `20261014004753_remote_schema.sql` contains the full captured core schema: tables, indexes/constraints, helper/RPC function definitions, `workspace_review_stats`, role grants, and workspace RLS policies.
- `20261014031231_remote_schema.sql` captures the revokes that remove `anon` and `authenticated` access to legacy `tenants` and `tenant_users`.
- `20261014002043_remote_schema.sql` is empty (0 bytes); it contains no schema definitions.
- Treat these pulled files as the baseline/reference; add future database changes as new timestamped migrations rather than rewriting the pulled snapshots. Check whether the desired change is already represented before proposing SQL.

- `workspaces`: `id` (UUID PK), `name`, `slug` (unique), `created_at`, `business_type`, `ai_replies_used_this_month` (default 0), and `ai_reply_limit` (default 10). The live inventory does **not** include `subscription_tier`, `language`, or a direct tenant relationship.
- `workspace_members`: `id` (UUID PK), `workspace_id`, `user_id`, `role` (`owner`, `admin`, `member`, default `member`), and `created_at`. `(workspace_id, user_id)` is unique; role has a check constraint; workspace and auth user references cascade on delete.
- `locations`: `id`, `workspace_id`, `name`, Google Place ID, address/coordinates, business type, `last_synced_at`, and `created_at`. `workspace_id` references `workspaces(id)` with `ON DELETE CASCADE`.
- `reviews`: workspace/location ownership, rating (check constrained to 1–5), author, review content/date, sentiment, AI draft, status, reply status, and Google metadata. `review_date` is `text`; `sentiment` is nullable `text` (not an enum/check-constrained column). Expected analyzed values are `positive`, `neutral`, and `negative`; `NULL` means the review has not been analyzed. Workspace and location foreign keys cascade on delete.
- `tenants`, `tenant_users`, and `operational_digests` also exist. `tenant_users` has a unique `(tenant_id, user_id)` pair and role check (`owner`, `manager`, `staff`). The inventory shows no workspace-to-tenant relationship; do not assume tenant subscription state applies to a workspace.

### Live RLS and policy notes

- RLS is enabled (not forced) on `locations`, `operational_digests`, `reviews`, `tenant_users`, `tenants`, `user_integrations`, `workspace_members`, and `workspaces`. `locations` and `reviews` have workspace-member `FOR ALL` policies; `workspaces` has member SELECT and admin UPDATE/DELETE; `workspace_members` has member SELECT and admin INSERT/DELETE. `user_integrations` has a self-only `FOR ALL` policy. `operational_digests` has no policy in the captured schema.
- The captured `workspace_members_insert_admin` policy only checks that the acting user is an admin/owner; it does not constrain the inserted `user_id` or `role` beyond the table’s role CHECK. Thus an admin can assign another user the `owner` role. `workspace_members_delete_admin` likewise permits admins to delete owner rows, including the last owner. Treat this as a verified authorization gap; any change should preserve intended team workflows while restricting owner-role assignment/removal.
- The full snapshot grants broad table privileges, including `TRUNCATE`, to `anon` and `authenticated` on several RLS-protected tables (`locations`, `reviews`, `workspace_members`, `workspaces`, `operational_digests`, and `user_integrations`). RLS does not govern `TRUNCATE`; this is a high-priority grant issue to address with a new migration and verify against live privileges. The later revoke snapshot removes all privileges from `anon` and `authenticated` only for `tenants` and `tenant_users`.
- The pulled SQL drops the permissive legacy `tenants` and `tenant_users` policies and revokes their privileges from `PUBLIC`, `anon`, and `authenticated`. Keep these tables for legacy `operational_digests`; use workspaces for new customer data.
- `user_belongs_to_workspace(uuid)`, `check_user_workspace_role(uuid,uuid,text)`, `create_workspace(text,text)`, and `create_workspace_with_location(text,text,text)` are `SECURITY DEFINER` with an empty `search_path` and qualified table references. The role helper requires `p_user_id = auth.uid()`. The pulled migration files do not include explicit EXECUTE ACL statements for these functions; verify live function privileges before relying on an earlier manually run grant/revoke script.
- The snapshot enforces location/workspace consistency using unique `(locations.id, locations.workspace_id)` and composite `reviews(location_id, workspace_id)` FK constraints with cascading delete. The separate review-to-workspace FK remains.
- The full snapshot contains **three** unique indexes on the same review identity `(workspace_id, location_id, review_date, author_name)`: `reviews_unique_constraint`, `reviews_unique_natural_key`, and `reviews_workspace_location_review_identity_idx`. The first two are also named UNIQUE constraints. Do not drop any until index inference and the app’s `ON CONFLICT` target are checked against live state.
- Observed delete behavior includes cascading workspace deletion to locations/members/reviews and location deletion to reviews. Tenant deletion cascades to tenant memberships and operational digests.

### Analytics view

- `public.workspace_review_stats` groups by `locations.workspace_id`, counts joined reviews, computes average rating rounded to two decimals, counts positive/neutral/negative sentiment, and counts `reply_status = 'posted'`.
- It joins reviews to locations on `location_id`; the composite FK makes cross-workspace mismatches impossible when constraints are valid. Workspaces without locations do not get a view row. The view does not expose the `NULL`/not-analyzed sentiment count; the sentiment chart queries `reviews` directly.
- The view definition does not specify `security_invoker = true`, so PostgreSQL’s default view-owner permission behavior can bypass base-table RLS if the caller has SELECT on the view. The captured SQL contains no explicit grant on this view, even though `use-workspace-stats.ts` queries it. Verify live view privileges and security mode. If exposed to authenticated users, use an invoker-secured view (or an equivalently safe access rule) and explicitly grant only the intended role.

### Database functions and indexes expected by the app

- `public.save_ai_reply_atomically(uuid, uuid, text, text)` saves an AI draft and increments `workspaces.ai_replies_used_this_month` atomically, after membership, review ownership, posted-state, and quota checks. Its `search_path` was corrected to `public, auth, pg_temp` after a `42P01` relation error in RLS evaluation.
- `public.create_workspace(text, text)` creates a workspace and its owner membership. `public.create_workspace_with_location(text, text, text)` additionally creates its first location in the same transaction. Both require an authenticated user, reject blank required values, use a fixed empty `search_path`, and are executable only by `authenticated` in the applied SQL.
- Pending Supabase application: migration `supabase/migrations/202610130001_allow_unanalyzed_ai_reply.sql` allows `p_sentiment` to be `NULL` and preserves the review's current sentiment in that case. This is required because `NULL` means “not analyzed”; AI reply drafting is not sentiment analysis.
- `public.reviews_workspace_location_review_identity_idx` is a unique index on `(workspace_id, location_id, review_date, author_name)`. The user confirmed this exact index exists in Supabase. Review sync uses it as its upsert conflict target and ignores duplicates to preserve existing replies/statuses.
- The 2026-10-14 inventory also reports two unique constraints on the same review identity columns (`reviews_unique_constraint`, `reviews_unique_natural_key`). Do not drop constraints/indexes until the live index list and migration history clarify which definitions are redundant and which name the app's `ON CONFLICT` target relies on.
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
- `src/app/auth/callback/route.ts` is an auth callback; do not remove it solely because no component imports it. Supabase dashboard redirect configuration may call it.
- AI provider calls use an 8-second Ollama timeout and a 20-second OpenAI timeout with retries disabled. If both providers fail, the handler uses a local template.

## Development and verification

Run commands from the repository root:

```bash
yarn dev
yarn lint
yarn build
yarn test
```

Vitest is configured in `vitest.config.ts`; React hook tests use `@testing-library/react` with jsdom. The test suite covers workspace membership authorization, unauthorized AI reply requests, request validation and atomic quota-RPC invocation, and selected-workspace analytics filtering. These tests mock Supabase and do not replace database-backed verification of live RLS policies or RPC behavior.

The GitHub Actions workflow at `.github/workflows/ci.yml` runs lint, build, and test on pull requests targeting `main`. Build-only placeholder Supabase settings are configured in CI; no service credentials are required by the unit tests.

When making changes, keep authorization at each server-side entry point, match queries to the live Supabase schema, preserve the atomic AI-save and review-deduplication invariants, and avoid editing dependencies/generated output. The user prefers one prioritized change at a time with a concise explanation before moving to the next item.
