# @notra/beacon

Edge-safe detection of AI-agent traffic for Next.js. Classifies incoming requests
against a sourced signature table and reports matches to an ingest endpoint without
ever blocking or failing the request.

Zero dependencies. No Node APIs, so it runs in middleware on the edge runtime.

## Install

```bash
bun add @notra/beacon
```

## Usage

```ts
// middleware.ts (proxy.ts on Next.js 16)
import { createBeaconMiddleware } from "@notra/beacon/middleware";
import { NextResponse } from "next/server";

const beacon = createBeaconMiddleware({
  ingestUrl: "https://app.usenotra.com/api/beacon",
  token: process.env.BEACON_ORG_TOKEN ?? "",
  organizationId: process.env.BEACON_ORG_ID ?? "",
});

export function middleware(request: Request) {
  beacon(request);
  return NextResponse.next();
}
```

`beacon(request)` returns the `BeaconMatch` it detected (or `null`) and schedules the
report as a side effect. Pass a context with `waitUntil` as the second argument when
you have one, so the report survives the response.

## API

### `classifyRequest(headers: Headers, ip?: string): BeaconMatch | null`

Pure. Case-insensitive substring match of the `User-Agent` header against
`BEACON_SIGNATURES`. Returns `{ agent, vendor, category, confidence }` or `null`. The
`ip` argument is accepted for forward compatibility with IP-range verification and is
currently unused.

### `classifyUserAgent(userAgent: string): BeaconMatch | null`

The same match against a raw string.

### `createBeaconMiddleware(config): (request, context?) => BeaconMatch | null`

Config:

| Field | Required | Meaning |
| --- | --- | --- |
| `ingestUrl` | yes | Where to POST the event |
| `token` | yes | Per-organization ingest token |
| `organizationId` | yes | Organization the hit belongs to |
| `sample` | no | 0..1 sample rate, default 1 |
| `fetchImpl` | no | Injectable `fetch`, for tests |

### `reportAiHit(config, event, context?): void`

Fire-and-forget POST for manual use. Never throws.

### Categories

- `training-crawler` — collects pages for model training corpora
- `search-index` — builds the index an AI answer engine searches
- `assistant-browse` — fetched while an assistant was answering someone

An `assistant-browse` hit means a page was fetched during an answer. It is not proof
the page was cited.

## Signature provenance

Every signature carries a `source` URL and a `confidence` of `verified`, `reported`, or
`heuristic`. See [SOURCES.md](./SOURCES.md), which also documents the agents that are
deliberately **not** in the table because they cannot be honestly detected by
user-agent, including Cursor, ChatGPT Atlas, `Google-Extended` and `Applebot-Extended`.

User-agent matching is spoofable. The `verification` field on each signature points at
the operator's published IP-range list or reverse-DNS method where one exists.
