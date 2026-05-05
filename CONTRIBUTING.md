# Contributing to RapidIT

This document defines how we work together. Read it once before opening your first PR(Pull Request).

## Git Workflow: GitHub Flow

We use simple **GitHub Flow** — no `develop` branch, no Git Flow ceremony.

1. Branch off `main`
2. Push your branch, open a PR
3. Get 1 review approval
4. CI must pass
5. Squash merge into `main`
6. Delete branch

`main` is always deployable. Don't push directly — branch protection enforces this.

## Branch Naming

Format: `<type>/<short-description>`

Types:
- `feat/` — new feature (e.g. `feat/film-page`)
- `fix/` — bug fix (e.g. `fix/auth-callback-redirect`)
- `chore/` — tooling, deps, config (e.g. `chore/upgrade-nextjs`)
- `refactor/` — code restructure, no behavior change
- `docs/` — README, ARCHITECTURE, comments

Use lowercase, kebab-case. Keep it short — under 5 words.

## Commit Messages: Conventional Commits

Format: `<type>(<scope>): <subject>`

Examples:
- `feat(film): add rating component`
- `fix(auth): handle expired magic link`
- `chore(deps): bump drizzle to 0.40`
- `refactor(db): extract content query helpers`

Scope is optional. Keep subject under 60 chars, imperative mood ("add" not "added").

## Pull Requests

### Before opening
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Feature works locally
- [ ] No commented-out code, no `console.log`

### PR description should answer
- **What** changed (in one sentence)
- **Why** (link to issue if exists: `Closes #42`)
- **How to test** (steps for the reviewer)
- **Screenshots** if UI

### Review rules
- 1 approval required to merge
- Reviewer should respond within 24h on weekdays
- Use "Request changes" only for blockers; otherwise leave comments
- Author resolves conversations after addressing them

## Code Style

Biome enforces formatting and linting automatically. If `pnpm lint` is green, you're fine.

Beyond Biome:
- TypeScript `strict: true` — no `any`, no `// @ts-ignore` without an explanatory comment
- Prefer Server Components; only use `"use client"` when interactivity is needed
- Server Actions for mutations, Route Handlers for public API only
- All env vars go through `src/env.ts` (validated by `t3-env`)
- Database queries live in `src/server/db/queries/` — not scattered in components
- No business logic in React components — extract to `lib/` or `server/`

## Environment Variables

`.env.example` has the full list with comments. To get actual values:

1. Ping the team lead (Miras) on the team chat
2. Or check shared Vercel project for non-secret config

**Never commit `.env.local` or any file with real secrets.** It's in `.gitignore` for a reason.

## Local Dev: Database Branching

Neon supports per-branch databases — use this for any non-trivial schema change:

1. Create a Neon branch matching your git branch name
2. Update `DATABASE_URL` locally to point at it
3. Run `pnpm db:push` against the branch
4. PR triggers a Vercel preview that uses your branch
5. After merge, run migration on `main` branch DB

Don't experiment with schema changes on the shared `dev` branch.

## Asking for Help

- Stuck >30 min? Ask in team chat — don't waste an hour silently
- Stuck >2h? Pair with someone
- Don't push broken code to a PR "to see if CI catches it"

## Definition of Done

A task is done when:
- [ ] Code merged to `main`
- [ ] Deployed to production (auto via Vercel)
- [ ] Manually verified on production URL
- [ ] Issue closed with a brief comment on what was shipped

## House Rules

- **Don't refactor someone else's code in your feature PR.** Open a separate refactor PR.
- **Don't bump dependencies in a feature PR.** Same — separate `chore` PR.
- **Don't merge your own PR**, even if approved. Let the approver merge, or ping for merge.
- **Friday afternoon deploys**: only if you're around for 2h after to babysit.
