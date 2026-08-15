# Framework: Vite

## Guidance

- Detect whether routing is framework-based or custom, then integrate accordingly.
- Place widget pages/components in existing feature/page structure.
- Reuse existing token/auth utilities rather than introducing new architecture.
- For JS/TS token strategy details (AuthKit token vs backend `getToken` with scopes), follow [token-strategies.md](token-strategies.md).
- Keep integration small and aligned with current app layout.

## Server Token Pattern (JS/TS)

For the token code pattern, see [token-strategies.md](token-strategies.md) → JS/TS Authorization Tokens. In a Vite app, token generation typically lives in an existing backend service or API route rather than the Vite dev server.
