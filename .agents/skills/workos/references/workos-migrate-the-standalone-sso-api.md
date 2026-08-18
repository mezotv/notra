# WorkOS Migration: Standalone SSO API

## Docs

- https://workos.com/docs/migrate/standalone-sso
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- User IDs change when migrating from standalone SSO API to AuthKit. Old Profile IDs (`user_xxx` from `sso.getProfileAndToken`) are NOT the same as new AuthKit User IDs. If Profile IDs are foreign keys in your database, you need a migration script before cutover.
- `authenticateWithCode` requires a `clientId` parameter (`client_xxx`) that the standalone SSO API's `getProfileAndToken` did not require. Missing or wrong `clientId` causes "Invalid client_id" errors.
- AuthKit returns new error types that the standalone SSO API never produced: `email_verification_required`, `mfa_enrollment_required`, and `mfa_challenge_required`. If your callback doesn't handle these, logins will appear to fail silently.
- Using the hosted UI (`provider: "authkit"`) handles email verification and MFA challenges automatically. With the API directly, you must implement those flows yourself.
- Use exactly two terms: "standalone SSO API" for the old system, "AuthKit" for the new system. The docs use these terms consistently. Do NOT use bare "SSO" or "SSO API" — it creates ambiguity.
- WORKOS_COOKIE_PASSWORD applies to ALL server-side AuthKit framework SDKs (Next.js, Remix, React Router, TanStack Start, SvelteKit) — not just Next.js.
