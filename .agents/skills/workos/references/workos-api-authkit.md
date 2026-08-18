# WorkOS AuthKit API Reference

## Docs

- https://workos.com/docs/reference/authkit
- https://workos.com/docs/reference/authkit/api-keys
- https://workos.com/docs/reference/authkit/api-keys/create-for-organization
- https://workos.com/docs/reference/authkit/api-keys/delete
- https://workos.com/docs/reference/authkit/api-keys/list-for-organization
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

(none yet — add as discovered)

## Endpoints

| Endpoint                                                            | Description                                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/authkit`                                                          | authkit                                                                          |
| `/api-keys`                                                         | authkit - api-keys                                                               |
| `/api-keys/create-for-organization`                                 | authkit - api-keys - create-for-organization                                     |
| `/api-keys/delete`                                                  | authkit - api-keys - delete                                                      |
| `/api-keys/list-for-organization`                                   | authkit - api-keys - list-for-organization                                       |
| `/api-keys/validate`                                                | Validate an API key and retrieve associated metadata.                            |
| `/authentication`                                                   | authkit - authentication                                                         |
| `/authentication-errors`                                            | authkit - authentication-errors                                                  |
| `/authentication-errors/email-verification-required-error`          | authkit - authentication-errors - email-verification-required-error              |
| `/authentication-errors/mfa-challenge-error`                        | authkit - authentication-errors - mfa-challenge-error                            |
| `/authentication-errors/mfa-enrollment-error`                       | authkit - authentication-errors - mfa-enrollment-error                           |
| `/authentication-errors/organization-authentication-required-error` | authkit - authentication-errors - organization-authentication-required-error     |
| `/authentication-errors/organization-selection-error`               | authkit - authentication-errors - organization-selection-error                   |
| `/authentication-errors/sso-required-error`                         | authkit - authentication-errors - sso-required-error                             |
| `/authentication/code`                                              | authkit - authentication - code                                                  |
| `/authentication/email-verification`                                | authkit - authentication - email-verification                                    |
| `/authentication/get-authorization-url`                             | authkit - authentication - get-authorization-url                                 |
| `/authentication/get-authorization-url/error-codes`                 | authkit - authentication - get-authorization-url - error-codes                   |
| `/authentication/get-authorization-url/pkce`                        | authkit - authentication - get-authorization-url - pkce                          |
| `/authentication/get-authorization-url/redirect-uri`                | authkit - authentication - get-authorization-url - redirect-uri                  |
| `/authentication/magic-auth`                                        | authkit - authentication - magic-auth                                            |
| `/authentication/organization-selection`                            | authkit - authentication - organization-selection                                |
| `/authentication/password`                                          | authkit - authentication - password                                              |
| `/authentication/refresh-and-seal-session-data`                     | authkit - authentication - refresh-and-seal-session-data                         |
| `/authentication/refresh-token`                                     | authkit - authentication - refresh-token                                         |
| `/authentication/session-cookie`                                    | authkit - authentication - session-cookie                                        |
| `/authentication/totp`                                              | authkit - authentication - totp                                                  |
| `/cli-auth`                                                         | authkit - cli-auth                                                               |
| `/cli-auth/device-authorization`                                    | Initiate the CLI Auth flow by obtaining a device code and verification URLs.     |
| `/cli-auth/device-code`                                             | Exchange a device code for access and refresh tokens during the CLI Auth flow.   |
| `/cli-auth/error-codes`                                             | authkit - cli-auth - error-codes                                                 |
| `/email-verification`                                               | authkit - email-verification                                                     |
| `/email-verification/get`                                           | authkit - email-verification - get                                               |
| `/identity`                                                         | authkit - identity                                                               |
| `/identity/list`                                                    | authkit - identity - list                                                        |
| `/invitation`                                                       | authkit - invitation                                                             |
| `/invitation/accept`                                                | authkit - invitation - accept                                                    |
| `/invitation/find-by-token`                                         | authkit - invitation - find-by-token                                             |
| `/invitation/get`                                                   | authkit - invitation - get                                                       |
| `/invitation/list`                                                  | authkit - invitation - list                                                      |
| `/invitation/resend`                                                | authkit - invitation - resend                                                    |
| `/invitation/revoke`                                                | authkit - invitation - revoke                                                    |
| `/invitation/send`                                                  | authkit - invitation - send                                                      |
| `/logout`                                                           | authkit - logout                                                                 |
| `/logout/get-logout-url`                                            | authkit - logout - get-logout-url                                                |
| `/logout/get-logout-url-from-session-cookie`                        | authkit - logout - get-logout-url-from-session-cookie                            |
| `/magic-auth`                                                       | authkit - magic-auth                                                             |
| `/magic-auth/create`                                                | authkit - magic-auth - create                                                    |
| `/magic-auth/get`                                                   | authkit - magic-auth - get                                                       |
| `/mfa`                                                              | Enroll users in multi-factor authentication for an additional layer of security. |
| `/mfa/authentication-challenge`                                     | authkit - mfa - authentication-challenge                                         |
| `/mfa/authentication-factor`                                        | authkit - mfa - authentication-factor                                            |
| `/mfa/enroll-auth-factor`                                           | authkit - mfa - enroll-auth-factor                                               |
| `/mfa/list-auth-factors`                                            | authkit - mfa - list-auth-factors                                                |
| `/organization-membership`                                          | authkit - organization-membership                                                |
| `/organization-membership/create`                                   | authkit - organization-membership - create                                       |
| `/organization-membership/deactivate`                               | authkit - organization-membership - deactivate                                   |
| `/organization-membership/delete`                                   | authkit - organization-membership - delete                                       |
| `/organization-membership/get`                                      | authkit - organization-membership - get                                          |
| `/organization-membership/list`                                     | authkit - organization-membership - list                                         |
| `/organization-membership/reactivate`                               | authkit - organization-membership - reactivate                                   |
| `/organization-membership/update`                                   | authkit - organization-membership - update                                       |
| `/password-reset`                                                   | authkit - password-reset                                                         |
| `/password-reset/create`                                            | authkit - password-reset - create                                                |
| `/password-reset/get`                                               | authkit - password-reset - get                                                   |
| `/password-reset/reset-password`                                    | authkit - password-reset - reset-password                                        |
| `/session`                                                          | authkit - session                                                                |
| `/session-helpers`                                                  | session-helpers                                                                  |
| `/session-helpers/authenticate`                                     | authkit - session-helpers - authenticate                                         |
| `/session-helpers/get-logout-url`                                   | authkit - session-helpers - get-logout-url                                       |
| `/session-helpers/load-sealed-session`                              | authkit - session-helpers - load-sealed-session                                  |
| `/session-helpers/refresh`                                          | authkit - session-helpers - refresh                                              |
| `/session-tokens`                                                   | authkit - session-tokens                                                         |
| `/session-tokens/access-token`                                      | authkit - session-tokens - access-token                                          |
| `/session-tokens/jwks`                                              | authkit - session-tokens - jwks                                                  |
| `/session-tokens/refresh-token`                                     | authkit - session-tokens - refresh-token                                         |
| `/session/list`                                                     | authkit - session - list                                                         |
| `/session/revoke`                                                   | authkit - session - revoke                                                       |
| `/user`                                                             | authkit - user                                                                   |
| `/user/create`                                                      | authkit - user - create                                                          |
| `/user/delete`                                                      | authkit - user - delete                                                          |
| `/user/get`                                                         | authkit - user - get                                                             |
| `/user/get-by-external-id`                                          | authkit - user - get-by-external-id                                              |
| `/user/list`                                                        | authkit - user - list                                                            |
| `/user/update`                                                      | authkit - user - update                                                          |
