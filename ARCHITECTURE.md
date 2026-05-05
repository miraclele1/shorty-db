# ShortyDB — Architecture

_Last updated: 2026-05-05_

This document explains how ShortyDB is built and why. It's the source of truth for architectural decisions. If you make a non-trivial choice that affects the whole codebase, update this file in the same PR.

## Vision

A discovery platform for artistic short-form video content (short films, music videos, trailers, curated streams). Solves the discovery problem on YouTube by adding structured metadata, community curation, and a Letterboxd-style social layer.

The platform is a **metadata hub**: we don't host video. Users watch on YouTube via outbound links.

## Stack

| Layer            | Technology                                  | Why                                                      |
|------------------|---------------------------------------------|----------------------------------------------------------|
| Framework        | Next.js 15 (App Router)                     | SSR/PPR for SEO; Server Actions for full-stack TS        |
| UI               | React 19, Tailwind v4, shadcn/ui            | Fast iteration, owned components, no library lock-in     |
| Client state     | Zustand                                     | Minimal API, no Redux ceremony                           |
| Server state     | TanStack Query                              | Caching, revalidation, optimistic UI                     |
| Forms            | React Hook Form + Zod                       | Standard, performant, type-safe                          |
| Backend          | Next.js Server Actions + Route Handlers     | One project, one deploy, full type-safety end-to-end     |
| Runtime          | Node.js 22 LTS                              | Stable, works on all team OSes                           |
| ORM              | Drizzle                                     | Type-safe, generates SQL we can read                     |
| Database         | PostgreSQL (Neon)                           | Universal, branching, scale-to-zero                      |
| Auth             | Better Auth                                 | Owns user data, plugin-rich, no vendor lock-in           |
| Email            | Resend + React Email                        | Best DX for transactional mail                           |
| Errors           | Sentry                                      | Standard, free tier covers MVP                           |
| Analytics        | Vercel Analytics + Speed Insights           | Built-in, zero setup, free tier OK for MVP               |
| Hosting          | Vercel                                      | Zero-config Next.js, preview deploys per PR              |
| External APIs    | YouTube Data API v3, TMDB (later)           | Source of truth for video metadata                       |

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public landing, about
│   ├── (app)/              # Authenticated app routes
│   │   ├── films/[slug]/   # Film detail page
│   │   ├── lists/          # User collections
│   │   └── profile/        # User profile
│   ├── api/                # Public Route Handlers
│   │   └── auth/[...all]/  # Better Auth endpoints
│   └── layout.tsx
│
├── components/
│   ├── ui/                 # shadcn primitives (button, dialog, etc.)
│   ├── film/               # Film-specific components
│   ├── rating/             # Rating widget, review list
│   └── shared/             # Header, footer, layouts
│
├── server/                 # Server-only code (never imported into client)
│   ├── actions/            # Server Actions (mutations)
│   ├── db/
│   │   ├── schema/         # Drizzle table definitions
│   │   ├── queries/        # Reusable read queries
│   │   └── client.ts       # Drizzle client instance
│   ├── youtube/            # YouTube API client wrapper
│   ├── auth.ts             # Better Auth config
│   └── ratings/            # Bayesian rating logic
│
├── lib/                    # Shared utilities (client + server safe)
│   ├── utils.ts
│   └── slugify.ts
│
├── env.ts                  # t3-env runtime env validation
└── styles/
    └── globals.css
```

## Database Schema

We use a **polymorphic content** pattern: one base `content` table + per-type `*_meta` tables. This lets us add music videos, trailers, streams later without refactoring core entities.

### Core entities (MVP)

```
content
  id              uuid PK
  type            enum('short_film' | 'music_video' | 'trailer' | 'stream')
  slug            text unique
  title           text
  youtube_id      text unique
  channel_id      text
  published_at    timestamptz
  added_by        uuid FK -> users.id
  status          enum('active' | 'pending_review' | 'unavailable')
  created_at      timestamptz
  updated_at      timestamptz

short_film_meta
  content_id      uuid PK FK -> content.id
  director        text
  runtime_seconds int
  release_year    int
  synopsis        text
  festival        text  -- nullable

users                       -- managed by Better Auth, extended below
  id              uuid PK
  email           text unique
  name            text
  avatar_url      text
  created_at      timestamptz

ratings
  id              uuid PK
  content_id      uuid FK -> content.id
  user_id         uuid FK -> users.id
  score           decimal(2,1)  -- 0.0 to 10.0
  created_at      timestamptz
  unique(content_id, user_id)

reviews
  id              uuid PK
  content_id      uuid FK -> content.id
  user_id         uuid FK -> users.id
  body            text
  created_at      timestamptz

review_votes
  review_id       uuid FK -> reviews.id
  user_id         uuid FK -> users.id
  vote            smallint  -- +1 or -1
  primary key (review_id, user_id)

lists
  id              uuid PK
  user_id         uuid FK -> users.id
  title           text
  description     text
  is_public       boolean
  created_at      timestamptz

list_items
  list_id         uuid FK -> lists.id
  content_id      uuid FK -> content.id
  position        int
  added_at        timestamptz
  primary key (list_id, content_id)

watchlist
  user_id         uuid FK -> users.id
  content_id      uuid FK -> content.id
  added_at        timestamptz
  watched_at      timestamptz  -- nullable
  primary key (user_id, content_id)

genres
  id              int PK
  slug            text unique
  name            text

content_genres
  content_id      uuid FK -> content.id
  genre_id        int FK -> genres.id
  primary key (content_id, genre_id)
```

### Why polymorphic this way

- **Base `content` table** holds shared fields and gives us one place to query "all content"
- **Per-type `*_meta` tables** keep type-specific fields properly typed and indexed (no JSONB soup)
- **Adding music videos later** = add `music_video_meta` table + enum value + type-specific UI. Zero migrations on existing tables.
- This is standard table-per-class inheritance, not the EAV anti-pattern.

### Future per-type tables (post-MVP)

```
music_video_meta(content_id PK FK, artist, album, release_date, label)
trailer_meta(content_id PK FK, parent_film, trailer_type, language)
stream_archive_meta(content_id PK FK, original_stream_date, duration, vod_url)
```

## Key Architectural Decisions (ADRs)

### ADR-001: Server Actions over a separate API server

We use Next.js Server Actions for all internal mutations and Route Handlers only for public APIs (auth callbacks, webhooks). No separate Hono/Express server.

**Why**: One project, one deploy, end-to-end type safety. We can extract a separate API later by wrapping Route Handlers in Hono — but we don't need it now.

### ADR-002: YouTube API calls are async via job queue

YouTube Data API v3 has a **10k unit/day default quota**. Synchronous calls from request handlers create UX latency and can blow the quota.

**Plan**:
- Submission: user submits URL → we record it → return 200 → background job enriches metadata
- Refresh: scheduled jobs refresh stats with tiered frequency (daily for top 100, weekly for the rest)

**Implementation**: `pg-boss` (Postgres-backed queue, no extra infra). Added when we hit the first sync call. Quota increase request submitted on day 0 (4-8 week approval cycle).

### ADR-003: No video hosting, ever

We are a metadata layer. Users watch on YouTube. This protects copyright and keeps infra costs low. If a video is removed from YouTube, we mark `content.status = 'unavailable'` and surface it in UI.

### ADR-004: Bayesian average for ratings

Plain mean is misleading for items with few ratings. We use Bayesian average:

```
weighted_score = (v / (v + m)) * R + (m / (v + m)) * C
```

Where:
- `R` = mean rating for this item
- `v` = number of ratings for this item
- `m` = minimum ratings threshold (start with `m=10`)
- `C` = mean rating across all items

Recomputed via materialized view, refreshed hourly.

### ADR-005: Search starts in Postgres, moves to Typesense at scale

Postgres FTS + `pg_trgm` extension covers up to ~10k content items with sub-100ms latency. We add Typesense when search becomes a clear bottleneck. Don't add it preemptively.

### ADR-006: Wrap external services in interfaces

All vendor SDKs (YouTube API, Resend, Sentry, future job queue) are accessed through small internal interfaces in `src/server/`. No vendor SDK is imported directly into business logic. This costs ~5 minutes per service and gives us swap-out freedom.

## Auth Flow

- **Providers**: Google OAuth + Email Magic Link (via Resend)
- **Sessions**: Database sessions in Postgres (Better Auth default)
- **Protected routes**: Middleware checks session, redirects to `/login` if absent
- **Server Actions**: Use `auth()` helper to get current user; throw if missing

## Environment & Deploys

- **Production**: `main` branch → auto-deploy to Vercel production
- **Preview**: Every PR → unique Vercel preview URL + Neon DB branch
- **Local**: `pnpm dev`, points at Neon `dev` branch

## Performance Notes

- Use `unstable_cache` / `revalidateTag` for film detail pages — they change rarely
- Stream dynamic sections (rating, comments) via Suspense boundaries
- Adopt PPR (Partial Prerendering) when stable in Next.js
- Image optimization via `next/image` — YouTube thumbnails first, custom posters in R2 later

## Out of Scope for MVP

Documented to prevent scope creep. These are **NOT** in MVP:

- Mobile native app
- Filmmaker verified accounts
- Direct video uploads
- Festivals/events module
- Subtitle/translation features
- ML-based recommendation engine
- Social following beyond basic comments
- Push notifications
- Internationalization (RU + EN UI only after launch)
- Public REST API for partners

## When to Update This Doc

Update `ARCHITECTURE.md` in the same PR if you:

- Add a new top-level dependency
- Change folder structure
- Add a table or change schema fundamentally
- Make an architectural decision worth recording (add a new ADR section)
- Decide something is or isn't in scope for MVP
