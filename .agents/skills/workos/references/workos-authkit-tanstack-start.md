# WorkOS AuthKit for TanStack Start

## Decision Tree

```
1. Fetch README (BLOCKING)
   ├── Extract package name from install command
   └── README is source of truth for ALL code patterns

2. Detect directory structure
   ├── src/ (TanStack Start v1.132+, default)
   └── app/ (legacy vinxi-based projects)

3. Follow README install/setup exactly
   └── Do not invent commands or patterns
```

## Fetch SDK Documentation (BLOCKING)

**STOP - Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/authkit-tanstack-start/main/README.md`

From README, extract:

1. Package name: `@workos/authkit-tanstack-react-start`
2. Use that exact name for all imports

**README overrides this skill if conflict.**

## Pre-Flight Checklist

- [ ] README fetched and package name extracted
- [ ] `@tanstack/start` or `@tanstack/react-start` in package.json
- [ ] Identify directory structure: `src/` (modern) or `app/` (legacy)
- [ ] Environment variables set (see below)

## Directory Structure Detection

**Modern TanStack Start (v1.132+)** uses `src/`:

```
src/
├── start.ts              # Middleware config (CRITICAL)
├── router.tsx            # Router setup
├── routes/
│   ├── __root.tsx        # Root layout
│   ├── api.auth.callback.tsx  # OAuth callback (flat route)
│   └── ...
```

**Legacy (vinxi-based)** uses `app/`:

```
app/
├── start.ts or router.tsx
├── routes/
│   └── api/auth/callback.tsx  # OAuth callback (nested route)
```

**Detection:**

```bash
ls src/routes 2>/dev/null && echo "Modern (src/)" || echo "Legacy (app/)"
```

## Environment Variables

| Variable                 | Format       | Required |
| ------------------------ | ------------ | -------- |
| `WORKOS_API_KEY`         | `sk_...`     | Yes      |
| `WORKOS_CLIENT_ID`       | `client_...` | Yes      |
| `WORKOS_REDIRECT_URI`    | Full URL     | Yes      |
| `WORKOS_COOKIE_PASSWORD` | 32+ chars    | Yes      |

Generate password if missing: `openssl rand -base64 32`

Default redirect URI: `http://localhost:3000/api/auth/callback`

## Middleware Configuration (CRITICAL)

**authkitMiddleware MUST be configured or auth will fail silently.**

**WARNING: Do NOT add middleware to `createRouter()` in `router.tsx` or `app.tsx`. That is TanStack Router (client-side only). Server middleware belongs in `start.ts` using `requestMiddleware`.**

### If `start.ts` already exists

Read the existing file first. Add `authkitMiddleware` to the existing `requestMiddleware` array (or create the array if missing). Preserve the existing export style. Do not rewrite the file from scratch.

### If `start.ts` does not exist

Create `src/start.ts` (or `app/start.ts` for legacy) using `createStart`:

```typescript
import { createStart } from '@tanstack/react-start';
import { authkitMiddleware } from '@workos/authkit-tanstack-react-start';

export const startInstance = createStart(() => ({
  requestMiddleware: [authkitMiddleware()],
}));
```

**Two things matter here:**

1. **Named export `startInstance`** — the build plugin generates `import type { startInstance }` from this file. A `default` export will cause a build error.
2. **`createStart` takes a function** returning the options object, not the options directly. `createStart({ ... })` will fail.

**WARNING: Do NOT add middleware to `createRouter()` in `router.tsx` or `app.tsx`. That is TanStack Router (client-side only). Server middleware belongs in `start.ts` using `requestMiddleware`.**

## Callback Route (CRITICAL)

Path must match `WORKOS_REDIRECT_URI`. For `/api/auth/callback`:

**Modern (flat routes):** `src/routes/api.auth.callback.tsx`
**Legacy (nested routes):** `app/routes/api/auth/callback.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { handleCallbackRoute } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: handleCallbackRoute(),
    },
  },
});
```

**Key points:**

- Use `handleCallbackRoute()` - do not write custom OAuth logic
- Route path string must match the URI path exactly
- This is a server-only route (no component needed)

## Protected Routes

Use `getAuth()` in route loaders to check authentication:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const { user } = await getAuth();
    if (!user) {
      const signInUrl = await getSignInUrl();
      throw redirect({ href: signInUrl });
    }
    return { user };
  },
  component: Dashboard,
});
```

## Sign Out Route

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { signOut } from '@workos/authkit-tanstack-react-start';

export const Route = createFileRoute('/signout')({
  loader: async () => {
    await signOut();
    throw redirect({ href: '/' });
  },
});
```

## Client-Side Hooks (Optional)

Only needed if you want reactive auth state in components.

**1. Add AuthKitProvider to root:**

```typescript
// src/routes/__root.tsx
import { AuthKitProvider } from '@workos/authkit-tanstack-react-start/client';

function RootComponent() {
  return (
    <AuthKitProvider>
      <Outlet />
    </AuthKitProvider>
  );
}
```

**2. Use hooks in components:**

```typescript
import { useAuth } from '@workos/authkit-tanstack-react-start/client';

function Profile() {
  const { user, isLoading } = useAuth();
  // ...
}
```

**Note:** Server-side `getAuth()` is preferred for most use cases.

## Finalize (REQUIRED before declaring success)

After creating/editing all files, run these steps in order. Skipping them is the most common cause of build failures.

### 1. Regenerate the route tree

Adding new route files (callback, signout, etc.) makes the existing `routeTree.gen.ts` stale. The build will fail with type errors about missing routes until it is regenerated.

```bash
pnpm build 2>/dev/null || npx tsr generate
```

The build itself triggers route tree regeneration. If it fails for other reasons, use `tsr generate` directly.

### 2. Ensure Vite type declarations exist

TanStack Start projects import CSS with `import styles from './styles.css?url'`. Without Vite's type declarations, TypeScript will error on these imports. Check if `src/vite-env.d.ts` (or `app/vite-env.d.ts`) exists — if not, create it now (before attempting the build):

```typescript
/// <reference types="vite/client" />
```

### 3. Verify the build

```bash
pnpm build
```

Do not skip this step. If the build fails, fix the errors before finishing. Common causes:

- Stale route tree → re-run step 1
- Missing Vite types → re-run step 2
- Wrong import paths → check package name is `@workos/authkit-tanstack-react-start`

## Verification Checklist (ALL MUST PASS)

Run these commands to confirm integration. **Do not mark complete until all pass:**

```bash
# 1. Check authkitMiddleware is configured
grep -r "authkitMiddleware" src/ app/ 2>/dev/null || echo "FAIL: Middleware not configured"

# 2. Check callback route exists
find src/routes app/routes -name "*callback*" 2>/dev/null

# 3. Check environment variables
grep -c "WORKOS_" .env 2>/dev/null || echo "FAIL: No env vars found"

# 4. Build succeeds
pnpm build
```

**If check #1 fails:** authkitMiddleware must be in src/start.ts (or app/start.ts for legacy) requestMiddleware array. Auth will fail silently without it.

## Error Recovery

### "AuthKit middleware is not configured"

**Cause:** `authkitMiddleware()` not in start.ts
**Fix:** Create/update `src/start.ts` with middleware config
**Verify:** `grep -r "authkitMiddleware" src/`

### "Module not found" for SDK

**Cause:** Wrong package name or not installed
**Fix:** `pnpm add @workos/authkit-tanstack-react-start`
**Verify:** `ls node_modules/@workos/authkit-tanstack-react-start`

### Callback 404

**Cause:** Route file path doesn't match WORKOS_REDIRECT_URI
**Fix:**

- URI `/api/auth/callback` → file `src/routes/api.auth.callback.tsx` (flat) or `app/routes/api/auth/callback.tsx` (nested)
- Route path string in `createFileRoute()` must match exactly

### getAuth returns undefined user

**Cause:** Middleware not configured or not running
**Fix:** Ensure `authkitMiddleware()` is in start.ts requestMiddleware array

### "Cookie password too short"

**Cause:** WORKOS_COOKIE_PASSWORD < 32 chars
**Fix:** `openssl rand -base64 32`, update .env

### Build fails with route type errors

**Cause:** Route tree not regenerated after adding routes
**Fix:** `pnpm dev` to regenerate `routeTree.gen.ts`

## SDK Exports Reference

**Server (main export):**

- `authkitMiddleware()` - Request middleware
- `handleCallbackRoute()` - OAuth callback handler
- `getAuth()` - Get current session
- `signOut()` - Sign out user
- `getSignInUrl()` / `getSignUpUrl()` - Auth URLs
- `switchToOrganization()` - Change org context

**Client (`/client` subpath):**

- `AuthKitProvider` - Context provider
- `useAuth()` - Auth state hook
- `useAccessToken()` - Token management
