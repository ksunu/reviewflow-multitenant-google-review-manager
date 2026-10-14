<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Database change rules

- Before reviewing or changing Supabase schema, RLS, functions, grants, or views, inspect the current files in `supabase/migrations/` and reference their exact definitions.
- `20261014004753_remote_schema.sql` is the full pulled schema snapshot; `20261014031231_remote_schema.sql` records the later legacy tenant privilege revokes. `20261014002043_remote_schema.sql` is empty.
- Treat the pulled schema files as baseline history. Add new database changes as new timestamped migrations; do not rewrite pulled snapshots to represent future changes.
- Verify security-sensitive changes against the live Supabase state before applying them. In particular, account for view security mode, RLS behavior, and table grants such as `TRUNCATE` that RLS does not restrict.

## Testing

- Run `yarn test` from `client/` for Vitest tests; React hook tests use `@testing-library/react` and jsdom.
- Tests mock Supabase clients and cover application authorization and query scoping. They do not verify live PostgreSQL RLS or execute Supabase RPCs against a database.
- The pull-request workflow runs lint, build, and tests from `client/`.
