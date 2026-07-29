# Notra Agent

The unified eve-based agent for all Notra product work (everything except onboarding, which stays in `apps/onboarding-agent`). The root agent is the Notra assistant chat surface; content generation and image generation run as subagents.

## Architecture at a glance

```
dashboard /chat (canary, NOTRA_AGENT_CHAT=1)
  └─ /api/organizations/{orgId}/agent proxy ── auth + rate limit + AI-credit check
       └─ POST {EVE_NOTRA_AGENT_URL}/eve/v1/session   (surface: standalone-chat)

dashboard schedule/event workflows (canary, NOTRA_AGENT_CONTENT=1)
  └─ task-mode session with a delegation directive
       └─ root agent ── content-writer subagent ── create_post → Postgres

apps/api /v2/agent-chats
  └─ create / send / stream sessions 1:1 against this deployment

eve agent (this package, separate Vercel project)
  ├─ root: Notra assistant (anthropic/claude-sonnet-4.6)
  ├─ subagents/content-writer (anthropic/claude-sonnet-5, structured result)
  └─ subagents/image-designer (wraps the @upstash/box sandbox image pipeline)
```

Tool implementations live in `@notra/tools` (`src/assistant`, `src/content-writer`, `src/image`); this app only holds one-line adapter files, the channel, hooks, and instructions. Business logic (post persistence, image post persistence) is shared with the legacy AI SDK path via `@notra/ai/utils/post-service` and `@notra/ai/utils/image-post-service`.

## Authentication and tenancy

The eve channel accepts, in order: dashboard Vercel OIDC, HTTP Basic service auth (`EVE_NOTRA_AGENT_PASSWORD`, username `notra-dashboard`), same-project Vercel OIDC, and loopback local dev. Trusted callers stamp tenant scope through `x-notra-*` headers (organization, user, chat, surface, content, collection, content type, auto-publish, markup, voice, brand agent type, source metadata, generation config); the channel copies them onto the session principal and tools read them from `ctx.session.auth`, never from model input. Post creation derives a deterministic id from `(sessionId, turnId, input)` and inserts with `ON CONFLICT DO NOTHING`, so replayed steps cannot double-create posts.

Usage metering: hooks on the root agent and both subagents accumulate `step.completed` token usage in Redis (deduped by `(sessionId, turnId, stepIndex)`) and bill Autumn once per completed turn.

## Deploying on Vercel

1. Create a new Vercel project from this monorepo with Root Directory `apps/agent`, framework preset **Other**, build command `bun run agent:build`. No output directory override.
2. Enable OIDC federation on this project, the dashboard project, and the API project.
3. Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Posts, collections, skills, brand data, integrations |
| `CONTEXT_DEV_API_KEY` | yes | `search_web` / `fetch_webpage` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | yes | Usage dedupe, tool caches |
| `AUTUMN_SECRET_KEY` | yes | AI-credit metering |
| `UPSTASH_BOX_API_KEY` | yes | Image generation sandbox |
| `CLOUDFLARE_ACCESS_KEY_ID` / `CLOUDFLARE_SECRET_ACCESS_KEY` / `CLOUDFLARE_S3_ENDPOINT` / `CLOUDFLARE_BUCKET_NAME` / `CLOUDFLARE_PUBLIC_URL` | yes | Generated image assets |
| `INTEGRATION_ENCRYPTION_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` | yes | GitHub/Linear/Granola integration resolution |
| `SUPERMEMORY_API_KEY` | yes | Brand reference semantic search |
| `DASHBOARD_VERCEL_TEAM_SLUG` / `DASHBOARD_VERCEL_PROJECT_NAME` | prod | Dashboard OIDC route auth |
| `API_VERCEL_PROJECT_NAME` | prod | API project OIDC route auth (same team slug) |
| `EVE_NOTRA_AGENT_PASSWORD` | fallback | Basic auth when OIDC is unavailable |

Model access needs no key on Vercel (AI Gateway OIDC); off Vercel set `AI_GATEWAY_API_KEY`.

4. Callers (dashboard and API projects) need `EVE_NOTRA_AGENT_URL` plus either OIDC federation or `EVE_NOTRA_AGENT_PASSWORD`, and the canary flags `NOTRA_AGENT_CHAT=1` / `NOTRA_AGENT_CONTENT=1` to route traffic here.

## Local development

`bun dev` starts the eve dev server on port 3200. Set `EVE_NOTRA_AGENT_URL=http://127.0.0.1:3200` for the dashboard/API. `GET /eve/v1/health` is public; `POST /eve/v1/session` without credentials must return 401.

Debug discovery with `bun x eve info` and `.eve/discovery/diagnostics.json`.
