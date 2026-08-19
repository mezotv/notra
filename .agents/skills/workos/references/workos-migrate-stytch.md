# WorkOS Migration: Stytch

## Docs

- https://workos.com/docs/migrate/stytch
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Stytch password export requires a support ticket (support@stytch.com). Start this FIRST — it's the bottleneck with variable turnaround time. Do not proceed with password import until hashes are received.
- Stytch uses scrypt for password hashing. Verify the hash format from the Stytch export matches WorkOS requirements before bulk import — test with ONE user first.
- Stytch Search API has a 100 requests/minute rate limit. For large datasets, add delays between batches or you'll get throttled during export.
- Domain conflicts: if a domain is already claimed by another WorkOS organization, the org import fails with "Domain already exists." Import without `domainData` and resolve conflicts manually.
- Organizations must be imported BEFORE users. If the org mapping is lost or orgs aren't created yet, user import fails with "Missing organization ID."
- For consumer (non-B2B) users, use the Stytch export utility at https://github.com/stytchauth/stytch-node-export-users instead of the Search API.
