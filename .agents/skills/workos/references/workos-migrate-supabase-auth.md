# WorkOS Migration: Supabase Auth

## Docs

- https://workos.com/docs/migrate/supabase
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Supabase uses bcrypt. Verify exported hashes start with `$2a$`, `$2b$`, or `$2y$`. If verification fails, re-export — corrupted hashes cannot be recovered.
- Do NOT use Supabase UUIDs as WorkOS user IDs. WorkOS generates its own IDs (`user_*`). Store the mapping (`supabase_user_id` -> `workos_user_id`) in your database.
- You CANNOT migrate active sessions from Supabase to WorkOS. Sessions are provider-specific. Users with valid Supabase sessions must be forced to re-authenticate with WorkOS.
- Supabase `phone` field cannot be migrated — WorkOS AuthKit uses email-based auth.
- If password hash export is corrupted, use explicit SQL cast: `CAST(encrypted_password AS TEXT)` during re-export.
- For >10,000 users, contact WorkOS support for bulk import assistance rather than scripting it yourself.
