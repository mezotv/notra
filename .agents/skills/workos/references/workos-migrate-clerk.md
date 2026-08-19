# WorkOS Migration: Clerk

## Docs

- https://workos.com/docs/migrate/clerk
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Clerk exports multiple emails pipe-separated (e.g., `john@example.com|john.doe@example.com`) and does NOT indicate which is the primary email. If you can't call the Clerk API per user to resolve `primary_email_address_id`, you must pick the first email and document the choice.
- Clerk does NOT provide plaintext passwords. Password hashes are only available via the Clerk Backend API export, not the standard dashboard export.
- WorkOS users have a single primary email. You must pick ONE from Clerk's pipe-separated list.
- Clerk export may include deleted/suspended users. Filter these before import or you'll get count mismatches.
- Duplicate emails in the Clerk export will cause WorkOS rejections — deduplicate before importing.
- WorkOS has an official migration tool at https://github.com/workos/migrate-clerk-users that handles rate limits and retries.
