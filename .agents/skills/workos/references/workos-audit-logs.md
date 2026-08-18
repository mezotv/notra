# WorkOS Audit Logs

## Docs

- https://workos.com/docs/audit-logs/metadata-schema
- https://workos.com/docs/audit-logs/log-streams
- https://workos.com/docs/audit-logs/index
- https://workos.com/docs/audit-logs/exporting-events
- https://workos.com/docs/audit-logs/editing-events
- https://workos.com/docs/audit-logs/admin-portal
- https://workos.com/docs/reference/audit-logs
- https://workos.com/docs/reference/audit-logs/configuration
- https://workos.com/docs/reference/audit-logs/event
- https://workos.com/docs/reference/audit-logs/event/create
- https://workos.com/docs/reference/audit-logs/export
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- Event type naming MUST follow `{group}.{object}.{action}` convention (e.g., `user.account.created`). Flat names like `shareCreated` are rejected.
- Metadata limits: 50 keys max per metadata object, 40 chars per key name, 500 chars per value. Exceeding silently truncates or fails.
- Log Streams to customer SIEMs via HTTP POST require IP allowlisting. WorkOS US egress IPs: `3.217.146.166`, `23.21.184.92`, `34.204.154.149`, `44.213.245.178`, `44.215.236.82`, `50.16.203.9`. EU region uses different IPs — check docs.
- If metadata schema validation is enabled in the Dashboard, events that don't match the JSON Schema are rejected. Disable temporarily if blocking deployment.
- Log Stream must show "Active" status in Dashboard to deliver events. Credential or network issues silently stop delivery without failing the event creation call.

## Endpoints

| Endpoint               | Description                        |
| ---------------------- | ---------------------------------- |
| `/audit-logs`          | audit-logs                         |
| `/configuration`       | audit-logs - configuration         |
| `/event`               | audit-logs - event                 |
| `/event/create`        | audit-logs - event - create        |
| `/export`              | audit-logs - export                |
| `/export/create`       | audit-logs - export - create       |
| `/export/get`          | audit-logs - export - get          |
| `/retention`           | audit-logs - retention             |
| `/retention/get`       | audit-logs - retention - get       |
| `/retention/set`       | audit-logs - retention - set       |
| `/schema`              | audit-logs - schema                |
| `/schema/create`       | audit-logs - schema - create       |
| `/schema/list`         | audit-logs - schema - list         |
| `/schema/list-actions` | audit-logs - schema - list-actions |
