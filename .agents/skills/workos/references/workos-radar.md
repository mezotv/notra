# WorkOS Radar

## Docs

- https://workos.com/docs/radar
- https://workos.com/docs/radar/overview
- https://workos.com/docs/radar/standalone
- https://workos.com/docs/reference/radar
- https://workos.com/docs/reference/radar/attempts
- https://workos.com/docs/reference/radar/lists
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Radar is built into AuthKit natively — if using AuthKit, fraud detection works automatically. The standalone API is only needed for custom auth flows.
- **There is no `workos.radar.*` namespace in the Node SDK.** The Radar standalone API has no SDK wrapper methods at all — for attempts, lists, or anything else. Use `workos.post('/radar/attempts', ...)`, `workos.put('/radar/attempts/:id', ...)`, `workos.post('/radar/lists/{type}/{action}', ...)` directly. Claude hallucinates `workos.radar.assessAttempt`, `workos.radar.updateAttempt`, `workos.userManagement.updateAuthenticationAttempt`, etc. — none exist.
- The standalone API is in preview — access requires contacting WorkOS support.
- `POST /radar/attempts` returns a `verdict`: `"allow"`, `"block"`, or `"challenge"`. Your app MUST act on the verdict — Radar does not block requests itself.
- All attempt fields are required: `ip_address`, `user_agent`, `email`, `auth_method`, `action`. Missing fields cause a 422.
- `auth_method` must be one of: `Password`, `Passkey`, `Authenticator`, `SMS_OTP`, `Email_OTP`, `Social`, `SSO`, `Other`. Claude tends to use lowercase or invented values.
- `action` accepts: `login`, `signup` (and variants like `sign-in`, `sign_up`). Use the simplest form.
- After a successful authentication, call `PUT /radar/attempts/:id` with `attempt_status: "success"` to improve Radar's model (enables impossible travel detection).
- Block/allow lists use path-based routing: `POST /radar/lists/{type}/{action}` where type is `ip_address`, `domain`, `email`, `device`, `user_agent`, `device_fingerprint`, or `country`, and action is `block` or `allow`.
- `device_fingerprint` and `bot_score` are optional enrichment fields — pass them if your client-side SDK collects them.
- There are NO SDK wrapper methods for block/allow list management. Use direct HTTP calls (`POST /radar/lists/{type}/{action}`). Claude hallucinates `workos.radar.blockIpAddress()` or `workos.userManagement.createBlocklistEntry()` — neither exists.

## Endpoints

| Endpoint                        | Description                        |
| ------------------------------- | ---------------------------------- |
| `/radar`                        | Radar overview                     |
| `/attempts`                     | Attempt management                 |
| `/attempts/create`              | Create an attempt (get verdict)    |
| `/attempts/update`              | Update attempt status              |
| `/lists`                        | List management                    |
| `/lists/{type}/{action}/add`    | Add entry to block/allow list      |
| `/lists/{type}/{action}/remove` | Remove entry from block/allow list |
