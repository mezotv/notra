# WorkOS Migration: Other Services

## Docs

- https://workos.com/docs/migrate/other-services
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- WorkOS only supports these hash algorithms for password import: bcrypt, scrypt, pbkdf2, argon2, ssha, firebase-scrypt. If your source uses md5, sha1, or a custom algorithm, you cannot import passwords — use the password reset flow instead.
- OAuth tokens CANNOT be imported for security reasons. Social auth users must re-authenticate with their provider. WorkOS links accounts automatically by email match — if emails differ between WorkOS and the social profile, the user sees a "create new account" flow instead of linking.
- WorkOS user IDs (`user_01...`) are new. You MUST persist the mapping from your old system's IDs. Failing to do so breaks all foreign key references.
- Email matching for social account linking is case-sensitive. If the WorkOS user email doesn't exactly match the social profile email, auto-linking fails silently.
- Migration scripts MUST be idempotent. Track migration status per user — re-running a non-idempotent script creates duplicates.
- Bulk password reset emails can be throttled or spam-filtered. Batch at 10 resets/sec max and verify your sending domain in WorkOS Dashboard.
