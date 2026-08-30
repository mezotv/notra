# Execution Plan: Public API, MCP-Server & CLI

> Branch: `feat/public-api-mcp-cli` (Monorepo) + `usenotra/notra-mcp` (lokal: `~/coding/notra-mcp`)
> Stand: 2026-08-28 (v5 — finaler Execution Plan, **Reihenfolge: API zuerst, dann MCP**)
> Arbeitsprinzip: **Jede Phase endet mit einem Gate** — lokal bauen, Dev-Server starten,
> Test-Requests schicken, live verifizieren. Erst wenn das Gate grün ist, geht's weiter.

## Ziel & Leitentscheidung (unverändert)

Alles, was Notra kann (Content **und** GEO), wird programmatisch steuerbar: REST API → MCP →
CLI. **API-first**: `/v1` in `apps/api` ist die kanonische Schicht (Auth, Scopes, Billing,
Rate-Limits genau einmal). Der MCP-Server bleibt ein dünner Proxy darüber; die CLI wrappt den
SDK-Client. Tools werden **alle** registriert (kein Lazy-Loading serverseitig).

Reihenfolge-Begründung: Die MCP-GEO-Tools proxieren nur `/v1` — sie brauchen die API-Phasen
als Voraussetzung. Das SDK-v2-Upgrade ist davon unabhängig und kommt als Phase 4 direkt vor
den MCP-Tool-Arbeiten, damit die GEO-Tools gleich auf dem frischen Stand entstehen.

Ist-Zustand-Kurzfassung: `/v1` deckt nur Content ab, GEO existiert nur als Dashboard-oRPC.
`notra-mcp` = handgeschriebener Proxy (Express 5, SDK 1.29.0, zod 3, 30 Tools, In-Memory-
Sessions). GEO-Logik (`apps/dashboard/src/lib/geo/*`) ist Effect-basiert, Next-frei und
extrahierbar. Details: siehe Explorations-Reports / Plan v1–v3.

---

## Phase 1 — Monorepo-Fundament (Etappe 0) ← **START**

1. `packages/geo-core`: `apps/dashboard/src/lib/geo/*` extrahieren (Effect-Programme sind
   Next-frei); Workflow-Starts bleiben im Dashboard, getriggert über das bestehende
   `startDashboardWorkflow`-Muster (interne Route + `INTERNAL_WORKFLOW_SECRET`).
2. Scopes/Operations-Registry als Single Source of Truth (heute 3 handsynchrone Listen:
   API-Scopes, Dashboard-API-Key-UI, OpenAPI-Tags; MCP-`OAUTH_SCOPES` kommt in Phase 5 dazu).
3. Auth-Härtung in `apps/api`: JWTs ohne `aud` ablehnen; Scope-lose JWTs nicht mehr als
   `["*"]` behandeln (Entscheidung dokumentieren).

**Gate:** Dashboard läuft unverändert (`bun run dev`, GEO-Flows im UI klicken),
`check-types`/`check` grün, bestehende `/v1`-Smoke (Posts-Liste mit Dev-Key) unverändert.

## Phase 2 — GEO Public API, Kern (Etappe 1a)

Routen in `apps/api` (org-scoped, neue Scope-Paare aus der Registry): Projects (CRUD — Update/
Delete neu bauen), GEO-Settings, Prompts (CRUD/Toggle/CSV-Import), Sequences (+ `run`),
Competitors (CRUD/Import/Suggest), Scans (`POST` → interne Dashboard-Route, GET Status/Liste).
Querschnitt: `assertGeoEntitlement`-Middleware (Autumn `ai_answers`, 402), Rate-Limits analog
Dashboard, OpenAPI-Tags, Dashboard-API-Key-UI erweitern.

**Gate:** Integrationstests (403-Scope-Matrix, 402, Rate-Limit-Header) + Live-Loop gegen den
Dev-Server: Key mit GEO-Scopes erstellen → Prompt anlegen → Scan triggern → Status pollen —
alles per curl/httpie dokumentiert im PR.

## Phase 3 — GEO Public API, Rest (Etappe 1b)

Visibility-Reads (Overview/Timeseries/Prompt-Results/Competitor-Share), Content
Gaps/Briefs/Writer, Agent Readiness (Feature-Flag respektieren), AI-Traffic-Reads +
Ingest-Token-Rotation. Docs-Seiten (Mintlify zieht den Live-Spec).
**Gate:** wie Phase 2 + `openapi:check` in CI.

## Phase 4 — MCP-SDK v2 Upgrade (notra-mcp)

SDK `@modelcontextprotocol/sdk` 1.29.0 → Split-Packages **2.0.0** (`server`, `node`,
`express`, `core`, `client`) + zod 3.25 → **^4.2.0** (Pflicht; 4.0/4.1 verlieren
`.describe()`-Descriptions). Node 22 ✓ (v2 braucht ≥20). Nur 5 SDK-Importpfade in 12 Dateien.
Unabhängig von Phase 1–3 — kann bei Bedarf auch vorgezogen/parallel laufen.

**4.1 Baseline einfrieren (vor jeder Änderung)**
- `npm ci && npm run build && npm test` — grün dokumentieren.
- HTTP-Server lokal starten (`PORT=3000 NODE_ENV=development NOTRA_MCP_RESOURCE=http://localhost:3000 npm run start:http`).
- Smoke-Sequenz fahren und **`tools/list`-Output als Baseline speichern** (Dummy-Key
  `sk_dummy` reicht für initialize/tools/list — Auth klassifiziert Nicht-JWTs offline als
  API-Key; echter Key nur für Tool-Calls):
  initialize (Session-Id aus Response-Header) → `notifications/initialized` (202) →
  `tools/list` (30 Tools) → `tools/call list_posts` (echter Key, gegen `NOTRA_API_BASE`) →
  DELETE. Plus Negativ-Checks: ohne Auth → 401 + `WWW-Authenticate`, unbekannte Session → 401,
  `POST /register` → 404.

**4.2 Vorbereitende Einzelschritte (jeweils grün auf v1)**
1. `tsconfig` `Node16` → `NodeNext` (Repo nutzt schon überall `.js`-Extensions → drop-in).
2. **zod 3 → 4 isoliert**, vor dem SDK-Wechsel. Bekannter Hard-Breaker:
   `z.preprocess(...)` in `src/schemas/post-filters.ts` (comma-split der `list_posts`-Filter) —
   zod 4 kann Transforms nicht nach JSON Schema serialisieren. Fix: plain
   `z.array(z.enum(...))` im Schema, Comma-Split in den Handler verschieben; Tests auf die
   Split-Funktion umziehen. Danach: Fehlertext-Assertions in
   `generate-post-schema.test.ts` lockern (zod-4-Issue-Format).

**4.3 Codemod + manuelle Nacharbeit**
- `npx @modelcontextprotocol/codemod@latest v1-to-v2 .` (am Repo-Root), dann
  `grep -rn '@mcp-codemod-error' .` + `tsc --noEmit` + `npm run format`.
- Codemod erledigt: Imports, `package.json`-Swap, Symbol-Renames, Raw-Shape → `z.object()`-Wrap.
- **Manuell (bekannte Punkte):**
  - Transport: `StreamableHTTPServerTransport` → `NodeStreamableHTTPServerTransport` aus
    `@modelcontextprotocol/node`. Konstruktor-Optionen (`sessionIdGenerator`,
    `onsessioninitialized`) sind **unverändert** → unser Session-Store bleibt zunächst 1:1.
  - `@modelcontextprotocol/express` + `express`-Peer selbst in `package.json` eintragen.
  - Raw-Shapes sauber in **eigenes** `z.object()` wrappen (30 Tools; deprecated-Overload
    nutzt sonst das SDK-gebundelte zod → Registrierungsfehler bei Fremd-zod).
  - Tests: `InMemoryTransport`-Importe; unbekannter Tool-Name rejected jetzt mit
    `ProtocolError` statt `isError: true`.
- **Nicht anfassen:** der Security-Teil des Session-Stores (`http.ts` — HMAC-Token-Bindung,
  per-Request-JWT-Re-Verify mit User/Org-Pinning). Vorher einen Test schreiben:
  „Session von Token A ist mit Token B nicht nutzbar" — der darf durch die Migration nie rot
  werden. `createMcpHandler`/2026-Era und v2-Session-Abstraktionen sind **explizit Phase 6**,
  nicht jetzt.

**4.4 ⚠ Production-Gotcha: `createMcpExpressApp`-Defaults**
v2 (wie v1) validiert Host-Header: ohne Optionen ist nur localhost erlaubt → **jeder Request
mit `Host: mcp.usenotra.com` bekäme 403**. Neu in v2 ist zusätzlich Origin-Validation.
Konfiguration explizit setzen:
`createMcpExpressApp({ host: "0.0.0.0", allowedHosts: ["mcp.usenotra.com", "localhost"] })`
(+ `allowedOrigins` nur falls Browser-Clients direkt callen; `jsonLimit` prüfen, Default 100kb).
Außerdem: `req.body` weiterhin als drittes Argument an `handleRequest` geben (json-Middleware
hat den Stream schon konsumiert), und v2 antwortet neuerdings strikt `415` auf
Nicht-`application/json`-POSTs — für unsere SDK-Clients ok, in Docs erwähnen.

**Gate Phase 4 (lokal + dev, erst dann weiter):**
1. `npm run typecheck && npm test && npm run build` grün.
2. Smoke-Sequenz aus 4.1 identisch fahren; **`tools/list`-Diff gegen Baseline** — Schemas,
   Descriptions, Annotations (`destructiveHint: false` muss überleben), die 4 Empty-Shape-Tools
   und die 3 `list_posts`-Filter besonders prüfen.
3. Negativ-Checks identisch (401/`WWW-Authenticate`, Session-Bindung, 404 `/register`).
4. `npx @modelcontextprotocol/inspector` einmal gegen den lokalen Server (HTTP) und einmal
   gegen das stdio-Bin (`npm pack` → `node build/index.js` mit `NOTRA_API_KEY`).
5. Live-Test gegen den Dev-Server: `NOTRA_API_BASE=<dev-api>` + echter Dev-API-Key,
   `list_posts`/`get_post` end-to-end.
6. Danach: Version bump (package.json + server.json + server.ts, test-enforced), PR,
   Deploy wie gehabt — Jan approved Commits.

## Phase 5 — MCP: GEO-Tools + Drift-Fixes (Etappe 2a-Rest)

Auf dem frischen v2-Stand: `src/tools/geo-tools.ts` + `NotraClient`-Methoden für die
Phase-2/3-Endpoints; `EXPECTED_TOOL_COUNT` bump; `OAUTH_SCOPES` aus der Registry speisen.
Drift fixen: Docs-Tool-Namen (unprefixt!), `submit_feedback` dokumentieren, Versions-Sync der
Discovery-Dokumente, `apps/web`-Fallback-Liste aus echter Quelle, Array-Query-Serialisierung
(unmerged Branch `fix/posts-filter-query-serialization` sichten). Quick Wins:
Progress-Notifications für lange Calls, `structuredContent`/`outputSchema`, `http.ts`-Tests.
**Gate:** Inspector-Session mit GEO-Tool-Calls gegen Dev-API; Contract-Test Registry ↔ Tools
↔ Scopes grün.

## Phase 6 — Fusion (Etappe 2b, empfohlen: Option A)

notra-mcp als Workspace ins Monorepo (npm→Bun, oxlint/oxfmt, Typen aus der Registry statt
507 Zeilen Handkopie; stdio-Bin `@usenotra/mcp` bleibt Publish-Artefakt). Dabei evaluieren:
`createMcpHandler` (2026-Era, stateless per Request — würde den In-Memory-Session-Store
obsolet machen) vs. Redis-Session-Store; Auth ggf. auf v2-`requireBearerAuth` heben (Achtung:
Verifier muss v2-`OAuthError` werfen, sonst werden invalid Tokens zu 500ern).
**Gate:** identische Smoke-/Inspector-Suite gegen das im Monorepo gebaute Artefakt; ein
Turbo-CI für beide.

## Phase 7 — `notra` CLI (Etappe 3)

`packages/cli` → npm `notra` (citty, TS), `auth login` (API-Key, `cli`-Preset existiert),
Commands entlang `devtools/cli.mdx` + `geo`-Namespace (`notra geo scan|status|prompts import`),
`--json` für Scripting, intern über den generierten SDK-Client.
**Gate:** e2e gegen Dev-Server (Key → scan → status), `--json`-Snapshots.

## Phase 8 — SDK, Docs, Feinschliff (Etappe 4)

`@usenotra/sdk` aus OpenAPI generieren + publishen (CLI konsumiert ihn), GEO-API-Referenz,
MCP-Tool-Referenz generiert, CLI-Docs aus Draft-Status; Aufräumen (`editor-chat`-Dead-Code,
`maxRuntimeTools`); später: `packages/ai`-MCP-Client auf `@modelcontextprotocol/client` v2.

---

## Teststrategie (Kurzform, Details siehe v3)

1. **Unit**: Vitest beidseitig; Lücke `http.ts` schließen (Session-Binding-Test **vor**
   Phase 4.3, siehe oben).
2. **Contract**: Registry-getriebene Assertions Route ↔ Scope ↔ OpenAPI ↔ Tool ↔ Docs;
   OpenAPI-Snapshot eingecheckt; Versions-Sync-Tests.
3. **Integration**: `apps/api` gegen lokale Postgres (403/402-Matrix, Rate-Limit-Header);
   notra-mcp mit echtem v2-Client in-process (`handler.fetch`-Pattern) bzw. gegen gestubbte
   API; CLI mit gemockten HTTP-Antworten.
4. **Smoke/E2E**: die Phase-4-curl-Sequenz als Script im Repo; Dev-Server-Loop pro Phase-Gate;
   Inspector manuell pro MCP-Release; Staging-Durchstich API+MCP (`geo scan` → poll → read)
   nightly/vor Releases.

## Offen (Feedback, blockiert Phase 1 nicht)

1. Scope-Granularität GEO: feingranular (8 Paare) vs. `geo.read`/`geo.write`? (nötig ab Phase 2)
2. Databuddy-Flags für API/MCP/CLI-Caller? (nötig ab Phase 3, Agent Readiness)
3. Go für Fusion Option A? (nötig ab Phase 6)
4. CLI-Framework-Präferenz? (nötig ab Phase 7; Vorschlag: TS + citty)
