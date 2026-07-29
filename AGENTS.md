<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Biliardino workspace

## Repository map

- Package manager: npm. Prefix Nx commands with `npx nx`.
- `web`: Angular 22 standalone application in `apps/web`.
- `web-e2e`: Playwright end-to-end project in `apps/web-e2e`.
- Application state and Supabase RPC calls live in `apps/web/src/app/core/app-store.service.ts`.
- Supabase client setup and authentication live in `apps/web/src/app/core/supabase.service.ts`.
- Generated database types live in `apps/web/src/app/core/database.types.ts`.
- Database history is append-only under `supabase/migrations`; never rewrite an applied migration.
- The user-facing changelog is `CHANGELOG.md` and is rendered by the application.

## Database workflow

- For database incidents, inspect both Supabase API and PostgreSQL logs before editing.
- Inspect the live schema and function definitions before creating a migration.
- Apply DDL and PostgreSQL function changes through a new Supabase migration, then verify the deployed behavior.
- This project enables safe-update protection. Every `UPDATE` statement, including an intentional whole-table update, must have an explicit `WHERE` clause.

## Delivery and versioning

- Use the `bugfix` skill for reported defects and regressions.
- Every completed implementation task must have a user-facing `CHANGELOG.md` entry.
- Every commit represents one application version. Keep all uncommitted implementation work under a single pending changelog version.
- Use a patch version while the pending work contains only fixes. If a feature is added before commit, promote the pending release to the next minor version and fold every earlier uncommitted fix into it; remove any intermediate patch heading.
- Update both `package.json` and `package-lock.json` to the single pending version.
- Run project tasks through Nx. Prefer the narrow target that proves the changed behavior.
