# notra

A Turbo monorepo that connects team tools (GitHub / Linear / Slack) and
uses AI to draft changelogs, blog posts, and social updates. Two apps
matter for security: `apps/dashboard` (Next.js 16 product app, better-auth
+ oRPC + Drizzle/Postgres) and `apps/api` (Hono OpenAPI service used by
the Framer plugin and CLI). Backing services: Upstash Redis + QStash +
Workflow, Unkey for API keys, Autumn for billing, Resend for email.

## Auth shape

- **Sessions (dashboard)**: `getServerSession({ headers })` from
  `@/lib/auth/session` wraps `auth.api.getSession()`. The `auth` instance
  lives in `@/lib/auth/server` (better-auth: email-OTP, Google / GitHub
  OAuth, `organization` plugin, `admin` plugin, `haveIBeenPwned`).
- **Org access (dashboard)**: every per-org route MUST go through
  `assertOrganizationAccess({ headers, organizationId, user? })` or its
  `NextRequest` wrapper `withOrganizationAuth(request, organizationId)`
  from `@/lib/auth/organization`. Both validate membership in `members`
  and reject with `ORPCError`. oRPC procedures use `authorizedProcedure`
  from `@/lib/orpc/base`, which only enforces authentication — handlers
  must still call `assertOrganizationAccess` themselves.
- **Public API (`apps/api`)**: `authMiddleware()` verifies an Unkey
  bearer token. The caller's org id MUST be read with
  `getOrganizationId(c)` (returns `auth.identity.externalId`), NEVER
  from path params or body. `subscriptionMiddleware()` blocks write
  methods (POST/PUT/PATCH) on lapsed plans; GET/DELETE are intentionally
  open for data-portability.
- **CLI sessions**: `/api/cli/sessions/[sessionId]/authorize` mints an
  Unkey key (TTL `CLI_API_KEY_TTL_MS`) and stores it in Redis under the
  session id. Requires session + org access + active subscription.

## Threat model

1. **Cross-org IDOR** — every record has `organizationId`. In the
   dashboard, missing `assertOrganizationAccess` / `withOrganizationAuth`
   on a route that takes `organizationId` from the URL or body is
   critical. In `apps/api`, deriving org id from path/body instead of
   `getOrganizationId(c)` is the same bug.
2. **Webhook forgery** — `lib/webhooks/github.ts` and `lib/webhooks/linear.ts`
   verify HMAC signatures with `crypto.timingSafeEqual`. A new webhook
   handler that skips signature verification, uses `===` on signatures,
   or is added to `WEBHOOK_HANDLERS` without one is critical.
3. **Integration token exfiltration** — OAuth/PAT tokens are stored
   encrypted via `encryptToken` / `decryptToken` in
   `@notra/ai/crypto/token-encryption` (which wraps
   `@notra/db/utils/integration-encryption`). Logging plaintext tokens,
   returning them in API responses, or storing unencrypted is critical.
4. **OAuth state abuse** — Linear OAuth (and future providers) stores
   `{ organizationId, userId, callbackPath }` in Redis under
   `linear_oauth:<state>` with a 10-minute TTL, deleted on callback. A
   callback that doesn't `redis.del(...)` the state, doesn't compare the
   stored `organizationId` against the session, or accepts arbitrary
   `callbackPath` is exploitable.
5. **Privilege misuse via API keys** — `getPermissionsForLevel` maps
   `api.write` → `[api.read, api.write]`. New code that sets
   `permissions` directly, lengthens TTL, or bypasses
   `assertActiveSubscription` when minting keys is high-impact.

## Project-specific patterns to flag

- A handler under `apps/dashboard/src/app/api/.../[organizationId]/` that
  reads/writes org-scoped data without calling `withOrganizationAuth` or
  `assertOrganizationAccess`.
- A handler in `apps/api/src/routes/*` that takes an org id from the
  request (path param, body, query) instead of `getOrganizationId(c)`,
  or that uses it without comparing against `getOrganizationId(c)` (see
  the cross-org check pattern in `legacy-redirects.ts`).
- New entry in `WEBHOOK_HANDLERS` (`app/api/webhooks/[provider]/...`)
  without an HMAC verification step using `crypto.timingSafeEqual`.
- `JSON.parse(await request.json())` or `request.json() as SomeType`
  without a Zod schema from `schemas/` — every body must be validated.
- Reading `process.env.INTEGRATION_ENCRYPTION_KEY` outside
  `packages/ai/src/crypto/` or `packages/db/src/utils/`.
- Conditioning auth/feature-gates on `process.env.NODE_ENV !== "production"`.
- New oRPC procedure on `baseProcedure` (instead of `authorizedProcedure`)
  that reads or mutates org data.

## Known false-positives

- `apps/dashboard/src/proxy.ts` — has a "THIS IS NOT SECURE!" comment by
  design. It's an optimistic better-auth redirect on `/dashboard`; real
  authorization happens per-route. Flag only if a handler relies on it
  as the security boundary.
- `apps/dashboard/src/app/api/healthcheck/route.ts` — intentionally
  unauthenticated.
- `apps/dashboard/src/app/demo/**`, `apps/dashboard/src/app/test/**`,
  `apps/dashboard/src/app/design-system/**` — product demo / internal
  preview pages, not real org data.
- `apps/api/src/routes/legacy-redirects.ts` — 308 redirects for
  back-compat; performs the cross-org check before redirecting.
- `subscriptionMiddleware` letting GET/DELETE through on lapsed orgs is
  intentional (GDPR / data portability).
- `apps/dashboard/src/app/api/auth/[...all]/route.ts` and
  `apps/dashboard/src/app/api/autumn/[...all]/route.ts` — catch-all
  delegates to `better-auth` / `autumn-js`; auth lives in those libs.
