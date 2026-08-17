# WorkOS Migration — Test Plan

Everything runs against the Development WorkOS environment
(`divine-dress-62-development.authkit.app`) and the staging-branch database in
`.env.staging` / dev database in `.env`. Work through top to bottom; each item
lists the action and the expected result.

## 0. Setup

```bash
# terminal 1 — dashboard
cd apps/dashboard && bunx dotenv -e ../../.env -- bun run dev
# terminal 2 — local API (CLI/MCP tests hit this)
cd apps/api && PORT=3005 bunx dotenv -e ../../.env -- bun run dev
# optional: web (3001) and console (3003) the same way
```

- [ ] `curl localhost:3000/api/session` → `null`
- [ ] `curl localhost:3005/.well-known/oauth-protected-resource` → JSON with
      `authorization_servers: ["https://auth.usenotra.com"]`

## 1. Data migration (staging branch DB)

```bash
cd packages/db && bunx dotenv -e ../../.env.staging -- bun run migrate:workos
```

- [ ] Phase headers show `already linked` vs `to migrate` counts; rows show
      `[n/total]` progress
- [ ] Password users log `(password imported)`; backfill phase heals earlier
      passwordless imports
- [ ] Only junk emails end as `user FAILED` (readable reason); summary count at
      the end
- [ ] Re-run immediately → near-instant, everything skipped/`already exists`

## 2. Browser auth (localhost:3000)

- [ ] `/login` → custom page (not hosted). Sign in with a **migrated
      password** user → lands in workspace (proves PHC hash import)
- [ ] Wrong password → inline error, no crash
- [ ] `/signup` with a fresh email → 6-digit code screen → code from email →
      lands in onboarding; welcome email sent; user row created + linked
- [ ] GitHub button → provider page directly (no hosted AuthKit screen) →
      callback → session; `social_connections` row has a GitHub token
- [ ] Google button → same
- [ ] `/forgot-password` → reset email → `/reset-password?token=...` → new
      password works
- [ ] Sign out → toast success (no "failed"), back at `/login`
- [ ] `?returnTo=` on `/login` is honored after auth

## 3. Organizations

- [ ] Onboarding: create workspace → slug prefix `app.usenotra.com/`, skills
      seeded, Autumn customer created (check Autumn), org has `workos_org_id`,
      WorkOS membership role `owner`
- [ ] Org switcher: switch org → cookie updates, correct org data loads
- [ ] Settings → General: rename, change slug → URL updates

## 4. Invitations (WorkOS-managed)

- [ ] Settings → Members → invite `you+invitee@...` as admin → **email arrives
      from WorkOS** with accept link
- [ ] Pending tab lists the invitation (from WorkOS, not local DB)
- [ ] Accept link → auth flow → invitee lands in app; `members` row appears
      (login reconcile) with role `admin`
- [ ] Resend → second email; Revoke → invitation gone, accept link dead
- [ ] Team-member limit: invite beyond plan seats → Autumn limit error

## 5. Members

- [ ] Change a member's role → persists locally and on the WorkOS membership
- [ ] Remove member → gone locally + WorkOS membership deleted
- [ ] Ban check: `UPDATE users SET banned = true WHERE email = '...'` → that
      user's next request has no session (401/redirect); unban restores

## 6. CLI (device grant)

```bash
bunx dotenv -e .env -- bun run "<scratchpad>/test-cli-auth.ts"
```

- [ ] Prints XXXX-XXXX code + approval URL; approving in the browser is
      one click when already signed in
- [ ] Token claims include `org_id` and `permissions` (the 14 scopes from the
      role); response includes `refresh_token`
- [ ] `/v1/posts` and `/v1/skills` against localhost:3005 → 200 with real data
- [ ] Also review usenotra/notra-cli#8 (the real CLI implementation)

## 7. MCP client (DCR + PKCE)

```bash
bunx dotenv -e .env -- bun run "<scratchpad>/test-mcp-client.ts"
```

- [ ] Discovery via localhost:3000 `.well-known` proxy returns AuthKit metadata
- [ ] DCR registration returns a `client_id`
- [ ] Authorize link → consent screen lists the requested scopes → loopback
      callback fires
- [ ] Token exchange succeeds; API calls with the third-party token behave
      per scopes
- [ ] Also review usenotra/notra-mcp#21 (the real server implementation)

## 8. API keys (unchanged path)

- [ ] Existing `ntra_` Unkey key against localhost:3005 → still works

## 9. Landing page (localhost:3001)

- [ ] Signed out → "Sign In / Sign Up" in navbar
- [ ] Signed in (dashboard session on 3000) → "Dashboard" instead

## 10. Console (localhost:3003)

- [ ] `/login` → AuthKit → admin user gets in; non-admin (`users.role` null)
      blocked from admin areas
- [ ] Impersonation banner appears for impersonated sessions (start from the
      WorkOS dashboard); "stop impersonating" signs out cleanly

## 11. Webhooks (needs a tunnel — optional locally)

```bash
# e.g. ngrok http 3000, then register the tunnel URL + /api/webhooks/workos
# in the WorkOS dashboard with a signing secret → WORKOS_WEBHOOK_SECRET in .env
```

- [ ] `organization_membership.deleted` (remove member in WorkOS dashboard) →
      local `members` row disappears without a re-login
- [ ] Without the tunnel: covered by the login-time reconcile instead

## Known-good shortcuts

- Everything already verified in-session: device grant end-to-end, DCR
  registration, invitation send/list/revoke with roles, PHC password
  round-trip, org/user/membership migration idempotency.
- If something 401s unexpectedly: check the token claims first
  (`org_id` present? `permissions` present?), then the local mapping columns
  (`workos_user_id` / `workos_org_id` set?).
