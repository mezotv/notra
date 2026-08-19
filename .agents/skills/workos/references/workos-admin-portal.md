# WorkOS Admin Portal

## Docs

- https://workos.com/docs/admin-portal/index
- https://workos.com/docs/admin-portal/example-apps
- https://workos.com/docs/admin-portal/custom-branding
- https://workos.com/docs/reference/admin-portal
- https://workos.com/docs/reference/admin-portal/portal-link
- https://workos.com/docs/reference/admin-portal/portal-link/generate
- https://workos.com/docs/reference/admin-portal/provider-icons
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Portal links are single-use and time-limited. Visiting an expired or already-used link returns 404. Must generate a new link each time.
- Do NOT email portal links directly from your backend. Links are exposed in email logs. Instead, store the link and have your app's settings page redirect to it.
- The `intent` parameter determines which configuration screens appear. It cannot be changed after link generation — must generate a new link for a different intent.
- Only one active portal link exists per organization at a time. Revoke the old one before generating a new one.
- Domain verification may be required before SSO activation. Some configurations need DNS TXT records or email verification first.
- API key must start with `sk_` (secret key). Using `pk_` (publishable key) returns "Unauthorized."

## Endpoints

| Endpoint                | Description                           |
| ----------------------- | ------------------------------------- |
| `/admin-portal`         | admin-portal                          |
| `/portal-link`          | admin-portal - portal-link            |
| `/portal-link/generate` | admin-portal - portal-link - generate |
| `/provider-icons`       | admin-portal - provider-icons         |
