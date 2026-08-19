# Fetching APIs

## Objective

Implement Widgets API calls using the endpoint tables and query script below, matching the host application's data layer.

## Source of Truth

Use the endpoint tables below for paths and methods. For request/response schemas, run:

```bash
node references/scripts/query-spec.cjs --widget <widget-name>
```

## Guidance

- Build direct fetch/http client functions from the OpenAPI endpoints.
- Keep request and mutation handling consistent with existing code style.
- If React Query or SWR already exists, use it for query/mutation orchestration on top of the direct endpoint functions.
- Prefer one consistent data pattern per widget flow unless the project already mixes patterns.
- Reuse existing error/loading conventions from the host project.

## Base URL

Use `process.env.WORKOS_BASE_API_URL` (or the equivalent env access for the stack) as the base URL for all widget API calls. Fall back to `https://api.workos.com` when the env variable is not set.

## Authorization Layer

- Add a small shared request layer that injects authorization consistently for all widget calls.
- Send the widget bearer token in the app's standard authenticated request path.
- Keep authorization wiring close to existing auth/session utilities instead of duplicating token logic across components.
- Handle `401`/`403` responses explicitly and surface clear recovery actions.

## Error Responses

All error responses (`400`, `403`, `404`, `422`) return a JSON object with a single `message` string field:

```json
{ "message": "Description of the error" }
```

For full request/response schemas, run `node references/scripts/query-spec.cjs --widget <widget-name>`.

## Elevated Access Endpoints

- Check the endpoint's description (via `node references/scripts/query-spec.cjs --widget <widget-name>`) **before calling it** — not on failure. If it mentions elevated access, acquire the elevated token first.
- Use `POST /_widgets/UserProfile/verify` to obtain an elevated token, then pass it in header `x-elevated-access-token`.
- Treat elevated tokens as short-lived (10 minutes) and scope them to sensitive operations only.

## Endpoint Reference

All available endpoints, grouped by widget. For request/response schemas, run `node references/scripts/query-spec.cjs --widget <widget-name>`.

### User Management

| Method   | Path                                               |
| -------- | -------------------------------------------------- |
| `GET`    | `/_widgets/UserManagement/members`                 |
| `POST`   | `/_widgets/UserManagement/members/{userId}`        |
| `DELETE` | `/_widgets/UserManagement/members/{userId}`        |
| `GET`    | `/_widgets/UserManagement/roles`                   |
| `GET`    | `/_widgets/UserManagement/roles-and-config`        |
| `GET`    | `/_widgets/UserManagement/organizations`           |
| `POST`   | `/_widgets/UserManagement/invite-user`             |
| `POST`   | `/_widgets/UserManagement/invites/{userId}/resend` |
| `DELETE` | `/_widgets/UserManagement/invites/{userId}`        |

### User Profile

| Method   | Path                                                     |
| -------- | -------------------------------------------------------- |
| `GET`    | `/_widgets/UserProfile/me`                               |
| `POST`   | `/_widgets/UserProfile/me`                               |
| `GET`    | `/_widgets/UserProfile/authentication-information`       |
| `POST`   | `/_widgets/UserProfile/send-verification`                |
| `POST`   | `/_widgets/UserProfile/verify`                           |
| `POST`   | `/_widgets/UserProfile/update-password`                  |
| `POST`   | `/_widgets/UserProfile/create-password` ⚠️ elevated      |
| `POST`   | `/_widgets/UserProfile/create-totp-factor` ⚠️ elevated   |
| `POST`   | `/_widgets/UserProfile/verify-totp-factor` ⚠️ elevated   |
| `DELETE` | `/_widgets/UserProfile/totp-factors` ⚠️ elevated         |
| `POST`   | `/_widgets/UserProfile/passkeys` ⚠️ elevated             |
| `POST`   | `/_widgets/UserProfile/passkeys/verify` ⚠️ elevated      |
| `DELETE` | `/_widgets/UserProfile/passkeys/{passkeyId}` ⚠️ elevated |
| `GET`    | `/_widgets/UserProfile/sessions`                         |
| `DELETE` | `/_widgets/UserProfile/sessions/revoke/{sessionId}`      |
| `DELETE` | `/_widgets/UserProfile/sessions/revoke-all`              |

### Admin Portal — SSO Connection

| Method | Path                                     |
| ------ | ---------------------------------------- |
| `GET`  | `/_widgets/admin-portal/sso-connections` |
| `POST` | `/_widgets/admin-portal/generate-link`   |

### Admin Portal — Domain Verification

| Method   | Path                                                              |
| -------- | ----------------------------------------------------------------- |
| `GET`    | `/_widgets/admin-portal/organization-domains`                     |
| `DELETE` | `/_widgets/admin-portal/organization-domains/{domainId}`          |
| `POST`   | `/_widgets/admin-portal/organization-domains/{domainId}/reverify` |
| `POST`   | `/_widgets/admin-portal/generate-link`                            |

### Other

| Method   | Path                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| `GET`    | `/_widgets/settings`                                                          |
| `POST`   | `/_widgets/ApiKeys/organization-api-keys`                                     |
| `GET`    | `/_widgets/ApiKeys/organization-api-keys`                                     |
| `GET`    | `/_widgets/ApiKeys/permissions`                                               |
| `DELETE` | `/_widgets/ApiKeys/{apiKeyId}`                                                |
| `GET`    | `/_widgets/DataIntegrations/mine`                                             |
| `GET`    | `/_widgets/DataIntegrations/{slug}/authorize`                                 |
| `GET`    | `/_widgets/DataIntegrations/{dataIntegrationId}/authorization-status/{state}` |
| `DELETE` | `/_widgets/DataIntegrations/installations/{installationId}`                   |
| `GET`    | `/_widgets/directory-sync/directories`                                        |
| `GET`    | `/_widgets/directory-sync/directories/{directoryId}`                          |

## Pagination

List endpoints use cursor-based pagination. Query parameters:

- `limit` — number of results per page
- `before` — cursor for the previous page
- `after` — cursor for the next page

Responses include a `list_metadata` object with `before` and `after` cursor strings. Pass `after` from the current response as the `after` param of the next request to advance pages.
