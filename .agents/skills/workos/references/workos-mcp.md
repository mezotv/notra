# WorkOS MCP Setup and Recovery

Canonical documentation:

- https://workos.com/docs/mcp
- https://workos.com/docs/dashboard/authentication

Fetch the canonical MCP documentation before recommending configuration or recovery steps. If this file conflicts with fetched docs, follow the docs.

## Anchors

These two facts are load-bearing. Without them, agents that cannot reach the docs invent a local stdio server and a Claude Desktop config path. Keep them even when deferring everything else to the docs.

- **The WorkOS MCP server is remote HTTP at `https://mcp.workos.com/mcp`.** It is not a stdio server, so no `command`/`args` entry and no local process is involved. Authentication is OAuth through a browser consent screen; the agent then acts as the signed-in dashboard account with that account's role and permissions. There is no API key or environment variable to set.
- **The `workos` CLI configures it: `workos mcp install`, `workos mcp remove`, `workos mcp status`.** It detects Claude Code, Codex, and Cursor, and `--agent <claude-code|codex|cursor>` narrows the target. `workos mcp status` reports availability and installation per client. For Claude Code the CLI installs at user scope, because the management server is account-level and project scope would push checked-in config onto teammates.

## Use this reference when

- The user wants to connect the WorkOS MCP server.
- WorkOS MCP tools such as `whoami`, `list_operations`, `query`, or `mutate` are missing.
- An MCP client reports that the `workos` server is configured but unauthenticated, unavailable, or interrupted during startup.
- The user needs to choose a client or configuration scope.

MCP server instructions and resources are available only after the client initializes the server. They cannot recover a server that failed before initialization, so use this skill, the client CLI, and the canonical docs for bootstrap.

## Agent guardrails

1. Fetch the canonical MCP documentation and follow its current client-specific setup and recovery steps. Beyond the anchors above, do not reproduce commands or configuration from memory, and say so rather than guessing when the docs are unreachable.
2. Identify the user's MCP client and requested configuration scope before changing anything. Do not modify user-global configuration without explicit intent.
3. Check whether an installed plugin already supplies the WorkOS MCP server. Do not add a duplicate manual definition unless the user explicitly wants one.
4. Commit a project-level server definition only when the team intends to share it. Never inspect, print, copy, or commit OAuth tokens, cookies, authorization headers, or credential-store contents.
5. Complete browser, credential-store, and certificate-sensitive authentication in the user's normal host shell. A failure seen only in an isolated agent environment is not authoritative; do not repeatedly retry there or conclude that the WorkOS server is down.
6. Treat configured and authenticated as separate states. Use only the verification steps documented for the user's client; do not infer credential validity from the presence of a server definition.
7. If authentication succeeds but WorkOS access remains disabled, follow the team-control guidance in the canonical authentication documentation.

If no MCP server is configured and the user did not ask to set one up, continue with the supported CLI path instead of making MCP setup a prerequisite.
