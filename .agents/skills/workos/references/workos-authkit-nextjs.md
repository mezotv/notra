# WorkOS AuthKit for Next.js

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP. Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/authkit-nextjs/main/README.md`

The README is the source of truth. If this skill conflicts with README, follow README.

## Step 2: Pre-Flight Validation

### Project Structure

- Confirm `next.config.js` or `next.config.mjs` exists
- Confirm `package.json` contains `"next"` dependency

### Environment Variables

Check `.env.local` for:

- `WORKOS_API_KEY` - starts with `sk_`
- `WORKOS_CLIENT_ID` - starts with `client_`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` - valid callback URL
- `WORKOS_COOKIE_PASSWORD` - 32+ characters

## Step 3: Install SDK

Detect package manager, install SDK package from README.

**Verify:** SDK package exists in node_modules before continuing.

## Step 4: Locate the app/ directory (BLOCKING)

**STOP. Do this before creating any files.**

Determine where the `app/` directory lives:

```bash
# Check for src/app/ first, then root app/
ls src/app/ 2>/dev/null && echo "APP_DIR=src" || (ls app/ 2>/dev/null && echo "APP_DIR=root")
```

Set `APP_DIR` for all subsequent steps. All middleware/proxy files MUST be created in `APP_DIR`:

- If `APP_DIR=src` → create files in `src/` (e.g., `src/proxy.ts`)
- If `APP_DIR=root` → create files at project root (e.g., `proxy.ts`)

Next.js only discovers middleware/proxy files in the parent directory of `app/`. A file at the wrong level is **silently ignored** — no error, just doesn't run.

## Step 5: Version Detection (Decision Tree)

Read Next.js version from `package.json`:

```
Next.js version?
  |
  +-- 16+ --> Create {APP_DIR}/proxy.ts
  |
  +-- 15   --> Create {APP_DIR}/middleware.ts (cookies() is async)
  |
  +-- 13-14 --> Create {APP_DIR}/middleware.ts (cookies() is sync)
```

**Next.js 16+ proxy.ts:** `proxy.ts` is the preferred convention. `middleware.ts` still works but shows a deprecation warning. Next.js 16 throws **error E900** if both files exist at the same level.

**Next.js 15+ async note:** All route handlers and middleware accessing cookies must be async and properly await cookie operations. This is a breaking change from Next.js 14.

Middleware/proxy code: See README for `authkitMiddleware()` export pattern.

### Existing Middleware (IMPORTANT)

If `middleware.ts` already exists with custom logic (rate limiting, logging, headers, etc.), use the **`authkit()` composable function** instead of `authkitMiddleware`.

**Pattern for composing with existing middleware:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authkit, handleAuthkitHeaders } from '@workos-inc/authkit-nextjs';

export default async function middleware(request: NextRequest) {
  // 1. Get auth session and headers from AuthKit
  const { session, headers, authorizationUrl } = await authkit(request);
  const { pathname } = request.nextUrl;

  // 2. === YOUR EXISTING MIDDLEWARE LOGIC ===
  // Rate limiting, logging, custom headers, etc.
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // 3. Protect routes - redirect to auth if needed
  if (pathname.startsWith('/dashboard') && !session.user && authorizationUrl) {
    return handleAuthkitHeaders(request, headers, { redirect: authorizationUrl });
  }

  // 4. Continue with AuthKit headers properly handled
  return handleAuthkitHeaders(request, headers);
}
```

**Key functions:**

- `authkit(request)` - Returns `{ session, headers, authorizationUrl }` for composition
- `handleAuthkitHeaders(request, headers, options?)` - Ensures AuthKit headers pass through correctly
- For rewrites, use `partitionAuthkitHeaders()` and `applyResponseHeaders()` (see README)

**Critical:** Always return via `handleAuthkitHeaders()` to ensure `withAuth()` works in pages.

## Step 6: Create Callback Route

Parse `NEXT_PUBLIC_WORKOS_REDIRECT_URI` to determine route path:

```
URI path          --> Route location (use APP_DIR from Step 4)
/auth/callback    --> {APP_DIR}/app/auth/callback/route.ts
/callback         --> {APP_DIR}/app/callback/route.ts
```

Use `handleAuth()` from SDK. Do not write custom OAuth logic.

**CRITICAL for Next.js 15+:** The route handler MUST be async and properly await handleAuth():

```typescript
// CORRECT - Next.js 15+ requires async route handlers
export const GET = handleAuth();

// If handleAuth returns a function, ensure it's awaited in request context
```

Check README for exact usage. If build fails with "cookies outside request scope", the handler is likely missing async/await.

## Step 7: Provider Setup (REQUIRED)

**CRITICAL:** You MUST wrap the app in `AuthKitProvider` in `app/layout.tsx`.

This is required for:

- Client-side auth state via `useAuth()` hook
- Consistent auth UX across client/server boundaries
- Proper migration from Auth0 (which uses client-side auth)

```tsx
// app/layout.tsx
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>{children}</AuthKitProvider>
      </body>
    </html>
  );
}
```

**Do NOT skip this step** even if using server-side auth patterns elsewhere.

## Step 8: UI Integration

Use **server helpers only for read-only auth checks** in Server Components. Use **client helpers for interactive auth UI** like shared nav/header buttons.

### Server Components (safe)

Use `withAuth()` / `getUser()` in `app/page.tsx`, `app/dashboard/page.tsx`, layouts, and route handlers to read auth state.

**Do not** call `getSignInUrl()` / `getSignUpUrl()` during Server Component render. Those helpers set PKCE cookies via `cookies()` and will throw in Next.js 15+/16.

### Shared nav/header auth UI (preferred)

If you need a reusable `nav-auth.tsx` / header auth button, make it a **client component** and use `useAuth()` from the same client entrypoint as `AuthKitProvider` (check README for the exact import path for your SDK version).

Use `refreshAuth({ ensureSignedIn: true })` from a click handler to start sign-in instead of computing a sign-in URL during render.

```tsx
'use client';
// Check README for exact import path for your SDK version
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export function NavAuth() {
  const { user, isLoading, refreshAuth } = useAuth();

  if (isLoading) return null;

  if (user) {
    return <a href="/dashboard">Dashboard</a>;
  }

  return (
    <button type="button" onClick={() => void refreshAuth({ ensureSignedIn: true })}>
      Sign in
    </button>
  );
}
```

### If you need a server-generated sign-in URL

Call `getSignInUrl()` **only** inside a Server Action or Route Handler. It is the safe wrapper for AuthKit sign-in/sign-up flows.

### Sign out with a POST server action, never a GET route

Sign-out **mutates state** — it clears the session — so it must never be a `GET` route handler. A `GET /auth/signout` is unsafe: Next.js `<Link>` prefetch can trigger it on hover (logging users out unexpectedly), and it is CSRF-exposable via `<img src="/auth/signout">`. `workos doctor` flags this as `SIGNOUT_GET_HANDLER`.

Use a **POST server action**. In a Server Component, an inline action is fine:

```tsx
<form action={async () => { 'use server'; await signOut(); }}>
  <button type="submit">Sign out</button>
</form>
```

A **client** component (for example a nav that needs `useAuth()`) cannot define an inline `'use server'` action — put it in a separate server-action module and import it:

```tsx
// app/auth/actions.ts
'use server';
import { signOut } from '@workos-inc/authkit-nextjs'; // verify export path in README
export async function signOutAction() {
  await signOut();
}
```

```tsx
'use client';
import { signOutAction } from '@/app/auth/actions';
// ...
<form action={signOutAction}>
  <button type="submit">Sign out</button>
</form>
```

`signOut()` accepts an optional `{ returnTo }`; with none, it redirects to the Logout URI configured in your WorkOS dashboard. If a generated `GET` sign-out route exists, **delete it** rather than switching it to `POST` — that removes the extra logout surface entirely.

### Critical auth URL gotchas

- **Never** call `getSignInUrl()` / `getSignUpUrl()` inside a Server Component render (`page.tsx`, `layout.tsx`, async `nav-auth.tsx`, etc.).
- **Never** use raw `getAuthorizationUrl()` for AuthKit UI flows. It returns an object like `{ url, sealedState }`, **not** a URL string.
- If you bypass `getSignInUrl()`, the PKCE cookie is never set (`sealedState` is discarded), which causes `OAuth state mismatch` on the callback.
- If you pass the raw `getAuthorizationUrl()` result to `window.location.href`, the browser will navigate to `/[object Object]`.
- For server-side redirects, use `getSignInUrl()` in a Server Action / Route Handler. For client-side nav buttons, use `refreshAuth({ ensureSignedIn: true })`.

**Note:** The SDK renamed `getUser` to `withAuth` in newer versions. Use whichever function the installed SDK version exports — do NOT rename existing working imports.

## Verification Checklist (ALL MUST PASS)

Run these commands to confirm integration. **Do not mark complete until all pass:**

```bash
# 1. Check middleware/proxy exists (one should match)
ls proxy.ts middleware.ts src/proxy.ts src/middleware.ts 2>/dev/null

# 2. CRITICAL: Check AuthKitProvider is in layout (REQUIRED)
grep "AuthKitProvider" app/layout.tsx || echo "FAIL: AuthKitProvider missing from layout"

# 3. Check callback route exists
find app -name "route.ts" -path "*/callback/*"

# 4. Audit for raw getAuthorizationUrl usage — always unsafe in app sign-in/sign-up flows
rg -n "getAuthorizationUrl|window\.location\.href\s*=\s*auth\.signInUrl" app src/app src 2>/dev/null || true

# 5. Audit getSignInUrl() usage — safe in Server Actions/Route Handlers, unsafe in page/layout/component render
rg -n "getSignInUrl\(" app src/app 2>/dev/null || true

# 6. CRITICAL: Audit for an unsafe GET sign-out route — sign-out mutates state, so it must be a POST server action, never a GET handler
rg -n -g '**/{signout,sign-out,logout}/route.*' "export (async )?function GET|export const GET" app src/app 2>/dev/null && echo "FAIL: sign-out is a GET route — convert to a POST server action and delete the GET route (see 'Sign out with a POST server action, never a GET route')" || echo "OK: no GET sign-out route"

# 7. Build succeeds
npm run build
```

**If check #2 fails:** Go back to Step 6 and add AuthKitProvider. This is not optional.

**Manual verification before marking complete:**

1. Click **Sign in** and confirm the browser goes to a real WorkOS URL — **not** `/[object Object]`
2. Complete auth and confirm callback succeeds without `OAuth state mismatch`
3. If `rg` finds `getSignInUrl(` in `page.tsx`, `layout.tsx`, or async server-rendered nav components, move that logic to a client component, Server Action, or Route Handler
4. If `rg` finds `getAuthorizationUrl` in sign-in/sign-up code paths, replace it with `getSignInUrl()` / `getSignUpUrl()`

## Error Recovery

### "cookies was called outside a request scope" (Next.js 15+)

**Most common cause:** Route handler not properly async or missing await.

Fix for callback route:

1. Check that `handleAuth()` is exported directly: `export const GET = handleAuth();`
2. If using custom wrapper, ensure it's `async` and awaits any cookie operations
3. Verify authkit-nextjs SDK version supports Next.js 15+ (check README for compatibility)
4. **Never** call `cookies()` at module level - only inside request handlers

This error causes OAuth codes to expire ("invalid_grant"), so fix the handler first.

### "Cookies can only be modified in a Server Action or Route Handler"

**Cause:** `getSignInUrl()` or `getSignUpUrl()` called directly in a Server Component. These functions set a PKCE cookie internally and must run in a Server Action or Route Handler.

**Fix:**

1. Move the `getSignInUrl()` call to a Server Action
2. Or create a Route Handler that redirects to the sign-in URL
3. Or convert the shared auth UI to a client component and call `refreshAuth({ ensureSignedIn: true })`
4. Do NOT call `getSignInUrl()` at the top level of a page component

### `GET /[object%20Object]` or `window.location.href = "[object Object]"`

**Cause:** Code used raw `getAuthorizationUrl()` output as `signInUrl`. That helper returns `{ url, sealedState }`, not a string.

**Fix:**

1. Replace raw `getAuthorizationUrl()` usage with `getSignInUrl()` (or `getSignUpUrl()`)
2. If you must inspect the lower-level helper, extract `.url` and preserve `sealedState` — but prefer the AuthKit wrapper
3. Verify the provider/browser redirect receives a real string URL before assigning `window.location.href`

### "OAuth state mismatch"

**Cause:** The code bypassed `getSignInUrl()` and discarded `sealedState`, so the PKCE state cookie was never set.

**Fix:**

1. Use `getSignInUrl()` in a Server Action or Route Handler so AuthKit sets the PKCE cookie
2. For client-side sign-in buttons, use `refreshAuth({ ensureSignedIn: true })`
3. Do not hand-roll the sign-in action with raw `getAuthorizationUrl()` unless you also persist `sealedState` exactly as the SDK expects

### `SIGNOUT_GET_HANDLER` (flagged by `workos doctor`)

**Cause:** The sign-out route is a `GET` handler (e.g. `export async function GET() { return signOut(); }`), often paired with a `<form method="GET">`. A `GET` with a side effect is unsafe — Next.js prefetch and CSRF (`<img src="/auth/signout">`) can trigger logout.

**Fix:**

1. Move sign-out to a POST server action (see "Sign out with a POST server action, never a GET route" above).
2. Delete the `GET` sign-out route entirely.
3. Ensure the sign-out `<form>` uses a server-action `action={...}` (or `method="POST"`), not `method="GET"`.
4. Re-run `workos doctor` to confirm the finding clears.

### "middleware.ts not found"

- Check: File at project root or `src/`, not inside `app/`
- Check: Filename matches Next.js version (proxy.ts for 16+, middleware.ts for 13-15)

### "Both middleware file and proxy file are detected" (Next.js 16+)

- Next.js 16 throws error E900 if both `middleware.ts` and `proxy.ts` exist
- Delete `middleware.ts` and use only `proxy.ts`
- If `middleware.ts` has custom logic, migrate it into `proxy.ts`

### "withAuth route not covered by middleware" but middleware/proxy file exists

- **Most common cause:** File is at the wrong level. Next.js only discovers middleware/proxy files in the parent directory of `app/`. For `src/app/` projects, the file must be in `src/`, not at the project root.
- Check: Is `app/` at `src/app/`? Then middleware/proxy must be at `src/middleware.ts` or `src/proxy.ts`
- Check: Matcher config must include the route path being accessed

### "Cannot use getUser in client component"

- Check: Component has no `'use client'` directive, or
- Check: Move auth logic to server component/API route

### "Module not found" for SDK import

- Check: SDK installed before writing imports
- Check: SDK package directory exists in node_modules

### "withAuth route not covered by middleware"

- Check: Middleware/proxy file exists at correct location
- Check: Matcher config includes the route path

### Build fails after AuthKitProvider

- Check: Import path matches what README specifies (root export vs `/components` subpath)
- Check: No client/server boundary violations

### NEXT*PUBLIC* prefix issues

- Client components need `NEXT_PUBLIC_*` prefix
- Server components use plain env var names
