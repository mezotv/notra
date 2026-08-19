# WorkOS Vault

## Docs

- https://workos.com/docs/vault/quick-start
- https://workos.com/docs/vault/key-context
- https://workos.com/docs/vault/index
- https://workos.com/docs/vault/byok
- https://workos.com/docs/reference/vault
- https://workos.com/docs/reference/vault/key
- https://workos.com/docs/reference/vault/key/create-data-key
- https://workos.com/docs/reference/vault/key/decrypt-data
- https://workos.com/docs/reference/vault/key/decrypt-data-key
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- BYOK requires customer-side IAM permissions granting WorkOS access to their KMS. Your app cannot do this programmatically — provide customers with IAM policy templates from the BYOK docs.
- Vault encrypts data per WorkOS organization. Every operation requires an `organization_id` — there is no global/unscoped access.
- Do NOT use internal customer IDs as `organization_id`. WorkOS organization IDs have format `org_*`. Always map through WorkOS APIs.
- Key context metadata is NOT encrypted separately. Do not store sensitive data or PII in metadata fields.
- Vault keys are case-sensitive. Mismatched casing between store and retrieve silently returns "key not found."
- BYOK KMS IAM changes can take 5-10 minutes to propagate. Customer must grant `kms:Decrypt` and `kms:Encrypt` on their key.

## Endpoints

| Endpoint                | Description                    |
| ----------------------- | ------------------------------ |
| `/vault`                | vault                          |
| `/key`                  | vault - key                    |
| `/key/create-data-key`  | vault - key - create-data-key  |
| `/key/decrypt-data`     | vault - key - decrypt-data     |
| `/key/decrypt-data-key` | vault - key - decrypt-data-key |
| `/key/encrypt-data`     | vault - key - encrypt-data     |
| `/object`               | vault - object                 |
| `/object/create`        | vault - object - create        |
| `/object/delete`        | vault - object - delete        |
| `/object/get`           | vault - object - get           |
| `/object/get-by-name`   | vault - object - get-by-name   |
| `/object/list`          | vault - object - list          |
| `/object/metadata`      | vault - object - metadata      |
| `/object/update`        | vault - object - update        |
| `/object/version`       | vault - object - version       |
| `/object/versions`      | vault - object - versions      |
