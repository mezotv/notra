# WorkOS Single Sign-On

## Docs

- https://workos.com/docs/sso/guide
- https://workos.com/docs/sso/login-flows
- https://workos.com/docs/reference/sso/get-authorization-url
- https://workos.com/docs/sso/redirect-uris
- https://workos.com/docs/sso/test-sso
- https://workos.com/docs/sso/launch-checklist
- https://workos.com/docs/rbac/idp-role-assignment
  If this file conflicts with fetched docs, follow the docs.

## Mapping SSO groups to WorkOS roles

Full recipe lives in `workos-rbac.md` under "IdP group → role mapping". SSO-specific caveats:

- **Re-auth required**: SSO group role assignment does **not** propagate in real time. Per docs: "Roles are granted to SSO profiles when the user authenticates." A role change in the IdP only takes effect the next time the user re-authenticates.
- When Directory Sync is also available, prefer Directory Sync. Per docs: "SCIM is generally the preferred option due to its real-time synchronization capabilities."
- Same precedence rule applies: IdP mapping overrides API/Dashboard role assignment ("IdP role assignment will always take precedence over roles assigned via API or the WorkOS Dashboard").
- Not configurable via the WorkOS CLI. If asked, say so explicitly and link to https://workos.com/docs/rbac/idp-role-assignment.

## Canonical SSO flows

Use only the relevant flow when the user asks for implementation help. Do not include email-domain routing or IdP-initiated callback handling unless the user asks for those topics. Keep the exact operation order clear; most bugs come from doing state validation or connection selection in the wrong place.

Standalone SSO SDK methods:

- Node: use `workos.sso.getAuthorizationUrl(...)` and `workos.sso.getProfileAndToken(...)`.
- Ruby: use `WorkOS::SSO.authorization_url(...)` and `WorkOS::SSO.profile_and_token(...)`.
- Do not use AuthKit/User Management methods such as `workos.userManagement.getAuthorizationUrl(...)` or `authenticateWithCode(...)` for standalone SSO prompts.

### SP-initiated SSO

1. Generate a cryptographically random `state` value and store it server-side in the user's session.
2. Generate the authorization URL with exactly one connection selector: `organization`, `connection`, or `provider`.
3. Redirect the user to the IdP using that authorization URL.
4. In the callback, check the `error` query parameter before exchanging the code.
5. Verify the returned `state` against the session value.
6. Exchange `code` for the profile and token with `getProfileAndToken` (Node) or `profile_and_token` (Ruby).
7. Create the app session from the returned profile, then clear the one-time state value.

### IdP-initiated SSO callback

1. Check if the `state` parameter is present on the callback.
2. If `state` has a non-empty value, verify it against the session value.
3. If `state` is `""` (empty string), treat it as IdP-initiated and skip CSRF state verification for that request.
4. Do not skip state verification for every callback; only the empty-string IdP-initiated case gets this exception.
5. Exchange `code` for the profile and token, then create the app session.

### Email-domain routing

1. Collect the user's email address before starting SSO.
2. Extract the domain from the email address.
3. Look up the matching WorkOS organization ID from your app database, tenant config, or the Organizations API.
4. Pass `organization` / `organization_id` to the authorization URL call.
5. Use exactly one connection selector per request. Do not combine `organization` with `connection` or `provider`.

## Gotchas

- Use exactly ONE connection selector (connection, organization, or provider) in getAuthorizationUrl — never combine them, causes error
- domain_hint and login_hint are UX params, NOT connection selectors — they pre-fill fields but don't route the request
- IdP-initiated flow sends state="" (empty string, not missing) — skip CSRF verification for empty string, reject for null/missing
- Auth codes expire in 10 min and are single-use — exchange immediately in callback, never store or retry
- signin_consent_denied means user clicked Cancel at IdP — check req.query.error BEFORE attempting code exchange
- Email domain does NOT auto-resolve to organization — YOUR app must map email domain → org_id via your DB or the Organizations API
- Redirect URI must match EXACTLY including trailing slash — mismatch causes invalid_grant
- Use getProfileAndToken (not getProfile) to exchange code — returns both profile and access token

## Endpoints

| Endpoint                              | Description                       |
| ------------------------------------- | --------------------------------- |
| `/sso`                                | SSO overview                      |
| `/connection`                         | SSO connection management         |
| `/connection/delete`                  | Delete a connection               |
| `/connection/get`                     | Get a connection                  |
| `/connection/list`                    | List connections                  |
| `/get-authorization-url`              | Generate authorization URL        |
| `/get-authorization-url/error-codes`  | Authorization error codes         |
| `/get-authorization-url/redirect-uri` | Redirect URI configuration        |
| `/logout`                             | SSO logout                        |
| `/logout/authorize`                   | Authorize logout                  |
| `/logout/redirect`                    | Logout redirect                   |
| `/profile`                            | User profile                      |
| `/profile/get-profile-and-token`      | Exchange code for profile + token |
| `/profile/get-user-profile`           | Get user profile by ID            |
