# Neon Features

Quick-reference summaries of Neon's key platform features. Fetch the linked docs for full details.

## Branching

Instant, copy-on-write database clones at any point in time. Branches only store changes from parent -- no data duplication.

- Branches are instant (no data copying)
- Use for: dev environments, staging, preview deployments, testing migrations
- Each branch can have its own compute endpoint
- If the Neon MCP server is available, use it to list and create branches. Otherwise, use the CLI or Platform API.

[Branching docs](https://neon.com/docs/introduction/branching.md)

## Autoscaling

Compute scales automatically between configured min and max Compute Units (CUs) based on CPU and memory pressure. No manual intervention required.

[Autoscaling docs](https://neon.com/docs/introduction/autoscaling.md)

## Scale to Zero

Computes suspend after inactivity (default: 5 minutes, configurable). First query after suspend has ~500ms cold start. Storage is always maintained.

[Scale to zero docs](https://neon.com/docs/introduction/scale-to-zero.md)

## Instant Restore

Point-in-time recovery without pre-configured backups. Restore window depends on plan (7-30 days). Can also create branches from any historical point, or use Time Travel queries.

[Instant restore docs](https://neon.com/docs/introduction/branch-restore.md)

## Read Replicas

Read-only compute endpoints that share storage with the primary (no data duplication). Instant creation, independent scaling. Use for analytics, reporting, and read-heavy workloads.

[Read replicas docs](https://neon.com/docs/introduction/read-replicas.md)

## Connection Pooling

Built-in PgBouncer. Enable by adding `-pooler` to the endpoint hostname. Transaction mode by default. Supports up to 10,000 concurrent connections. Essential for serverless environments.

[Connection pooling docs](https://neon.com/docs/connect/connection-pooling.md)

## Neon Auth

Managed authentication that branches with your database. Supports email, social providers (Google, GitHub), session management, and UI components.

For setup, see `neon-auth.md`. For auth + Data API, see `neon-js.md`.

[Neon Auth docs](https://neon.com/docs/auth/overview.md)

## IP Allow Lists

Restrict database access to specific IP addresses or CIDR ranges. Can be scoped to protected branches only.

[IP Allow docs](https://neon.com/docs/introduction/ip-allow.md)

## Logical Replication

Replicate data to/from external Postgres databases using native logical replication.

[Logical replication docs](https://neon.com/docs/guides/logical-replication-guide.md)
