# ShortyDB — Architecture

_Last updated: 2026-05-07_

Source of truth for how this project is built and why. If you make a non-trivial decision that affects the whole codebase, update this file in the same PR.

## Vision

Discovery platform for artistic short-form video (short films, music videos, trailers, streams). Solves the YouTube discovery problem by adding structured metadata, community curation, and a Letterboxd-style social layer.

**Core constraint**: ShortyDB is a metadata hub — we never host video. Users watch on YouTube via outbound links. This is permanent by design (copyright + infra cost).

## Stack — non-obvious choices

Full list of technologies is in `AGENTS.md`. The decisions worth explaining:

**Node.js 22 LTS, not Bun** — Bun on Windows gives flaky installs. Team of 5 on different OSes, stability > performance for MVP.

**Next.js Server Actions, no separate API server** — one project, one deploy, end-to-end type safety. Route Handlers only for public API surface (auth callbacks). We can extract to Hono later if needed, no migration cost.

**pg-boss for job queue** — YouTube API has a 10k unit/day quota. Synchronous calls from handlers will kill UX and burn quota fast. All YouTube enrichment goes through a Postgres-backed queue. `pg-boss` is added when we write the first async job, not before.

**Better Auth** — we own user data in our own DB. No vendor lock-in, plugin system covers everything we need.

**Neon** — Postgres with per-branch databases. Every PR gets an isolated DB branch automatically via Vercel integration.

**Search in Postgres first** — `pg_trgm` + FTS covers ~10k items under 100ms. Typesense only when we actually hit the ceiling.

## Database Schema

Full schema lives in `src/server/db/schema/` — that's the source of truth, not this file.

**Pattern**: polymorphic content — one base `content` table + per-type `*_meta` tables. This is standard table-per-class inheritance, not EAV.

Why: the base table gives us one place to query "all content". Per-type tables keep type-specific fields properly typed. Adding music videos later = new `music_video_meta` table + enum value. Zero migrations on existing tables.

MVP tables: `content`, `short_film_meta`, `users` (Better Auth), `ratings`, `reviews`, `review_votes`, `lists`, `list_items`, `watchlist`, `genres`, `content_genres`.

Future: `music_video_meta`, `trailer_meta`, `stream_archive_meta`.

## Ratings

Plain mean is misleading for items with few ratings. We use Bayesian average:

```
weighted = (v / (v + m)) × R + (m / (v + m)) × C
```

`R` = item mean, `v` = item rating count, `m` = threshold (10), `C` = global mean. Recomputed via materialized view, refreshed hourly.

## Auth

- **MVP**: Google OAuth only
- **Post-MVP**: Email Magic Link via Resend
- Sessions in Postgres (Better Auth default)
- Protected routes: middleware redirects to `/login` if no session
- Server Actions: use `auth()` helper, throw if unauthenticated

## Deploys

| Environment | Trigger | Database |
|-------------|---------|----------|
| Production  | Push to `main` | Neon `main` branch |
| Preview     | Every PR | Neon branch per PR |
| Local       | `pnpm dev` | Neon `dev` branch |

## External services rule

All vendor SDKs (YouTube API, Sentry, future providers) are wrapped in small interfaces under `src/server/`. Nothing imports a vendor SDK directly into business logic. Costs 5 minutes per service, buys swap-out freedom.

## Out of Scope for MVP

Documented to prevent scope creep:

Mobile native app, filmmaker verified accounts, direct video uploads, festivals/events, subtitles/translations, ML recommendations, social following, push notifications, i18n, public REST API for partners, Email Magic Link / Resend.

## When to Update This Doc

Same PR if you: add a top-level dependency, change folder structure, change the schema pattern, make a decision worth recording.
