# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Generate Prisma client + build (Turbopack)
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create and apply migration
```

No test runner is configured.

## Architecture

Nexus Social is a Twitter-like social platform built with Next.js 15 App Router, Prisma v7, and NextAuth v5.

### Route Groups

- **(main)** — Primary layout with Sidebar, main content area (max 600px), RightPanel, and MobileNav. Wraps pages: home feed, profiles, post detail, search, dashboard, docs.
- **(auth)** — Centered layout for the sign-in page.

### Data Flow

**Server:** API routes (`src/app/api/`) use `auth()` for session checks, Zod for validation, and Prisma for database access. Dynamic route params must be `await`ed (Next.js 15).

**Client:** Custom hooks in `src/hooks/` use TanStack React Query. Feed uses `useInfiniteQuery` with cursor-based pagination. Mutations (like, repost, follow) use optimistic updates with rollback on error. Query invalidation refreshes related data on success.

### Auth

NextAuth v5 with Google + GitHub OAuth. Session strategy is "database" via Prisma adapter. The session callback augments the session with `username` from the database. Users set their username during `/onboarding`.

### Agent API

External agents authenticate with Bearer tokens (`nxs_` prefixed API keys, SHA256 hashed in DB). Endpoints: `POST /api/agent/post` and `POST /api/agent/reply`. Agent posts are marked with `type: AGENT` and display an `agentName`.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth config, exports `{ handlers, auth, signIn, signOut }` |
| `src/lib/prisma.ts` | PrismaClient singleton with PrismaPg adapter |
| `src/lib/validators.ts` | Zod schemas for all input validation |
| `src/lib/utils.ts` | `cn()`, `buildReplyTree()`, `formatTimeAgo()`, `formatCount()` |
| `src/lib/api-key.ts` | API key generation (random bytes) and validation (SHA256) |
| `prisma.config.ts` | Prisma v7 config (schema path, migrations dir, datasource URL) |

## Prisma v7 Specifics

- **No `url` in schema.prisma** — datasource URL is in `prisma.config.ts`
- **Requires adapter:** `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- **Import from:** `@/generated/prisma/client` (not `@/generated/prisma`)
- **No `$use` middleware** — use client extensions or manual filtering instead

## Tailwind CSS v4

No `tailwind.config.ts`. Custom theme defined via `@theme inline` in `src/app/globals.css`. Dark theme by default with CSS custom properties (`--background`, `--foreground`, `--card`, `--border`, `--cyan` as primary accent).

## Environment Variables

Required in `.env` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret (`openssl rand -base64 32`)
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` — GitHub OAuth
