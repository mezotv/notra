# WorkOS Multi-Factor Authentication

## Docs

- https://workos.com/docs/mfa/index
- https://workos.com/docs/mfa/example-apps
- https://workos.com/docs/mfa/ux/sign-in
- https://workos.com/docs/mfa/ux/enrollment
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- MFA API is NOT compatible with WorkOS SSO. For SSO users, use the IdP's built-in MFA features instead.
- You must persist `factor.id` in your user database. Without it, the enrolled factor cannot be used for future challenges.
- Challenges are single-use. Attempting to verify a challenge twice returns "challenge already verified." Create a new challenge for each sign-in attempt.
- SMS challenges expire after 10 minutes. TOTP has no such limit but is affected by device clock skew.
- `qr_code` from TOTP enrollment is a data URI, not a URL. Use it directly as an image `src` — do not attempt to fetch it.
- SMS phone numbers must be E.164 format (`+1234567890`). Other formats (e.g., `(123) 456-7890`) cause a 400 error.
- TOTP enrollment requires both `totp_issuer` and `totp_user` parameters. Omitting either causes a 400 error.
- MFA verifies factor ownership, not user identity. It supplements primary authentication — never use it as the sole auth method.
