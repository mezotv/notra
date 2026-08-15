# WorkOS Fine-Grained Authorization (FGA)

## Docs

- https://workos.com/docs/fga
- https://workos.com/docs/fga/quick-start
- https://workos.com/docs/fga/resource-types
- https://workos.com/docs/fga/resources
- https://workos.com/docs/fga/roles-and-permissions
- https://workos.com/docs/fga/assignments
- https://workos.com/docs/fga/access-checks
- https://workos.com/docs/fga/resource-discovery
- https://workos.com/docs/fga/authkit-integration
- https://workos.com/docs/fga/standalone-integration
- https://workos.com/docs/fga/high-cardinality-entities
- https://workos.com/docs/reference/fga
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- FGA extends RBAC — it is NOT a replacement. Org-level roles from RBAC still apply. FGA adds resource-scoped roles on top.
- **SDK namespace is `workos.authorization.*`, NOT `workos.fga.*`.** The product is called FGA but every SDK method lives under `authorization`: `check`, `assignRole`, `removeRoleAssignment`, `listResources`, `createResource`, etc. Claude consistently invents `workos.fga.check`, `workos.fga.assignRole`, `workos.warrants.check` (legacy Warrant API, removed). Always use `workos.authorization.*`.
- Resource types are configured ONLY in the Dashboard, not via API. Slugs are immutable after creation — choose carefully.
- Access checks use `organizationMembershipId`, NOT `userId`. Fetch membership first via `listOrganizationMemberships()`.
- Permissions use `{resource_type}:{action}` format (e.g., `project:edit`). Claude tends to invent flat permission names like `editProject`.
- Hierarchy max depth is 5 levels, max 10 child types per resource type, max 50 resource types per environment.
- First org-level role creation on a resource type makes that org independent — it stops inheriting environment-level roles. Same behavior as RBAC.
- `resourceExternalId` (your app's ID) and `resourceTypeSlug` can be used instead of WorkOS `resource_id` in all API calls — prefer external IDs to avoid storing WorkOS IDs.
- Deleting a resource fails by default if it has children or role assignments. Pass cascade option to force.
- Access checks evaluate three levels automatically (direct assignment, inherited from parent, org-scoped role) — do NOT manually check each level.
- For org-wide permissions, check JWT claims instead of calling the API — saves a round trip. Reserve API calls for resource-specific checks.

## Endpoints

| Endpoint                       | Description                              |
| ------------------------------ | ---------------------------------------- |
| `/fga`                         | FGA overview                             |
| `/resource`                    | Resource management                      |
| `/resource/create`             | Create a resource                        |
| `/resource/get`                | Get resource by ID                       |
| `/resource/get-by-external-id` | Get resource by external ID              |
| `/resource/list`               | List resources                           |
| `/resource/update`             | Update a resource                        |
| `/resource/delete`             | Delete a resource                        |
| `/role-assignment`             | Role assignment management               |
| `/role-assignment/assign`      | Assign role on a resource                |
| `/role-assignment/list`        | List role assignments for membership     |
| `/role-assignment/remove`      | Remove role assignment                   |
| `/access-check`                | Access check                             |
| `/access-check/check`          | Check if membership has permission       |
| `/access-check/list-resources` | List resources membership can access     |
| `/access-check/list-members`   | List memberships with access to resource |
