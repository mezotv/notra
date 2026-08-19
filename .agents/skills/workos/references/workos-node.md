# WorkOS AuthKit for Node.js

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP - Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/workos-node/main/README.md`

Also fetch the AuthKit quickstart for reference:
WebFetch: `https://workos.com/docs/authkit/vanilla/nodejs`

README is the source of truth for all SDK patterns. **README overrides this skill if conflict.**

## Step 2: Detect Framework & Project Structure

```
package.json has 'express'?              → Express
package.json has 'fastify'?              → Fastify
package.json has 'hono'?                 → Hono
package.json has 'koa'?                  → Koa
None of the above?                       → Vanilla Node.js http (use Express quickstart pattern)

tsconfig.json exists?                    → TypeScript (.ts files)
"type": "module" in package.json?        → ESM (import/export)
else                                     → CJS (require/module.exports)
```

Detect entry point: `src/index.ts`, `src/app.ts`, `app.js`, `server.js`, `index.js`

Detect package manager: `pnpm-lock.yaml` → `yarn.lock` → `bun.lockb` → npm

**Adapt all subsequent steps to the detected framework and module system.**

## Step 2b: Partial Install Recovery

Before creating new files, check if a previous AuthKit attempt exists:

1. Check if `@workos-inc/node` is already in `package.json`
2. Check for incomplete auth files — routes/handlers that import `@workos-inc/node` but are non-functional (TODO comments, 501 responses, empty handlers)
3. If partial install detected:
   - Do NOT reinstall the SDK (it's already there)
   - Read existing auth files to understand what's done vs missing
   - Complete the integration by filling gaps rather than starting fresh
   - Preserve any working code — only fix what's broken
   - Check for a missing `/callback` route (most common gap)

## Step 2c: Existing Auth System Detection

Check for existing authentication before integrating:

```
package.json has 'passport'?                → Passport.js auth
package.json has 'express-openid-connect'?  → Auth0 / OIDC
package.json has 'express-session'?         → Session-based auth may exist
*.js/*.ts files have 'jsonwebtoken'?        → JWT-based auth
```

If existing auth detected:

- Do NOT remove or disable it
- Add WorkOS AuthKit alongside the existing system
- If `express-session` is already configured, reuse it for WorkOS session storage (don't create a second session middleware)
- Create separate route paths for WorkOS auth (e.g., `/auth/workos/login` if `/login` is taken)
- Ensure existing auth routes continue to work unchanged
- Document in code comments how to migrate fully to WorkOS later

## Step 3: Install SDK

```
pnpm-lock.yaml → pnpm add @workos-inc/node dotenv cookie-parser
yarn.lock      → yarn add @workos-inc/node dotenv cookie-parser
bun.lockb      → bun add @workos-inc/node dotenv cookie-parser
else           → npm install @workos-inc/node dotenv cookie-parser
```

For TypeScript, also install types: `pnpm add -D @types/cookie-parser`

**Verify:** `@workos-inc/node` in package.json dependencies

## Step 4: Initialize WorkOS Client

Adapt to detected module system (ESM vs CJS):

**ESM/TypeScript:**

```typescript
import { WorkOS } from '@workos-inc/node';
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});
```

**CJS:**

```javascript
const { WorkOS } = require('@workos-inc/node');
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});
```

## Step 5: Integrate Authentication

### If Express

Follow the quickstart pattern:

1. **`/login` route** — call `workos.userManagement.getAuthorizationUrl({ provider: 'authkit', redirectUri: ..., clientId: ... })`, redirect
2. **`/callback` route** — call `workos.userManagement.authenticateWithCode({ code, clientId })`, store session via sealed session or express-session
3. **`/logout` route** — clear session cookie, redirect
4. **Cookie middleware** — `app.use(cookieParser())`
5. **Session-aware home route** — read session, display user info

**Session handling options (pick one):**

- **Sealed sessions** (recommended, from quickstart): use `sealSession: true` in authenticateWithCode, store sealed cookie, use `loadSealedSession` for verification
- **express-session**: install `express-session`, configure middleware before routes, store user in `req.session`

### If Fastify

1. Register `@fastify/cookie` plugin
2. Create `/login`, `/callback`, `/logout` routes using Fastify route syntax
3. Use `reply.redirect()` for redirects
4. Store session in signed cookie

### If Hono

1. Create `/login`, `/callback`, `/logout` routes using Hono router
2. Use `c.redirect()` for redirects
3. Use Hono's cookie helpers for session

### If Koa

1. Install `koa-router` if not present
2. Create auth routes on router
3. Use `ctx.redirect()` for redirects
4. Use `koa-session` for session management

### If Vanilla Node.js (no framework detected)

Install Express and follow the Express pattern above. This matches the official quickstart.

## Step 6: Environment Setup

Create `.env` if it doesn't exist. Do NOT overwrite existing values:

```
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:3000/callback
WORKOS_COOKIE_PASSWORD=<generate with openssl rand -base64 32>
```

Ensure `.env` is in `.gitignore`.

## Step 7: Verification

**TypeScript:** `npx tsc --noEmit`
**JavaScript:** `node --check <entry-file>`

### Checklist

- [ ] SDK installed (`@workos-inc/node` in package.json)
- [ ] WorkOS client initialized
- [ ] Login route redirects to AuthKit
- [ ] Callback route exchanges code for user
- [ ] Logout route clears session
- [ ] `.env` has required variables
- [ ] Build/syntax check passes

## Error Recovery

### Module not found: @workos-inc/node

Re-run install for detected package manager.

### Session not persisting

If using express-session: ensure middleware registered BEFORE routes.
If using sealed sessions: ensure cookie is being set with correct options (httpOnly, secure in prod, sameSite: 'lax').

### Callback returns 404

Route path must match WORKOS_REDIRECT_URI exactly.

### ESM/CJS mismatch

Check `"type"` field in package.json — `"module"` = ESM (import/export), absent = CJS (require).

### TypeScript errors

Install missing types: `@types/express`, `@types/cookie-parser`, `@types/express-session`.
