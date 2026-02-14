# Notra

<p align="center">
  <img src="apps/dashboard/src/app/icon.svg" alt="Notra logo" width="96" height="96" />
</p>

Notra helps teams turn their daily work, such as merged PRs, closed issues, and Slack conversations, into ready-to-publish content.

It automates content creation by connecting to tools like GitHub, Linear, and Slack, using AI to analyze activity and generate drafts for blog posts, changelogs, and social media updates.

Notra aims to eliminate manual effort in content creation by working in the background and tailoring content to match a team's brand voice.

## What Notra does

- Connects your team tools (GitHub, Linear, Slack)
- Tracks meaningful product and engineering activity
- Generates drafts for changelogs, blog posts, and social updates
- Adapts output to your brand tone and style

## Architecture overview

Notra runs as an event-driven content pipeline:

1. **Ingest activity**
   - Pulls updates from connected systems (for example GitHub, Linear, Slack)
   - Normalizes activity into a common internal format

2. **Analyze context**
   - Applies AI analysis to identify what changed and why it matters
   - Prioritizes high-signal updates (major features, fixes, reliability, security)

3. **Generate drafts**
   - Produces structured drafts for changelogs, blog content, and social posts
   - Uses prompt templates and tool calls to fill gaps where needed

4. **Apply brand voice**
   - Adapts output to each workspace's preferred tone and custom instructions
   - Keeps technical accuracy while making content readable and human

5. **Publish-ready output**
   - Stores ready-to-review content in the dashboard
   - Supports scheduled and continuous background generation

## Monorepo apps

- `apps/dashboard` - main Notra product app
- `apps/web` - public website

## Local development

```bash
bun install
bun run dev
```

To run only the dashboard app:

```bash
bun run dev --filter=dashboard
```

To build the dashboard app:

```bash
bun run build --filter=dashboard
```
