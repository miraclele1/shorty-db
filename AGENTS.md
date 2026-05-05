# ShortyDB — Notes for AI tools

A discovery platform for short-form artistic video content (short films, music videos, trailers, streams). Metadata hub — videos hosted on YouTube via outbound links.

## Stack

- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **React 19**, **Tailwind CSS v4**, **shadcn/ui** (Radix primitives)
- **Drizzle ORM** + **PostgreSQL** (Neon)
- **Better Auth** (Google OAuth + Magic Link via Resend)
- **Zustand** (client state) + **TanStack Query** (server state)
- **React Hook Form** + **Zod** (forms)
- **Biome** (lint + format) — replaces ESLint
- **TypeScript** strict mode

## Conventions

- Server Actions for mutations; Route Handlers (`src/app/api/`) only for public APIs
- All env vars via `src/env.ts` — never `process.env` directly in app code
- DB queries live in `src/server/db/queries/` — not in components
- All vendor SDKs wrapped in interfaces under `src/server/`

See `ARCHITECTURE.md` for the full design and `CONTRIBUTING.md` for git/PR workflow.
