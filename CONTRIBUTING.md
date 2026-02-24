# Contributing to Notra

Thanks for wanting to contribute to Notra. This guide shows how to set up locally and what we expect in PRs.

## Tech Stack

Notra is a Bun + Turborepo monorepo.

- Runtime and package manager: **Bun**
- Monorepo orchestration: **Turbo**
- Frontend: **Next.js 16**, **React 19**, **Tailwind CSS 4**
- API: **Hono** on **Cloudflare Workers**
- Database: **Postgres (Neon or PlanetScale Postgres recommended)** with **Drizzle ORM / drizzle-kit**
- Auth: **better-auth**
- Queueing and rate limiting: **Upstash (QStash/Redis)**
- API Keys: **Unkey**

## Repository Structure

```text
/
|- apps/
|  |- api/         # Hono API (Cloudflare Worker)
|  |- dashboard/   # Main Notra product app (Next.js)
|  |- docs/        # Product docs (Mintlify)
|  |- web/         # Public marketing site (Next.js)
|- packages/
|  |- db/                  # Shared Drizzle schema and DB helpers
|  |- email/               # Shared email templates/components
|  |- typescript-config/   # Shared TypeScript configs
|  |- ui/                  # Shared UI components
|- package.json
|- turbo.json
```

## Prerequisites

Install or prepare:

- **Bun** `>= 1.3`
- **Node.js** `>= 24` (used by some tooling)
- A **Postgres** database (Neon or PlanetScale Postgres recommended)
- **GitHub** and/or **Google** OAuth app credentials
- Optional but commonly needed integrations:
  - Upstash Redis
  - Upstash QStash
  - Cloudflare R2
  - Resend
  - Unkey

## Getting Started

1. Fork and clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/notra.git
cd notra
git remote add upstream https://github.com/usenotra/notra.git
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Fill in the required values in `.env`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- OAuth provider credentials
- Any provider keys needed for the area you're working on

Helpful provider docs:

- Better Auth: https://better-auth.com
- Neon: https://neon.com
- PlanetScale (if using PlanetScale Postgres): https://planetscale.com
- Upstash (Redis/QStash): https://upstash.com
- Unkey: https://unkey.com
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Resend: https://resend.com

5. Run database migrations:

```bash
bun run db:migrate
```

6. Start development:

```bash
bun dev
```

Run a single app when needed:

```bash
bun dev --filter=dashboard
bun dev --filter=api
bun dev --filter=web
bun dev --filter=docs
```

## QStash Local Workflows

If you're testing webhooks or workflows with QStash, set `NEXT_PUBLIC_APP_URL` to a public URL. `localhost` will not work for external callbacks.

Use Cloudflare Tunnel (`cloudflared`) to expose your local app:

- Install `cloudflared`:

macOS

```bash
brew install cloudflared
```

Windows (PowerShell)

```powershell
winget install --id Cloudflare.cloudflared
```

- Create and run a local tunnel to your app (for example, dashboard on port 3000):

```bash
cloudflared tunnel --url http://localhost:3000
```

- Copy the HTTPS tunnel URL and set:

```bash
NEXT_PUBLIC_APP_URL=https://your-public-tunnel-url
```

If you need a stable or custom URL, use a locally managed tunnel setup from the official docs:
https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/

## Database Workflow

Common Drizzle commands from the repo root:

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

Seed helpers:

```bash
bun run db:seed
```

## Making Changes

1. Create a branch:

```bash
git checkout -b feat/short-description
```

2. Run quality checks before you commit:

```bash
bun run format
bun run check
bun run check-types
bun run build
```

3. Commit with clear [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) messages:

```bash
git commit -m "feat(dashboard): add integration activity filters"
```

## Landing Page Copy Sync

If you update landing page copy in `apps/web/src/app/page.tsx`, also update the markdown version in `apps/web/src/app/markdown/route.ts`.

We keep both in sync so the website and markdown endpoint (`/markdown`) say the same thing.

## Pull Request Guidelines

- Explain the problem and why this change is needed.
- Keep PRs focused and reasonably small.
- Link related issues when applicable.
- Include screenshots or recordings for UI changes.
- Update docs when behavior, APIs, or setup steps change.
- Make sure checks pass before requesting review.

## Code Style

- Follow existing patterns in the touched area.
- Use `ultracite`/Biome formatting and linting via repo scripts.
- Prefer readable, self-documenting code.
- Add comments only when logic is not obvious.

## Reporting Bugs and Requesting Features

- Use GitHub Issues.
- Search existing issues first to avoid duplicates.
- Include clear reproduction steps, expected behavior, and actual behavior.

## Need Help?

Open an issue or start a discussion in the repo.

Thanks for helping improve Notra.
