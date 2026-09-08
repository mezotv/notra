# API Effect adoption

## Architecture and scope

The public API is Hono/OpenAPI (`apps/api/src/index.ts`). The dashboard has
Next route handlers and oRPC (`apps/dashboard/src/lib/orpc`). Shared Zod
contracts live in `packages/schemas`; GEO domain programs already live in
`packages/geo-core`. Effect is pinned to **4.0.0-rc.112**: use `Effect.catch`
and `Effect.result`, not v3's `Effect.catchAll` or `Effect.either`.

This change expands Effect in billing and Skills CRUD and hardens GEO scan
finalization. Internal dashboard requests use the shared Effect service.
It is not a wholesale rewrite of every endpoint and makes no performance claim.

The [Kit Langton Effect skill](https://skills.sh/kitlangton/skills/effect) is
installed project-locally as `.agents/skills/using-effect`, including its branch
references. Its metadata records the imported upstream revision.

| Area | Current implementation / decision |
| --- | --- |
| Authentication, OAuth scopes, discovery, legacy redirects | Keep the current transport and permission registry. Do not move authorization after domain work. |
| Subscription and GEO entitlement | New `apps/api/src/programs/{subscription,geo-entitlement}.ts` programs with typed billing failures and injectable billing calls. Middleware owns HTTP, analytics, and configuration policy. |
| Internal dashboard requests | Use `InternalDashboardService` in `apps/api/src/lib/internal-dashboard.ts`, including its shared response, adapter, and timeout errors. |
| Skills CRUD | All five operations use `apps/api/src/programs/skills.ts`. Programs own database operations and domain refusals; routes retain OpenAPI, validation, serialization, and status mapping. |
| GEO projects, prompts, scans, sequences, briefs, settings, visibility, traffic, competitors, readiness | Retain existing geo-core programs and `runGeoEffect` / `runRemoteGeoEffect` transport mapping. The shared internal request adapter now executes through Effect. |
| Posts, brand identities, integrations, chats, agent chats, feedback, schedules, event triggers | Remain mixed Promise-based routes. Call sites using the internal dashboard adapter benefit without changing their contracts. Further extraction should be per domain, with HTTP characterization tests first. |
| Dashboard oRPC and internal routes | Keep existing `runOrpcEffect`, GEO handlers, and shared schemas. No second domain framework or wholesale transport replacement. |

## Rules for subsequent API work

- Compose programs with `Effect.gen` / `Effect.fn`. Run Effects at transport
  boundaries rather than converting back to Promises between every step.
- Use `Schema.TaggedError` for expected typed failures, with `Schema.Defect()`
  for original infrastructure causes. Retain original causes for
  infrastructure failures; do not turn a database outage into a 404 or expose
  internal messages in client responses.
- Keep organization predicates on every lookup/update/delete, and derive
  request types from the shared schemas.
- Do not retry paid POSTs or database writes automatically. An aborted request
  does not prove that the remote operation stopped or was not billed.
- Forward cancellation signals to cancellable I/O. The internal request signal
  covers both fetch and body consumption. Its timeout remains opt-in; paid
  synchronous GEO operations keep their existing mandatory timeout and 409
  response advising against repetition.
- Do not parallelize dependent operations. A paid subscription must still
  short-circuit the credits check. GEO entitlement checks presence of a balance,
  including zero, not remaining quota.
- Keep `next()` outside billing failure handling. GET/DELETE remain unrestricted
  by subscription middleware, while GEO still gates reads and deletes.

## Skill alignment and deliberate integration choices

- The internal transport is a required `Context.Service`, provided by
  `internalDashboardLive`. Its secret is read through `Config.redacted`, not directly
  from the process inside the request program. Test configuration can be
  provided through `ConfigProvider` without changing the process environment.
- Internal requests have a named `Effect.fn` boundary. Timeout
  policy uses `Effect.timeoutOrElse`; interrupting it aborts the native fetch
  and body read.
- Skill update timestamps use clock-backed `DateTime.now`.
- Shared Zod/OpenAPI contracts and typed Drizzle queries stay authoritative.
  They are established project conventions, not parallel Effect schemas or
  a reason to replace the HTTP/database stack.
- Native fetch remains confined to the platform adapter. The upstream service
  maps transport and decoding failures to shared adapter errors. No unstable HTTP
  client migration or implicit retry is introduced.
- Bun remains the test runner for the existing suites.

## Verification

Run from the repository root with Bun 1.4.0:

```sh
bun run test --filter=api
bun run test --filter=@notra/geo-core
bun run check-types --filter=api
bun run build --filter=api
bun run check
```

The existing API service and GEO suites are not live provider or production
end-to-end tests. The additional tests written during this Effect adoption
are not included in the repository.

## Daily GEO scan reliability

Durable scheduling and batch orchestration remain in the Workflow SDK; Effect
owns operations within steps rather than replacing durable sleeps with in-memory
timers. Failed claim renewal now stops new batches and drains existing batches
before finalization, including their persisted results in the totals. Failure
before the first batch must not wait forever on an empty `Promise.race`.

The conditional terminal scan-status write retries through Effect Schedule with
100/200/400 ms backoff (three retries). This boundary is idempotent even when the
database committed but its reply was lost; terminal verdicts cannot be overwritten.
Retries do not replay model calls or billing. Existing finalizer logging and the
stale-row sweep remain the fallback after exhaustion.

```sh
bun test apps/dashboard/tests/geo-scan-workflow.test.ts apps/dashboard/tests/geo-scan-cron.test.ts
bun run check-types --filter=@notra/geo-core --filter=dashboard
```

These checks do not establish production uptime. In particular, cron currently
advances the next tick before hand-off; a rejected hand-off waits until the next
configured interval. Billing finalization failures are still logged and suppressed.
Changing those policies requires durable reconciliation and proven billing
idempotency, not broad retries around a paid scan.
