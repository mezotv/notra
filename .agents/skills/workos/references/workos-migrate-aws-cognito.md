# WorkOS Migration: AWS Cognito

## Docs

- https://workos.com/docs/migrate/aws-cognito
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- AWS Cognito does not export password hashes or MFA keys (Cognito platform limitation). WorkOS supports hash import for other providers (bcrypt, scrypt, argon2, pbkdf2, ssha, firebase-scrypt), but since Cognito won't export them, all migrated users must reset their password.
- There is NO JIT (just-in-time) migration path for Cognito. Cognito does not expose a password verification endpoint. The only path is bulk import of user attributes + forced password reset.
- OAuth users do NOT need password resets — their provider tokens continue working after migration.
- WORKOS_COOKIE_PASSWORD applies to ALL server-side AuthKit framework SDKs (Next.js, Remix, React Router, TanStack Start, SvelteKit) — not just Next.js.
- Bulk password reset emails can be flagged as spam. Slow send rate to 1 req/second max and verify SPF/DKIM records if using a custom email domain.
- Do NOT set the password field when importing users. Users imported without passwords are automatically flagged for password reset.
