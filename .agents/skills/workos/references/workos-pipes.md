# WorkOS Pipes

## Docs

- https://workos.com/docs/pipes
- https://workos.com/docs/pipes/providers
- https://workos.com/docs/reference/pipes
- https://workos.com/docs/reference/pipes/provider
- https://workos.com/docs/reference/pipes/connected-account
- https://workos.com/docs/reference/pipes/access-token
- https://workos.com/docs/widgets/pipes
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Pipes manages the full OAuth lifecycle (authorization, token refresh, credential storage) — do NOT implement your own token refresh logic.
- Use `workos.pipes.getAccessToken()` to get tokens — WorkOS auto-refreshes expired tokens. Never cache access tokens client-side.
- Sandbox environments use "shared credentials" (WorkOS-managed OAuth apps). Production requires custom credentials configured per provider in the Dashboard.
- Response is a discriminated union. **Node SDK** (camelCase): `{ active: true, accessToken }` on success or `{ active: false, error: "needs_reauthorization" | "not_installed" }` on failure. **Raw REST** uses snake_case (`access_token`). Branch on `active` first — `accessToken`/`error` only exist on their respective branches.
- Provider slugs are lowercase (e.g., `github`, `slack`, `salesforce`). Claude tends to capitalize or use display names.
- Connected account deletion removes stored tokens — the user must re-authorize. This is not reversible.
- The Pipes Widget provides a pre-built UI for account connection — use it instead of building custom OAuth flows. Load via `workos-widgets` skill.
- `getAccessToken()` requires `provider` and `userId` params. `organizationId` is optional but needed for org-scoped connections.
- The authorize endpoint (`/data-integrations/{slug}/authorize`) returns a URL — redirect the user to it, do NOT fetch it server-side.

## Endpoints

| Endpoint                    | Description                  |
| --------------------------- | ---------------------------- |
| `/pipes`                    | Pipes overview               |
| `/provider`                 | Provider details             |
| `/connected-account`        | Connected account management |
| `/connected-account/get`    | Get a connected account      |
| `/connected-account/delete` | Delete a connected account   |
| `/access-token`             | Get OAuth access token       |
| `/authorize`                | Generate authorization URL   |
