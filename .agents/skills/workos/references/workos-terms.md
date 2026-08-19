# WorkOS Terminology → Canonical Docs URLs

If this file conflicts with fetched docs, follow the docs. URLs here are canonical at time of writing; if a user reports a broken link, WebFetch to confirm and update the row.

## How to Use

User asked about a WorkOS term, dashboard field, environment variable, or configuration concept? Look it up here first. The table gives you:

- **Term** — exact name as it appears in the WorkOS Dashboard, SDK, or docs
- **What it is** — one-line definition (enough to answer simple "what is X" questions without a fetch)
- **Canonical URL** — WebFetch this if the user wants the full reference
- **See also** — deeper reference file to Read when the task goes beyond terminology

## Terms

| Term                     | What it is                                                                                                                                                                                                                                 | Canonical URL                                                                               | See also                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------ |
| Redirect URI             | URL WorkOS redirects to after successful authentication; configured in Dashboard → Redirects. The `redirect_uri` request parameter must match one of the configured values EXACTLY (including trailing slash).                             | https://workos.com/docs/reference/authkit/authentication/get-authorization-url/redirect-uri | `workos-authkit-base.md` |
| Sign-in endpoint         | URL on YOUR app that AuthKit redirects to when a sign-in request did not originate from your app (e.g., bookmark of hosted sign-in, password-reset email). Configured in Dashboard → Redirects.                                            | https://workos.com/docs/authkit/vanilla/nodejs#configure-sign-in-endpoint                   | `workos-authkit-base.md` |
| `initiate_login_uri`     | OIDC client metadata parameter an IdP reads to begin IdP-initiated login at the RP. For WorkOS configuration purposes this maps to the **Sign-in endpoint** in Dashboard → Redirects; no distinct WorkOS docs page exists under this name. | https://workos.com/docs/authkit/vanilla/nodejs#configure-sign-in-endpoint                   | `workos-authkit-base.md` |
| Sign-out redirect        | URL users are redirected to after logging out of AuthKit. Configured in Dashboard → Redirects and/or passed as the `return_to` query parameter on the logout URL.                                                                          | https://workos.com/docs/reference/authkit/logout/get-logout-url                             | `workos-authkit-base.md` |
| Organization ID          | Identifier for a group of users (typically a tenant/customer org). Preferred parameter when initiating SAML/OIDC flows — pass this instead of Connection ID so the org can pick its active connection.                                     | https://workos.com/docs/sso/overview                                                        | `workos-sso.md`          |
| Connection ID            | Identifier for a specific SSO connection (auth method) belonging to an Organization. Use when you need to authenticate via a particular connection rather than letting the Org decide.                                                     | https://workos.com/docs/sso/overview                                                        | `workos-sso.md`          |
| Admin Portal `intent`    | Query parameter on `generateLink` that selects which Admin Portal flow to open. Valid values: `sso`, `dsync`, `audit_logs`, `log_streams`, `domain_verification`, `certificate_renewal`, `bring_your_own_key`.                             | https://workos.com/docs/reference/admin-portal/portal-link/generate                         | `workos-admin-portal.md` |
| JWKS endpoint            | Public key set endpoint used to verify signatures on AuthKit-issued session access tokens.                                                                                                                                                 | https://workos.com/docs/reference/authkit/session-tokens/jwks                               | `workos-api-authkit.md`  |
| Sealed session           | AuthKit session data encrypted and stored in a cookie. "Sealing" = encrypting with the cookie password at sign-in; "unsealing" = decrypting via `loadSealedSession()` / `authenticateWithSessionCookie()` on each request.                 | https://workos.com/docs/reference/authkit/session-helpers/load-sealed-session               | `workos-node.md`         |
| `WORKOS_COOKIE_PASSWORD` | 32+ character password used to seal/unseal the AuthKit session cookie. Must be identical across all instances of your app. Generate with `openssl rand -base64 32`.                                                                        | https://workos.com/docs/authkit/vanilla/nodejs                                              | `workos-authkit-base.md` |

## Still not here?

1. Check the "See also" column for the closest feature reference and Read it — the term may be covered in context there.
2. If still unclear, WebFetch https://workos.com/docs/llms.txt and search for the term.
3. If you find a canonical URL for a term that wasn't in this table, answer the user, then **suggest they open a PR** adding a row to this file. (This file is human-maintained; you can't reliably persist edits from a user session.)

## Verification

URLs drift when WorkOS reorganizes docs. Verify a URL by WebFetch only when (a) the user reports a broken link, or (b) you're about to write the URL into a file the user will commit. Routine chat answers don't require verification — that wastes tokens.
