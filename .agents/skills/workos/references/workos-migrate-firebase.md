# WorkOS Migration: Firebase

## Docs

- https://workos.com/docs/migrate/firebase
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Firebase uses a non-standard scrypt variant. Password hashes must be converted to PHC format with Firebase-specific parameters (`sk=` signer key, `ss=` salt separator). Missing either parameter causes import failure.
- Firebase exports use base64 encoding. WorkOS expects base64 in the PHC string — do NOT decode the bytes before importing.
- Firebase users can have MULTIPLE auth methods (e.g., password + Google). A user with both needs both migration paths (password import AND OAuth reconnection).
- Firebase's OAuth redirect URI is `/__/auth/handler`. WorkOS uses your custom callback URL. The redirect URI must match exactly or OAuth will fail silently.
- WorkOS user IDs differ from Firebase UIDs. You must store the mapping (`firebase_uid` -> `workos_user_id`) in your database.
- For SAML/OIDC enterprise connections, the identity provider admin must update THEIR config with the new WorkOS callback URL. Coordinate timing — this is a cross-org dependency.
- Firebase Email Link sends a link that completes auth in the same browser. WorkOS Magic Auth sends a code the user enters in-app. The UX is different — plan for user communication.
