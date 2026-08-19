# WorkOS Migration: Auth0

## Docs

- https://workos.com/docs/migrate/auth0
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Auth0 does NOT export plaintext passwords. Only bcrypt hashes are available, and only via a support ticket (1-2 week turnaround). Decide upfront whether you need them — requesting after starting the export adds weeks to the timeline.
- `password_hash_type` MUST be `'bcrypt'` for Auth0 exports. Other algorithm values will silently fail.
- Auth0 bcrypt hashes must start with `$2a$`, `$2b$`, or `$2y$`. If the prefix is missing, the export may be incomplete — contact Auth0 support.
- If a user already exists in WorkOS (duplicate email), the Create User API will reject it. Use Update User API instead.
- WorkOS has an official migration tool at https://github.com/workos/migrate-auth0-users that handles rate limiting, retries, and duplicates automatically.
