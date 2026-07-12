# Notra Console

Minimal companion app for managing Notra organization integrations without a subscription.
It runs on port 3003 with `bun run dev --filter=console`.
The console reuses the shared Notra database and authentication records.
Required environment variables are `DATABASE_URL` and `BETTER_AUTH_SECRET`.
MCP header encryption also requires `INTEGRATION_ENCRYPTION_KEY`.
Set `CONSOLE_BETTER_AUTH_URL=http://localhost:3003` for local development.
