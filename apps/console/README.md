# Notra Console

Minimal companion app for managing Notra organization integrations without a subscription.
It runs on port 3003 with `bun run dev --filter=console`.
The console reuses the shared Notra database and authentication records.
Required environment variables are `DATABASE_URL`, `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, and `WORKOS_COOKIE_PASSWORD`.
Set `CONSOLE_WORKOS_REDIRECT_URI=http://localhost:3003/auth/callback` so the console uses its own AuthKit redirect URI.
MCP header encryption also requires `INTEGRATION_ENCRYPTION_KEY`.
Set `CONSOLE_APP_URL=http://localhost:3003` for local development.
