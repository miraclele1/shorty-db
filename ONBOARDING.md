# Hey, welcome to ShortyDB 👋

This doc is for you if you just got access to the repo and have no idea where to start. The [README](./README.md) covers the technical setup — read that first. This doc covers everything else: how we actually work, what to expect, and how not to accidentally break things.

---

## What are we building?

Think Letterboxd, but for short films on YouTube. People submit YouTube links, the platform pulls the metadata (title, director, runtime), and the community rates and reviews them. We don't host any video — users click through to YouTube to watch.

That's it. Keep that mental model and most decisions will make sense.

---

## You're going to be vibe coding. Here's how that works here.

Vibe coding means you'll be using AI (Cursor, Claude, Copilot — whatever you use) to write most of the actual code. That's fine, that's the plan. But there are a few things AI won't know about this specific project unless you tell it:

**Always give your AI this context when starting a task:**
- We use Next.js 15 App Router with Server Actions — no separate backend
- Database is PostgreSQL via Drizzle ORM on Neon
- Auth is Better Auth with Google OAuth
- All env vars go through `src/env.ts` — never `process.env.SOMETHING` directly
- DB queries live in `src/server/db/queries/` — not inside components
- We use `pnpm`, not `npm` or `yarn`

Copy-paste this into your AI chat before describing your task. It'll save you a lot of back-and-forth.

---

## Picking up a task

Go to the [Issues tab](https://github.com/miraclele1/shorty-db/issues) in the repo. Pick one that isn't assigned to anyone. Assign it to yourself so nobody else starts the same thing.

Each issue has acceptance criteria — a checklist of what "done" means for that task. Read it before you start, not after. It'll tell you exactly what needs to work.

When in doubt about scope — does this thing need to do X or not? — ask Miras. Don't guess and build extra stuff.

---

## Git workflow, explained simply

This is the part people mess up most. It's not complicated, just follow the steps.

**1. Before you start any task, pull the latest main:**
```bash
git checkout main
git pull
```

**2. Create a new branch for your task:**
```bash
git checkout -b feat/your-task-name
```
Branch naming: `feat/` for new features, `fix/` for bugs, `chore/` for config stuff. Keep it short, use dashes, no spaces. Example: `feat/rating-widget`.

**3. Write your code. Commit as you go:**
```bash
git add .
git commit -m "feat(rating): add rating widget component"
```
Commit message format: `type(scope): what you did`. Don't overthink it — `feat(auth): add login button` is fine.

**4. Push your branch and open a Pull Request:**
```bash
git push origin feat/your-task-name
```
Then go to GitHub, it'll suggest opening a PR. Fill in what changed and how to test it.

**5. Get one approval, then someone merges it.**
Don't merge your own PR. Ping whoever's around.

That's the whole loop. The golden rule: **never push directly to `main`**. Branch protection will block you anyway, but still.

---

## The env file situation

When you clone the repo, there's a `.env.example` file. It lists all the environment variables the project needs, but without the actual values (they'd be secrets).

You need a `.env.local` file with real values to run the project locally. Get it from Miras — he'll send you the values, or point you to where they are.

Once you have it: **never commit `.env.local` to git**. It's already in `.gitignore` so Git will ignore it, but double-check before pushing if you're not sure.

---

## Running the project locally

Full steps are in the [README](./README.md#quick-start), but the short version once you have `.env.local`:

```bash
pnpm install
pnpm db:push
pnpm dev
```

Open `http://localhost:3000`. If something's broken on first run, 90% of the time it's the env file. Check that all variables are filled in.

---

## Useful commands

All in the [README](./README.md#scripts), but the ones you'll actually use:

```bash
pnpm dev          # run the app locally
pnpm lint         # check for code style issues — fix before opening a PR
pnpm typecheck    # check for TypeScript errors — fix before opening a PR
pnpm db:studio    # open a visual UI to browse the database
pnpm db:push      # apply schema changes to your local DB
```

Run `pnpm lint` and `pnpm typecheck` before every PR. If they're not green, the PR won't get approved.

---

## Things that will bite you if you ignore them

**Use `pnpm`, not `npm`.** If you `npm install` something, you'll create a `package-lock.json` that conflicts with our `pnpm-lock.yaml`. Delete it and use `pnpm add package-name` instead.

**Don't write `process.env.WHATEVER` directly.** Add the variable to `src/env.ts` and use it from there. The project will crash on startup if an env var is missing — that's intentional, so you catch it early.

**Don't put database queries in React components.** Put them in `src/server/db/queries/` and call them from Server Components or Server Actions. Your AI might suggest the wrong pattern — correct it.

**YouTube API has a quota.** Don't call the YouTube API directly from a request handler. There's a job queue (pg-boss) for that. If your task involves YouTube API calls, talk to Miras first.

---

## Stuck? Here's the escalation path

- Stuck for 30 min → ask in the team chat, describe what you tried
- Stuck for 2 hours → pair with someone, screen share
- Something's broken in `main` → ping Miras immediately, don't wait

Don't silently grind on something for hours. We're a 5-person team, unblocking each other is part of the job.

---

## What "done" actually means

A task is done when:
- Code is merged into `main`
- It's live on the production URL and you manually checked it works
- The issue is closed with a comment on what you shipped

"It works on my machine" is not done. Always verify on prod after merge.
