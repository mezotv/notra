# Better Auth → WorkOS AuthKit Migration

This branch removes better-auth entirely and replaces it with WorkOS AuthKit
(sealed cookie sessions, WorkOS-managed invitations, custom in-app login/signup
pages on the AuthKit Authentication API) across the dashboard, console, API,
and agent/MCP OAuth surface.

## Architecture

- Local `users`, `organizations`, and `members` tables remain the source of
  truth; invitations live in WorkOS only. Nothing re-keys: WorkOS ids are mapped via
  `users.workos_user_id` and `organizations.workos_org_id`, and the local id is
  stored as `external_id` on the WorkOS side.
- `apps/dashboard` and `apps/console` use `@workos-inc/authkit-nextjs`
  (`proxy.ts` + `/auth/callback` `handleAuth` + `/login` and `/signup` redirect
  routes that accept `?returnTo=`). On first login the callback syncs the WorkOS
  user into the local `users` table (`src/lib/auth/sync.ts`), linking existing
  rows by email.
- The "active organization" no longer lives on a session row. It is derived per
  request from the `notra_last_organization` cookie plus a membership check
  (`src/lib/auth/server.ts#getAuthSession`), falling back to the most recent
  membership. Autumn's `identify` uses this derived id, so the Autumn
  `customerId` (= local org id) is unchanged.
- Client components keep the old `authClient` call surface: a facade in
  `src/lib/auth/client.ts` re-implements `useSession`, `organization.*`,
  `signOut`, etc. on top of Effect-based server actions
  (`src/lib/organizations/actions.ts`, `src/lib/auth/user-actions.ts`) and
  react-query.
- Org creation hooks were moved verbatim into `createOrganizationAction`:
  slug validation, `seedSystemSkills`, `autumn.customers.getOrCreate`
  (customerId = local org id), plus best-effort WorkOS org/membership sync.
  Team-member limits are enforced in `inviteMemberAction`.
- `apps/api` verifies agent/MCP JWTs against the AuthKit OAuth server
  (`https://{WORKOS_AUTHKIT_DOMAIN}/oauth2/jwks`), translating `sub`/`org_id`
  claims into local user/org ids via the mapping columns.
- GitHub integration tokens moved from the better-auth `accounts` table to the
  new `social_connections` table, populated in the AuthKit callback when a user
  signs in with GitHub.
- The CLI auth flow keeps using the `verifications` table (kept). The
  better-auth `sessions`, `accounts`, `jwks`, and `oauth_*` tables are dropped
  by migration 0064.

## WorkOS dashboard setup (before deploying)

1. Create/configure the environment and enable AuthKit.
2. Redirect URIs: `https://app.usenotra.com/auth/callback`,
   `https://console.usenotra.com/auth/callback`, and the localhost variants
   (`http://localhost:3000/auth/callback`, `http://localhost:3003/auth/callback`).
3. Logout redirect URI: `https://usenotra.com` (or the app login page).
4. Configure a custom AuthKit domain (e.g. `auth.usenotra.com`) — this becomes
   `WORKOS_AUTHKIT_DOMAIN` and is the issuer for agent/MCP tokens.
5. Social providers: enable Google and GitHub with our existing client ids.
   GitHub must request the scopes the integration needs (including `read:org`),
   since provider tokens now come exclusively from the AuthKit sign-in flow.
6. Create the `owner`, `admin`, and `member` roles (member = default) so
   invitation `roleSlug` and membership sync work.
7. Register a webhook endpoint for `organization_membership.created/updated/
   deleted` pointing at `{APP_URL}/api/webhooks/workos` and set its signing
   secret as `WORKOS_WEBHOOK_SECRET`.
8. Enable the AuthKit OAuth server (Connect) with dynamic client registration
   for the MCP/agent flow, and model the agent scopes
   (`posts.read`, `posts.write`, `brand-identities.*`, `integrations.*`,
   `schedules.*`, `event-triggers.*`, `chats.*`, `skills.*`, `offline_access`).
   Agent tokens fail scoped endpoints until these exist.
9. Set the environment's **external login URI** to
   `https://app.usenotra.com/auth/external` (management API:
   `updateAuthkitExternalLoginUri`) so hosted flows (device approval, MCP
   consent) authenticate through our custom pages: AuthKit redirects there with
   `external_auth_id`, the route completes via
   `POST api.workos.com/authkit/oauth2/complete` using the existing app
   session, and no hosted login screen is ever shown. (Development is set to
   `http://localhost:3000/auth/external`.)
10. Set the session cookie domain to `.usenotra.com` (env
   `WORKOS_COOKIE_DOMAIN=.usenotra.com` on the dashboard deployment) so the
   marketing site can show signed-in state.

## Environment variables

Removed: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CONSOLE_BETTER_AUTH_URL`.

| Variable | Notes |
| --- | --- |
| `APP_URL` | replaces `BETTER_AUTH_URL` (also used by emails/workflows/integrations) |
| `CONSOLE_APP_URL` | replaces `CONSOLE_BETTER_AUTH_URL` |
| `WORKOS_API_KEY` | secret key (`sk_...`) |
| `WORKOS_CLIENT_ID` | client id (`client_...`) |
| `WORKOS_COOKIE_PASSWORD` | 32+ chars (`openssl rand -base64 24`) |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | per-app callback URL (`.../auth/callback`) |
| `CONSOLE_WORKOS_REDIRECT_URI` | console callback (local dev, port 3003) |
| `WORKOS_AUTHKIT_DOMAIN` | e.g. `auth.usenotra.com`, no scheme (dashboard `.well-known` proxy + apps/api JWT verification) |
| `WORKOS_COOKIE_DOMAIN` | `.usenotra.com` in production |
| `WORKOS_WEBHOOK_SECRET` | signing secret of the `organization_membership.*` webhook endpoint (`{APP_URL}/api/webhooks/workos`) |

## Cutover order (CRITICAL)

Migration `0063` (additive: mapping columns + `social_connections`) and `0064`
(drops `accounts`, `sessions`, `invitations`, `jwks`, `oauth_*`) ship in this branch, and
**Vercel previews auto-apply migrations**. `0064` destroys the scrypt password
hashes stored in `accounts`. Therefore, for EACH database (staging, prod):

Use the cutover helper, which does steps 1-2 in the right order and leaves
the destructive migrations for the deploy:

```bash
DATABASE_URL=<target db> WORKOS_API_KEY=<sk_...> \
  bash packages/db/src/scripts/cutover-workos.sh
```

It temporarily trims the drizzle journal to apply `0063` and earlier only,
restores the journal, then runs `migrate:workos`. Pass `--finalize` to also
apply `0064+` immediately instead of letting the deploy do it. The manual
equivalent:

1. Apply `0063` only (or let a deploy of just that migration do it — do not
   push `0064` first).
2. Run the data migration while `accounts` still exists:
   `cd packages/db && bun run migrate:workos`
   (needs `DATABASE_URL` + `WORKOS_API_KEY`). The script aborts if `accounts`
   is already gone (override with `SKIP_PASSWORD_IMPORT=1`). It is idempotent: it skips rows
   that already have WorkOS ids, recovers from "already exists" conflicts via
   `external_id`/email lookup, and imports password hashes in PHC scrypt format
   (`$scrypt$ln=14,r=16,p=1$...`, matching better-auth's N=16384/r=16/p=1/dkLen=64
   with the hex-string salt, in WorkOS's PHC dialect
   `$scrypt$v=1$n=16384,r=16,p=1,kl=64$...`). It also backfills password hashes
   onto already-linked users, so partial runs self-heal — but do NOT run it
   again after real users start changing passwords in the new system, or the
   backfill would revert them to the imported hash.
3. Only then allow `0064` to apply (deploy of this branch).

The script logs a warning and continues without passwords if `accounts` is
already gone — users would then need the "forgot password" flow, so don't let
that happen on prod.

## Behavior changes

- All existing better-auth sessions are invalid at cutover; everyone signs in
  again through hosted AuthKit.
- Login/signup/forgot/reset are our own pages (`(auth)` group) built on the
  AuthKit Authentication API (`authenticateWithPassword`, provider-direct social
  via `/auth/social/*`, email verification codes). The in-app "change password"
  is "send a password reset email".
- Social account linking is read-only: users link a provider by signing in with
  it (AuthKit auto-links by verified email). GitHub integration install
  re-routes through `/login`.
- Invitations are fully WorkOS-managed: `sendInvitation`/`revokeInvitation`/
  `resendInvitation` with `roleSlug`, WorkOS sends the invitation emails, and
  the accept URL runs through AuthKit. The local `invitations` table is dropped
  (migration 0064) along with the `/invitation/[id]` page and our invite email
  template. Accepted invitations create the WorkOS user + membership; the local
  `members` row is written by the `organization_membership.*` webhook
  (`/api/webhooks/workos`, `WORKOS_WEBHOOK_SECRET`) and, as a fallback, by a
  membership reconcile that runs on every login. Roles `owner`/`admin`/`member`
  must exist in the WorkOS environment (created via the management API for
  Development).
- Console impersonation is initiated from the WorkOS Dashboard; the AuthKit
  session carries the impersonator and the console banner reflects it. "Stop
  impersonating" signs out.
- Agent/MCP OAuth moves to the AuthKit OAuth server (authorize/token/register/
  revoke under `https://{WORKOS_AUTHKIT_DOMAIN}/oauth2/*`). The dashboard's
  `.well-known/oauth-authorization-server` now proxies AuthKit's metadata, and
  existing agent tokens/refresh tokens stop working at cutover (clients
  re-register via DCR and re-authorize).
- Deleting a user deletes the WorkOS user and cascades locally.

## CLI and MCP server

- **CLI**: the bespoke device-code flow (verifications table, `/api/cli/sessions/*`,
  Unkey key minting, `/dashboard` code-entry page) is deleted; migration `0065`
  drops `verifications`. The CLI binary must switch to the OAuth Device
  Authorization Grant (RFC 8628):
  1. `POST https://api.workos.com/user_management/authorize/device` with
     `client_id={WORKOS_CLIENT_ID}` → `device_code`, `user_code`,
     `verification_uri_complete`, `interval`.
  2. Open `verification_uri_complete` in the browser (user approves on the
     hosted auth page; already-signed-in users approve in one click).
  3. Poll `POST https://api.workos.com/user_management/authenticate` with
     `grant_type=urn:ietf:params:oauth:grant-type:device_code` and the
     `device_code`, honoring `interval` and `slow_down`.
  4. Store the `refresh_token` (keychain); refresh access tokens with
     `grant_type=refresh_token`. Send `Authorization: Bearer {access_token}`
     to api.usenotra.com. Ship the new binary at cutover — old binaries break
     when the dashboard endpoints disappear.
- **Authorization model**: the API scopes (`posts.read` … `skills.write`) are
  RBAC permissions in the WorkOS environment, attached to the
  `owner`/`admin`/`member` roles (all 14 on each; admin additionally keeps the
  widget permissions). First-party tokens (CLI device flow, sessions) carry
  them in the `permissions` claim; apps/api reads `permissions` alongside
  `scope`/`scp` and treats tokens with no scope-ish claim at all as full-access
  first-party user tokens. Connect/DCR clients (MCP) get scopes granted per
  application (`setApplicationPermissions`) and shown on the consent screen.
  Recreate the permissions + role assignments in Staging/Production (done for
  Development via the management API).
- **MCP server** (separate service on Unkey Deploy at mcp.usenotra.com): update
  its `.well-known/oauth-protected-resource` to advertise
  `authorization_servers: ["https://{WORKOS_AUTHKIT_DOMAIN}"]` and swap JWT
  verification to issuer `https://{WORKOS_AUTHKIT_DOMAIN}` with JWKS
  `/oauth2/jwks`, mapping `sub`/`org_id` to local ids exactly like
  `apps/api/src/middleware/auth.ts`. DCR and CIMD are enabled on the
  environment. In the WorkOS dashboard, add `https://api.usenotra.com` and
  `https://mcp.usenotra.com/mcp` as Resource Indicators (Connect
  configuration) so tokens carry the right `aud`.

## Rollback

Before `0064` is applied, rollback = redeploy the previous release (better-auth
still works; mapping columns are additive). After `0064`, rollback requires a
DB restore of the dropped tables — treat `0064` as the point of no return.
