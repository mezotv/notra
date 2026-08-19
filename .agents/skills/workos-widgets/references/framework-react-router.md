# Framework: React Router

## Guidance

- Follow the repository's route definition style (file-based or config-based).
- Add widget routes/components in the same structure used by existing features.
- Reuse existing loader/action or component-level token patterns.
- For JS/TS token strategy details (AuthKit token vs backend `getToken` with scopes), follow [token-strategies.md](token-strategies.md).
- Preserve current router/provider setup and conventions.

## Server Token Pattern (JS/TS)

For the token code pattern, see [token-strategies.md](token-strategies.md) → JS/TS Authorization Tokens. Token generation belongs in a loader, action, or dedicated server route.
