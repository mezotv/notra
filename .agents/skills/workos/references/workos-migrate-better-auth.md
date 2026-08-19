# WorkOS Migration: Better Auth

## Docs

- https://workos.com/docs/migrate/better-auth
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Password hashes live in the `account` table (not `user`), filtered by `providerId = 'credential'`. Do NOT skip this table.
- Better Auth uses scrypt by default. If you customized the hash algorithm, you must know which one it is before importing to WorkOS.
- The `password` column contains the full hash string including algorithm parameters. Do NOT strip prefixes or decode it.
- Import order matters when organizations are involved: create orgs first, then import users, then password hashes, then assign memberships. Out-of-order imports will fail with "Organization not found."
- Better Auth sessions are JWT-based and remain valid until expiry even after migration. This is expected — not an error. To force immediate cutover, rotate the Better Auth secret key.
