# WorkOS Role-Based Access Control

## Docs

- https://workos.com/docs/rbac/quick-start
- https://workos.com/docs/rbac/organization-roles
- https://workos.com/docs/rbac/integration
- https://workos.com/docs/rbac/idp-role-assignment
- https://workos.com/docs/directory-sync/identity-provider-role-assignment
  If this file conflicts with fetched docs, follow the docs.

## IdP group → role mapping (the common customer ask)

When a user asks how to map Entra / Azure AD / Okta / Google Workspace groups to WorkOS roles, this is the canonical flow. It is **not** a CLI operation. Do not fabricate `workos role-mappings ...` or similar commands.

**Which source to use**:

- If the org has a Directory Sync connection (SCIM or Google Workspace), use **Directory Sync group role assignment**. Roles propagate in real time. Docs: https://workos.com/docs/directory-sync/identity-provider-role-assignment
- If the org only has SSO (no Directory Sync), use **SSO group role assignment**. Roles only update when the user re-authenticates. Docs: https://workos.com/docs/rbac/idp-role-assignment
- When both exist, prefer Directory Sync. Per docs: "SCIM is generally the preferred option due to its real-time synchronization capabilities."

**Order of operations**:

1. Configure roles first in the WorkOS Dashboard. Per docs: "Once roles are configured for your application, enable directory group role assignment in Admin Portal to allow IT contacts to assign roles to groups during directory setup."
2. Enable directory group role assignment on the Authorization page of the WorkOS Dashboard (toggle controlling whether the Admin Portal surfaces the role-assignment step).
3. The IT contact / org admin maps groups → roles during directory setup via Admin Portal, **or** via the directory page on the WorkOS Dashboard (per docs: "Navigate to the directory page on the WorkOS dashboard").
4. For Directory Sync: new users added to a mapped group get the mapped role in real time ("Roles are granted to directory users in real-time, when we receive updates to their group memberships").
5. For SSO: the mapped role is applied when the user authenticates ("Roles are granted to SSO profiles when the user authenticates").

**Precedence (read this before telling a user to call `updateOrganizationMembership`)**:

Per docs: "IdP role assignment will always take precedence over roles assigned via API or the WorkOS Dashboard." If an IdP mapping exists for the user's group, any API-assigned role is silently overwritten on the next sync (Directory Sync) or next login (SSO).

**What NOT to do**:

- Do **not** invent specific dashboard menu paths (e.g. "Dashboard → Organizations → [name] → Roles → Map Groups"). The docs do not commit to a specific click-path. Link the user to the docs URLs above and let them navigate.
- Do **not** claim this is configurable via the WorkOS CLI. It is not. If the user asks for a CLI command, explicitly say it is not supported in the CLI and link to the docs above.

## API role assignment recipe

Use this when the user asks how to assign an already-configured role to a user in an organization.

1. Confirm from the prompt or user context that the role slug already exists. If they are unsure, tell them to verify the role in the WorkOS Dashboard first; do not create the role as part of assignment.
2. List organization memberships filtered by `user_id` and `organization_id` to find the organization membership ID.
3. Update the organization membership with the role slug.
4. If the role reverts later, check for IdP group role mapping; IdP mapping overrides API/Dashboard role assignments.

Python shape:

```python
memberships = workos_client.user_management.list_organization_memberships(
    user_id=user_id,
    organization_id=organization_id,
)
membership_id = memberships.data[0].id

workos_client.user_management.update_organization_membership(
    organization_membership_id=membership_id,
    role_slug="billing-admin",
)
```

## Gotchas

- Always check permissions (role.permissions.includes('action')), NOT role slugs (role.slug === 'admin') — slug checks break in multi-org with custom roles. Claude defaults to slug checks.
- Role assignment requires the MEMBERSHIP ID, not the user ID — fetch via listOrganizationMemberships() first, then call updateOrganizationMembership(membershipId, { roleSlug })
- IdP group mapping OVERRIDES API/Dashboard role assignments on every auth — updateOrganizationMembership() changes silently revert on next login if IdP mapping exists
- IdP role mapping only works with environment-level roles, NOT org-level roles
- First org-level role creation isolates that org permanently — it stops inheriting environment-level role changes. This is irreversible.
- Org-level role slugs are auto-prefixed with "org:" — use the full slug "org:custom_admin", not just "custom_admin"
- Stale session after role change — role assigned after login won't take effect until user re-authenticates. Force re-auth or refresh the session.
- Permission slug typos fail silently — "video.create" vs "videos.create" won't error, just denies access

## Endpoints

| Endpoint                               | Description                     |
| -------------------------------------- | ------------------------------- |
| `/roles`                               | Roles overview                  |
| `/organization-role`                   | Organization role management    |
| `/organization-role/add-permission`    | Add permission to org role      |
| `/organization-role/create`            | Create org role                 |
| `/organization-role/delete`            | Delete org role                 |
| `/organization-role/get`               | Get org role                    |
| `/organization-role/list`              | List org roles                  |
| `/organization-role/remove-permission` | Remove permission from org role |
| `/organization-role/set-permissions`   | Set permissions on org role     |
| `/organization-role/update`            | Update org role                 |
| `/permission`                          | Permission management           |
| `/permission/create`                   | Create permission               |
| `/permission/delete`                   | Delete permission               |
| `/permission/get`                      | Get permission                  |
| `/permission/list`                     | List permissions                |
| `/permission/update`                   | Update permission               |
| `/role`                                | Environment role management     |
| `/role/add-permission`                 | Add permission to role          |
| `/role/create`                         | Create role                     |
| `/role/get`                            | Get role                        |
| `/role/list`                           | List roles                      |
| `/role/set-permissions`                | Set permissions on role         |
| `/role/update`                         | Update role                     |
