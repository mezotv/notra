# WorkOS Custom Domains

## Docs

- https://workos.com/docs/custom-domains/index
- https://workos.com/docs/custom-domains/email
- https://workos.com/docs/custom-domains/authkit
- https://workos.com/docs/custom-domains/auth-api
- https://workos.com/docs/custom-domains/admin-portal
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Custom domains are production-environment only. Staging environments always use `workos.dev` and cannot be customized.
- AuthKit custom domains require updating ALL callback URLs in production code, environment variables (`WORKOS_REDIRECT_URI`), and OAuth app registration in the WorkOS Dashboard. Missing any one causes "Invalid redirect_uri" errors.
- DNS verification can take 24-48 hours. Do not proceed with code changes until Dashboard shows "Verified" status.
- SSL is auto-provisioned after DNS verification but is a separate status. Dashboard must show both "Verified" and "SSL Active" before the domain is usable.
- Email and Admin Portal custom domains require no code changes — WorkOS handles them backend-only. Only AuthKit domains need code updates.
- When migrating AuthKit to a custom domain, add the new callback URI alongside the old one in Dashboard. Remove the old `workos.com` callback only after confirming the custom domain works.
- Cookie domain must be set to `.yourapp.com` (with leading dot) for subdomain compatibility. Incorrect cookie domain causes silent auth failures where login redirects back to `workos.com`.
- Emails still sent from `workos.dev` usually means the staging environment is selected or the email domain is not yet verified. Check the environment toggle (top-right in Dashboard).
