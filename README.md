# ShortyDB — Short Film Database

A discovery platform for short-form artistic content on YouTube. Curated, searchable, community-rated. Think Letterboxd for indie shorts, music videos, and trailers.

> **Status**: MVP in development. Not yet production.

## Onboarding

New to the project? Start with [ONBOARDING.md](./ONBOARDING.md).

## Quick Start

Requires **Node.js 22 LTS** and **pnpm**.

```bash
# 1. Clone
git clone https://github.com/miraclele1/shorty-db.git
cd shorty-db

# 2. Install
pnpm install

# 3. Environment
cp .env.example .env.local
# Get values from team lead — see CONTRIBUTING.md

# 4. Database
pnpm db:push

# 5. Run
pnpm dev
```

App runs at http://localhost:3000.

If you can't get past step 3 in 15 minutes, ping the team lead — env setup shouldn't be hard.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **State**: Zustand (client) + TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Backend**: Next.js Server Actions & Route Handlers, Node.js 22
- **Database**: PostgreSQL on Neon, Drizzle ORM
- **Auth**: Better Auth (Google OAuth)
- **Hosting**: Vercel
- **Observability**: Vercel Analytics + Speed Insights
- **Dev tooling**: pnpm, Biome
- **External APIs**: YouTube Data API v3

For full architecture, decisions, and DB schema, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Run production build locally
pnpm lint             # Biome lint
pnpm format           # Biome format
pnpm typecheck        # TypeScript check
pnpm db:push          # Apply schema to DB (dev)
pnpm db:migrate       # Run migrations (prod)
pnpm db:studio        # Drizzle Studio (DB UI)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for git workflow, branch naming, and PR process.

## License

Private — All rights reserved. Internal team use only.
