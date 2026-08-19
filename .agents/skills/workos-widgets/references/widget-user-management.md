# Widget: User Management

## Purpose

The User Management widget lets organization admins manage members in an organization.

## Permission Requirement

The acting user should have a role with `widgets:users-table:manage`.

## Complete When

- The widget shows a paginated members table.
- The table includes: avatar, name, email, role, last active time, and status when available.
- Search is implemented server-side.
- Role filtering is implemented server-side.
- Per-user actions are available for editing role and deleting/removing user.
- Admin invite flow is available for adding new users.
