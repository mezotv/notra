# Framework: SvelteKit

## Guidance

- Follow existing `+page`, `+layout`, and `+server`/`+page.server` conventions.
- Keep token generation in server/load boundaries that already handle auth/session context.
- For JS/TS token strategy details (AuthKit token vs backend `getToken` with scopes), follow [token-strategies.md](token-strategies.md).
- Keep frontend data calls aligned with current SvelteKit patterns.
- Never embed a widget directly in a `+page.svelte`. Always extract it into its own `.svelte` component file. The page imports and renders that component.

## Server Token Pattern (JS/TS)

For the token code pattern, see [token-strategies.md](token-strategies.md) → JS/TS Authorization Tokens. Token generation belongs in a `+page.server.ts`, `+layout.server.ts`, or `+server.ts` boundary.
