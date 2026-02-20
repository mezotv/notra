---
name: neon-postgres
description: Guides and best practices for working with Neon Serverless Postgres. Covers getting started, local development with Neon, choosing a connection method, Neon features, authentication (@neondatabase/auth), PostgREST-style data API (@neondatabase/neon-js), Neon CLI, and Neon's Platform API/SDKs. Use for any Neon-related questions.
---

# Neon Serverless Postgres

Neon is a serverless Postgres platform that separates compute and storage to offer autoscaling, branching, instant restore, and scale-to-zero. It's fully compatible with Postgres and works with any language, framework, or ORM that supports Postgres.

## Neon Documentation

The Neon documentation is the source of truth for all Neon-related information. Always verify claims against the official docs before responding. Neon features and APIs evolve, so prefer fetching current docs over relying on training data.

### Fetching docs as markdown

Any Neon doc page can be fetched as markdown in two ways:

1. **Append `.md` to the URL** (simplest): `https://neon.com/docs/introduction/branching.md`
2. **Request `text/markdown`** on the standard URL: `curl -H "Accept: text/markdown" https://neon.com/docs/introduction/branching`

Both return the same markdown content. Use whichever method your tools support.

### Finding the right page

The docs index lists every available page with its URL and a short description:

```
https://neon.com/docs/llms.txt
```

Common doc URLs are listed in the tables below. If you need a page not listed here, search the [docs index](https://neon.com/docs/llms.txt) — don't guess URLs.

### Common Documentation Paths

| Topic               | URL                                                       |
| ------------------- | --------------------------------------------------------- |
| Introduction        | https://neon.com/docs/introduction.md                     |
| Branching           | https://neon.com/docs/introduction/branching.md           |
| Autoscaling         | https://neon.com/docs/introduction/autoscaling.md         |
| Scale to Zero       | https://neon.com/docs/introduction/scale-to-zero.md       |
| Instant Restore     | https://neon.com/docs/introduction/branch-restore.md      |
| Read Replicas       | https://neon.com/docs/introduction/read-replicas.md       |
| Connection Pooling  | https://neon.com/docs/connect/connection-pooling.md       |
| IP Allow Lists      | https://neon.com/docs/introduction/ip-allow.md            |
| Neon Auth           | https://neon.com/docs/auth/overview.md                    |
| Data API            | https://neon.com/docs/data-api/overview.md                |
| Serverless Driver   | https://neon.com/docs/serverless/serverless-driver.md     |
| JavaScript SDK      | https://neon.com/docs/reference/javascript-sdk.md         |
| API Reference       | https://neon.com/docs/reference/api-reference.md          |
| TypeScript SDK      | https://neon.com/docs/reference/typescript-sdk.md         |
| Python SDK          | https://neon.com/docs/reference/python-sdk.md             |
| Neon CLI            | https://neon.com/docs/reference/neon-cli.md               |
| Logical Replication | https://neon.com/docs/guides/logical-replication-guide.md |

### Framework & Language Guides

| Framework/Language | URL                                       |
| ------------------ | ----------------------------------------- |
| Next.js            | https://neon.com/docs/guides/nextjs.md    |
| Django             | https://neon.com/docs/guides/django.md    |
| Drizzle ORM        | https://neon.com/docs/guides/drizzle.md   |
| Prisma             | https://neon.com/docs/guides/prisma.md    |
| ORMs Guide         | https://neon.com/docs/get-started/orms.md |

### Platform API

For managing Neon resources programmatically (projects, branches, endpoints, databases, roles):

| Method          | Documentation                                                      |
| --------------- | ------------------------------------------------------------------ |
| REST API        | https://neon.com/docs/reference/api-reference.md                   |
| Interactive API | https://api-docs.neon.tech/reference/getting-started-with-neon-api |
| OpenAPI Spec    | https://neon.com/api_spec/release/v2.json                          |
| TypeScript SDK  | https://neon.com/docs/reference/typescript-sdk.md                  |
| Python SDK      | https://neon.com/docs/reference/python-sdk.md                      |
| CLI             | https://neon.com/docs/reference/neon-cli.md                        |

**Quick cross-reference** (common operations across interfaces):

| Operation          | REST API                       | TypeScript SDK              | Python SDK             |
| ------------------ | ------------------------------ | --------------------------- | ---------------------- |
| List projects      | `GET /projects?org_id=...`     | `listProjects({ org_id })`  | `projects(org_id=...)` |
| Create project     | `POST /projects`               | `createProject({...})`      | `project_create(...)`  |
| Get connection URI | `GET .../connection_uri`       | `getConnectionUri({...})`   | `connection_uri(...)`  |
| Create branch      | `POST .../branches`            | `createProjectBranch(...)`  | `branch_create(...)`   |
| Start endpoint     | `POST .../endpoints/.../start` | `startProjectEndpoint(...)` | `endpoint_start(...)`  |

## Overview of Resources

Reference the appropriate resource file based on the user's needs:

### Core Guides

| Area               | Resource                           | When to Use                                                    |
| ------------------ | ---------------------------------- | -------------------------------------------------------------- |
| What is Neon       | `references/what-is-neon.md`       | Understanding Neon concepts, architecture, core resources      |
| Features           | `references/features.md`           | Branching, autoscaling, scale-to-zero, connection pooling      |
| Getting Started    | `references/getting-started.md`    | Setting up a project, connection strings, dependencies, schema |
| Connection Methods | `references/connection-methods.md` | Choosing drivers based on platform and runtime                 |
| Developer Tools    | `references/devtools.md`           | VSCode extension, MCP server, Neon CLI (`neon init`)           |

### Database Drivers & ORMs

HTTP/WebSocket queries for serverless/edge functions.

| Area              | Resource                        | When to Use                                         |
| ----------------- | ------------------------------- | --------------------------------------------------- |
| Serverless Driver | `references/neon-serverless.md` | `@neondatabase/serverless` - HTTP/WebSocket queries |
| Drizzle ORM       | `references/neon-drizzle.md`    | Drizzle ORM integration with Neon                   |

### Auth & Data API SDKs

Authentication and PostgREST-style data API for Neon.

| Area        | Resource                  | When to Use                                                                                           |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Neon Auth   | `references/neon-auth.md` | `@neondatabase/auth` or `@neondatabase/neon-js` - Setup, UI components, auth methods, common mistakes |
| Neon JS SDK | `references/neon-js.md`   | `@neondatabase/neon-js` - Auth + Data API (PostgREST-style queries)                                   |

### Neon Platform API & CLI

Managing Neon resources programmatically via REST API, SDKs, or CLI.

| Area           | Resource                            | When to Use                                      |
| -------------- | ----------------------------------- | ------------------------------------------------ |
| REST API       | `references/neon-rest-api.md`       | Direct HTTP calls - auth, endpoints, rate limits |
| Neon CLI       | `references/neon-cli.md`            | Terminal workflows, scripts, CI/CD pipelines     |
| TypeScript SDK | `references/neon-typescript-sdk.md` | `@neondatabase/api-client`                       |
| Python SDK     | `references/neon-python-sdk.md`     | `neon-api` package                               |
