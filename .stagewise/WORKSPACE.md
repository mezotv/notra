# WORKSPACE

## SNAPSHOT

type: monorepo  
langs: TypeScript, JavaScript  
runtimes: Node.js 24.11.1, Bun  
pkgManager: Bun 1.3.9  
deliverables: web (Next.js marketing), dashboard (Next.js app), api (Hono/Workers), docs (Mint), shared libs  
rootConfigs: `turbo.json`, `package.json`, `biome.jsonc`  

---

## PACKAGES

| name | path | type | deps | usedBy | role |
|------|------|------|------|--------|------|
| @notra/db | packages/db | lib | — | api,dashboard | Drizzle schema, PostgreSQL client factory |
| @notra/ui | packages/ui | lib | — | web,dashboard | React components, Tailwind, hooks |
| @notra/email | packages/email | lib | — | dashboard | React Email templates, Resend integration |
| @notra/typescript-config | packages/typescript-config | config | — | db,ui,email,dashboard | TypeScript base config |
| api | apps/api | service | @notra/db | — | Hono OpenAPI on Cloudflare Workers |
| web | apps/web | app | @notra/ui | — | Next.js marketing site, fumadocs MDX |
| dashboard | apps/dashboard | app | @notra/db,@notra/ui,@notra/email | — | Next.js full-featured app, auth, workflows |
| docs | apps/docs | app | — | — | API documentation (Mint) |

---

## DEPENDENCY GRAPH

api → @notra/db  
web → @notra/ui  
dashboard → @notra/db, @notra/ui, @notra/email  
@notra/db → (no internal deps)  
@notra/ui → (no internal deps)  
@notra/email → (no internal deps)  

---

## ARCHITECTURE

### api (`apps/api`)

entry: `apps/api/src/index.ts` (Hono app, OpenAPIHono)  
routing: `apps/api/src/routes/content.ts` (GET posts endpoints)  
auth: Unkey API keys, middleware in `src/middleware/auth.ts`  
db: `@notra/db/drizzle-http` factory (HTTP adapter for Workers)  
api: OpenAPI 3.1 schema registered, Bearer token auth, v1 routes  
build: Wrangler, target Cloudflare Workers, Node.js compat flag  
dirs: `src/routes/` → REST endpoints, `src/middleware/` → auth/db setup, `src/schemas/` → Zod validation  

### web (`apps/web`)

entry: `apps/web/src/app/page.tsx`  
routing: Next.js App Router, (changelog), (legal) route groups, `/markdown` for content negotiation  
state: Client-side only, Tailwind + Motion  
ui: @notra/ui, Tailwind CSS 4, custom rewrites for Markdown endpoints  
build: Next.js 16, React Compiler enabled, turbopack enabled  
dirs: `src/app/` → routes, `src/components/` → UI, `src/content/` → docs, `src/styles/` → globals  

### dashboard (`apps/dashboard`)

entry: `apps/dashboard/src/app/layout.tsx` → `src/app/page.tsx`  
routing: Next.js App Router, (auth), (auth-public), (dashboard) groups, `/api/` route handlers  
auth: Better-Auth, session + OTP + organization plugin, server-side in `src/lib/auth/server.ts`  
state: TanStack Query (client), Nuqs (URL state), Autumn (billing), Databuddy (analytics)  
api: Multiple handlers: `/api/auth/*`, `/api/organizations/*`, `/api/workflows/*`, `/api/webhooks/*`, `/api/upload/*`  
db: Drizzle ORM (node-postgres), schema from `@notra/db/schema`  
integrations: Upstash Redis, QStash, Context.dev, GitHub OAuth, OpenRouter AI, Supermemory  
build: Next.js 16, React Compiler, useCache experimental, transpiles all @notra packages  
dirs: `src/lib/auth/` → auth config, `src/lib/ai/` → AI gateway, `src/lib/email/` → email actions, `src/app/` → routes, `src/components/` → UI  

### @notra/db (`packages/db`)

exports: `./drizzle` → node-postgres client, `./drizzle-http` → HTTP client factory, `./schema` → all tables/enums, `./operators` → drizzle helpers  
schema: users, sessions, accounts, verifications, organizations, members, posts, integrations, workflows, logs  
caching: Upstash Redis cache (if env vars present)  
consumedBy: api (via drizzle-http), dashboard (via drizzle)  

### @notra/ui (`packages/ui`)

exports: components/*, hooks/*, lib/*, globals.css, postcss.config  
components: shadcn-based, Tailwind, Lucide icons, React Flow, Embla carousel, Lexical (WYSIWYG)  
consumedBy: web, dashboard  

### @notra/email (`packages/email`)

exports: `./src/index.ts` → email templates  
templates: React Email + Resend integration  
consumedBy: dashboard auth/workflow emails  

---

## STACK

`api` → framework: Hono 4.12, routing: OpenAPI, auth: Unkey, db: drizzle-http (Neon), runtime: Cloudflare Workers  

`web` → framework: Next.js 16, routing: App Router, docs: fumadocs-mdx, ui: Tailwind CSS 4, runtime: Node.js/Edge  

`dashboard` → framework: Next.js 16, routing: App Router, auth: better-auth, state: TanStack Query, db: drizzle-orm (node-postgres), orm: drizzle, runtime: Node.js, ai: Vercel AI SDK + OpenRouter  

`@notra/db` → orm: drizzle-orm, db: PostgreSQL (Neon), caching: Upstash Redis  

`@notra/ui` → framework: React 19, ui: Tailwind CSS 4, components: shadcn, icons: Lucide/Hugeicons, motion: Motion 12, editor: Lexical  

---

## STYLE

- naming: camelCase functions, PascalCase components, kebab-case routes  
- imports: workspace: imports (e.g., @notra/db/schema), path aliases (@/, relative for local)  
- typing: strict TypeScript, Zod for runtime validation, schema-driven API  
- errors: Zod validation errors in API responses, try-catch for async  
- patterns: server/client split (app router), action functions in lib/email/actions.ts  
- lint: Biome (core, next, astro presets), UltraCite for formatting  
- formatting: auto via UltraCite, Biome rules strict except where documented (console off, etc.)  

---

## STRUCTURE

`apps/` → All deliverable applications  
`apps/api/src/` → API server code  
`apps/dashboard/src/` → Full-featured app  
`apps/web/src/` → Marketing/docs site  
`apps/docs/` → OpenAPI docs  
`packages/` → Shared libraries  
`packages/db/src/` → Database schema & clients  
`packages/ui/src/` → Component library  
`packages/email/src/` → Email templates  

---

## BUILD

workspaceScripts:  
- `build` → turbo run build (depends on ^build)  
- `dev` → turbo run dev (persistent, no cache)  
- `check-types` → turbo run check-types (depends on ^transit)  
- `db:generate` → drizzle-kit generate  
- `db:migrate` → drizzle-kit migrate  
- `db:push` → drizzle-kit push (sync schema)  
- `db:drop` → drizzle-kit drop  
- `db:seed` → run both seed scripts  
- `format` → UltraCite fix  

ci: `.github/workflows/code-quality.yml` → bun install, ultracite check on push/PR  

envFiles: `.env`, `.env.example`  

envPrefixes: `DATABASE_URL`, `UPSTASH_REDIS_REST_*`, `GITHUB_CLIENT_*`, `GOOGLE_CLIENT_*`, `BETTER_AUTH_*`, `OPENROUTER_API_KEY`, `CONTEXT_DEV_API_KEY`, `RESEND_API_KEY`, `UNKEY_*`, `CLOUDFLARE_*`, `QSTASH_*`  

---

## LOOKUP

add API endpoint → `apps/api/src/routes/content.ts`, `apps/api/src/index.ts`, `apps/api/src/schemas/`  
add dashboard route → `apps/dashboard/src/app/`  
add API route handler → `apps/dashboard/src/app/api/`  
add component → `packages/ui/src/components/`  
add DB table → `packages/db/src/schema.ts`, then `bun run db:generate`, `bun run db:migrate`  
add email template → `packages/email/src/emails/`  
add auth logic → `apps/dashboard/src/lib/auth/`  
configure styling → `packages/ui/src/styles/`, `tailwind.config.*`  
integrate external service → `apps/dashboard/src/lib/` (new module)  

---

## KEY FILES

`apps/api/src/index.ts` → Hono app setup, v1 route registration | auth middleware, db binding | API schema  
`apps/api/src/routes/content.ts` → POST/GET endpoints, OpenAPI routes | schema validation | org-scoped queries  
`apps/api/src/middleware/auth.ts` → Unkey verification, permission checks | API key validation  

`apps/dashboard/src/app/layout.tsx` → Root layout, providers, fonts | QueryClient config, theme setup | all dashboard routes  
`apps/dashboard/src/lib/auth/server.ts` → Better-Auth config, org plugin, email actions | auth flow | org management  
`apps/dashboard/src/utils/providers.tsx` → QueryClient, Autumn, Nuqs, Databuddy setup | state management | client providers  

`apps/web/src/app/page.tsx` → Marketing landing, MDX content | fumadocs integration | styling showcase  
`apps/web/next.config.ts` → MDX config, rewrites for markdown negotiation | security headers | image optimization  

`packages/db/src/schema.ts` → All tables: users, sessions, orgs, members, posts, workflows | enums, indexes | source of truth  
`packages/db/src/drizzle.ts` → Production client (node-postgres) | Upstash cache config | used by dashboard  
`packages/db/src/drizzle-http.ts` → HTTP factory for Workers | Upstash cache config | used by api  

`packages/ui/src/components/` → shadcn components, custom UI, Tailwind | shared across web/dashboard | entry point for all UI  

`packages/typescript-config/base.json` → TypeScript base config | extended by all apps/packages | tsconfig root  

`turbo.json` → Workspace tasks (build, dev, check-types), global env vars, task dependencies | orchestration  
`biome.jsonc` → Lint rules (Biome), UltraCite presets, file exclusions | code quality  
`.github/workflows/code-quality.yml` → CI: bun install, ultracite check | automated code quality  

---

## NOTES

- All inter-package imports use workspace:* resolution in manifests  
- API is stateless HTTP service on Cloudflare Workers; dashboard is stateful Next.js app  
- Better-Auth handles user sessions; Unkey handles API key auth  
- TanStack Query is de facto state manager for async data in dashboard  
- Drizzle ORM with PostgreSQL (Neon) is sole data layer; Upstash Redis for query caching  
- Biome + UltraCite enforce code quality; no Jest/Vitest configured yet  
