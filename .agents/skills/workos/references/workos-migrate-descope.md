# WorkOS Migration: Descope

## Docs

- https://workos.com/docs/migrate/descope
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Descope does NOT expose password hashes via API. A support ticket is required to get a CSV export with hashes — this is not self-service.
- When requesting the export from Descope support, confirm which hashing algorithm was used (bcrypt, argon2, or pbkdf2). You need this value for the `password_hash_type` parameter during WorkOS import.
- The algorithm name must match exactly: `"bcrypt"` not `"bcrypt_sha256"` or `"bcrypt-sha256"`. Typos cause silent rejection.
- If Descope used a hashing algorithm not supported by WorkOS, you must fall back to the password reset flow. Contact WorkOS support before attempting import.
