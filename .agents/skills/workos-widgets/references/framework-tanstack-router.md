# Framework: TanStack Router

## Guidance

- Follow current route module conventions and route tree workflow.
- Place widget route files where the router expects them.
- Keep token retrieval aligned with existing loader/client boundaries.
- For JS/TS token strategy details (AuthKit token vs backend `getToken` with scopes), follow [token-strategies.md](token-strategies.md).
- Reuse existing typing and routing patterns from the project.

## Server Token Pattern (JS/TS)

For the token code pattern, see [token-strategies.md](token-strategies.md) → JS/TS Authorization Tokens. Token generation belongs in the route's loader or a dedicated server handler.
