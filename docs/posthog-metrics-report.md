# PostHog metrics report for the Notra dashboard

Date: 2026-08-30
Scope: `apps/dashboard` (GEO + Studio), plus the server surfaces that feed it (`apps/api`, `apps/agent`, `packages/ai`, `packages/geo-core`, workflows). Based on a full scan of the codebase and the current PostHog docs.

---

## 1. Where we are today

PostHog is installed in the dashboard but it is effectively a session-replay-only install.

| Fact | Evidence |
|---|---|
| `posthog-js@^1.399.2` is the only PostHog dependency in the whole repo. No `posthog-node`, no `@posthog/ai`, nothing in `apps/api`, `apps/agent`, `apps/web`, `apps/console`. | `apps/dashboard/package.json:93` |
| Init happens in `instrumentation-client.ts` with `autocapture: false`, `capture_pageview: false`, `capture_pageleave: false`. | `apps/dashboard/src/constants/posthog.ts:10-31` |
| Session replay is on, but with `maskTextSelector: "*"` and `maskAllInputs: true`, so recordings are almost fully redacted. | same file |
| `posthog.identify(userId)` and `posthog.reset()` are wired. No `posthog.group()`; org and project are invisible to PostHog. | `apps/dashboard/src/components/providers/posthog-identity.tsx` |
| A `before_send` hook strips query/hash from any URL-ish property. | `apps/dashboard/src/utils/posthog.ts:46` |
| There are zero `posthog.capture()` calls anywhere in the repo. | grep |
| Product analytics today is Databuddy: client script with `trackErrors`/`trackAttributes`, plus exactly three server events (`scheduled_content_created`, `scheduled_content_failed`, `scheduled_content_skipped`). | `apps/dashboard/src/utils/providers.tsx:69-84`, `apps/dashboard/src/lib/databuddy.ts` |
| Feature flags today are Databuddy flags: `iris`, `social-analytics`, `agent-readiness`, `geo-cursor`. | `apps/dashboard/src/lib/hooks/use-nav-visibility.ts`, `apps/dashboard/src/lib/geo/flag.ts` |
| LLM observability today is evlog (`createAILogger(log).wrap(model)`) draining to Axiom, plus OTel/TCC spans in production. Cost metering is Autumn `track()` at ~8 call sites. | `packages/ai/src/observability.ts`, `packages/ai/src/evlog.ts`, `apps/dashboard/src/instrumentation.ts` |
| `packages/analytics` is Tinybird for customer-facing analytics (social + GEO traffic). It is not an internal tracking layer. | `packages/analytics/src/tinybird/*` |

Net: every event in this document is net-new.

---

## 2. What PostHog can track, and how it maps to Notra

From the PostHog docs (product analytics, web analytics, session replay, error tracking, feature flags, experiments, surveys, AI observability, MCP analytics, data warehouse, revenue analytics, logs).

| PostHog product | What it gives us | Fit for Notra | Caveats found in the docs |
|---|---|---|---|
| Product analytics (custom events, funnels, retention, stickiness, lifecycle, paths) | Everything in section 5 of this doc. | Core. | Events should be `object_verb` and identified. Identified events are up to 4x the cost of anonymous ones; that is fine for a logged-in B2B app. `$set`/`$set_once` are not queryable on the event, only on the person. |
| Group analytics | Org-level and project-level metrics (accounts active, org retention, org funnels). | Essential. Notra is org-scoped and GEO is project-scoped. `organizations.id` is also the Autumn `customerId`, so org groups join cleanly to billing. | Group type limit is small per project (5). Use `organization` and `project`. Node `groupIdentify` without a `distinctId` creates a fake person per group; pass a stable one. |
| Web analytics | Visitors, sessions, bounce, entry paths, web vitals, channel attribution. | Useful for the dashboard once `$pageview` is on; the marketing site (`apps/web`) has no PostHog at all today. | Requires `$pageview` events. Pageviews are currently disabled. |
| Session replay | Replays linked to events, errors, LLM traces. | Already on. Needs sampling/trigger controls to be cost-sane. | Replays are 1-5 MB per session. If we proxy through Vercel that is Vercel egress. Current `maskTextSelector: "*"` makes replays mostly useless for qualitative review; consider masking only inputs and known-sensitive selectors. |
| Error tracking | `$exception` from client (`captureException`, error boundaries, `capture_exceptions`) and server (`onRequestError`, posthog-node). Source maps. | High value. No `error.tsx` or `global-error.tsx` exists in the dashboard today; `apps/api` errors are `console.error`. | `instrumentation.ts` already exports `onRequestError` from evlog; PostHog capture has to be added inside a wrapper, not replace it. |
| Feature flags | Server + client flags, group targeting, payloads, bootstrapping. | Direct 1:1 replacement for the four Databuddy flags. Server-side evaluation avoids flicker. | Bootstrapping requires the same `distinct_id` on client and server. Local evaluation needs a personal API key. |
| Experiments | Built on flags + existing events; funnel/mean/ratio metrics; Bayesian or frequentist. | Onboarding, pricing page, paywall copy, "Plan vs Write" default. | Needs the flag exposure event, which the SDK emits automatically. |
| Surveys | Popover or headless (API) surveys; targeting by events, properties, cohorts, flags; every answer is an event tied to person + replay. | NPS after first scan; churn reason on plan cancel; "did the article help" after GEO writer completes. | Surveys are lazy-loaded from PostHog's CDN; CSP must allow `*.posthog.com`. |
| AI observability (`$ai_generation`, `$ai_trace`, `$ai_span`, `$ai_session_id`) | Per-call model, tokens, latency, cost (auto-priced from OpenRouter data), tool calls, per-user and per-org attribution, sentiment evals. | Very high value: cost per org, cost per feature, cost per scan, failure rates. | Vercel AI SDK integration uses `PostHogSpanProcessor` on OTel and only supports AI SDK v5/v6. `apps/dashboard`, `apps/api`, `packages/ai`, `packages/geo-core` are on `ai@6.0.206` (works). `apps/agent` and `apps/onboarding-agent` are on `ai@^7` (Eve), so those need manual `$ai_generation` capture from Eve hooks. Custom properties go in `experimental_telemetry.metadata` prefixed `posthog_`. |
| MCP analytics (`$mcp_tool_call`, `$mcp_initialize`, `$mcp_tools_list`) | Per-tool calls, errors, p50/p95, harness breakdown (Claude Code, Cursor, etc.), intent clustering, sessions. | Notra ships MCP surfaces: the `@usenotra/geo` feedback tool, `usenotra/notra-mcp`, and the dashboard's own MCP integrations table `mcpSessionToolActivations`. | Requires wrapping the server with `@posthog/mcp`. Only servers we host can be instrumented. |
| Data warehouse | Stripe, Postgres, and other sources joinable with events in SQL; views and materialized views. | Join `organizations`, `projects`, `geoScans`, `posts` from Neon Postgres with PostHog events; Stripe source for revenue. | Postgres source is a managed connector; needs a read-only role. Autumn sits on Stripe, so the Stripe source works. |
| Revenue analytics | MRR, churn, LTV, growth accounting per customer/group. | Ready once Stripe is connected and `organizations.id` maps to the Stripe customer via Autumn metadata. | Beta. Customer linking from Stripe must be done manually (customer id or email). |
| Logs (OTLP) | Log search linked to replays, persons, traces. | We already have evlog to Axiom. Overlap; not a priority. | OTLP only. |
| Heatmaps, dead clicks, rage clicks | On by default with `defaults: "2026-05-30"` (rageclick, dead clicks). Heatmaps need `capture_heatmaps` or remote config. | Nice to have for the editor and onboarding. | Heatmaps need autocapture or at least `$pageview` with element tracking. |

Two more docs facts that matter for implementation:

- `tracing_headers: ["app.usenotra.com", "api.usenotra.com", "localhost"]` makes posthog-js attach `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` to our own fetches. Server events, errors and LLM traces can then be joined to the exact frontend session and replay. This is the single cheapest bridge between client and server.
- `@posthog/next` (identity sync, flag bootstrapping, proxy, error capture) is pre-release. Docs say use the manual setup in production. Stay on `instrumentation-client.ts` + `posthog-node`.

---

## 3. Foundations to fix before adding events

These are prerequisites; without them the event plan produces unattributable data.

1. Group identity. In `posthog-identity.tsx`, after `identify(userId)`, call `posthog.group("organization", organizationId, { name, slug, plan, created_at, heard_about })` and `posthog.group("project", projectId, { name, organization_id, is_sample })` from `useOrganizationsContext()` and `useGeoProjectScope()`. Server side, call `groupIdentify` in `createOrganizationAction` (`apps/dashboard/src/lib/organizations/actions.ts:199`) and `geo.projectsCreate`.
2. Pageviews. Turn `capture_pageview` on (or capture `$pageview` manually on route change with a slug-masked pathname; the masking logic already exists in `apps/dashboard/src/utils/databuddy.ts`). Keep `capture_pageleave` on too so bounce and duration work in web analytics.
3. Server client. Add `posthog-node` in a new `packages/ai/src/posthog.ts` mirroring `packages/ai/src/evlog.ts` (singleton, `flushAt: 1`/`flushInterval: 0` on serverless, `after(() => client.shutdown())` in route handlers). Read `X-POSTHOG-DISTINCT-ID` / `X-POSTHOG-SESSION-ID` from request headers and stamp `$session_id` on server events.
4. Person properties. On `ensureLocalUser` first-create (`apps/dashboard/src/lib/auth/sync.ts:157`) send `$set_once: { signup_method, signed_up_at, heard_about, db_source, landing_page_h1_variant }`; the signup form already threads these attribution params through the callback URL.
5. Error tracking. Add `error.tsx` + `global-error.tsx` with `posthog.captureException`, set `capture_exceptions: true`, and wrap the evlog `onRequestError` in `apps/dashboard/src/instrumentation.ts` to also call `captureException` with the distinct id from the header/cookie. In `apps/api`, do the same in `app.onError` (`apps/api/src/index.ts`). Upload source maps in the Vercel build.
6. Feature flags. Replace the four Databuddy flag reads (`lib/iris/flag.ts`, `lib/analytics/flag.ts`, `lib/geo/agent-readiness-flag.ts`, `lib/geo/cursor-flag.ts`, `use-nav-visibility.ts`) with `posthog-node` `isFeatureEnabled(key, distinctId, { groups: { organization } })` server-side and bootstrap the client. This also gives flag exposure events for experiments for free.
7. Replay budget. Keep replay on but add controls: sample ~20% of sessions, minimum duration 10s, and event triggers for `$exception`, `paywall_shown`, and `geo_scan_failed` so error sessions are always captured. Relax `maskTextSelector` to inputs and a sensitive-selector allowlist.
8. Reverse proxy. Route `/ingest/*` through a Vercel rewrite so ad blockers do not drop events. Be aware of replay egress cost.

---

## 4. Identity and property model

Person (user) properties: `email` domain only if needed, `name`, `signup_method` (`password` | `google` | `github` | `sso`), `signed_up_at`, `role` in active org, `heard_about_notra`, `db_source`, `landing_page_h1_variant`, `last_sidebar_mode`.

Organization group properties (from `organizations` + Autumn): `name`, `slug`, `created_at`, `plan_id` (`free` | `starter` | `growth` | `scale` | `_annual` variants | legacy `basic`/`pro`), `is_trial`, `has_paid_history`, `zdr_addon`, `ai_credits_balance_cents`, `member_count`, `project_count`, `onboarding_completed`, `onboarding_agent_ran`, `geo_configured`, `tracker_installed` (first ingest seen), `connected_integrations` (list), `heard_about_notra`.

Project group properties: `name`, `organization_id`, `is_sample`, `prompt_count`, `competitor_count`, `engine_count`, `scan_schedule_enabled`, `scan_interval_hours`, `languages`, `enforce_zdr`, `last_scan_at`.

Super properties on every client event: `organization_id`, `project_id`, `sidebar_mode` (`geo` | `studio`), `plan_id`, `geo_locked` (from `useHasGeoFeature().isLocked`).

Naming: `snake_case`, `object_verb`, past tense. Property names `snake_case`. Never send prompt text, competitor domains, or article bodies as properties; send ids, counts and enums (the `before_send` redactor only strips URLs).

---

## 5. Tracking plan

Legend: C = client (`posthog-js`), S = server (`posthog-node`), W = workflow step. File references are where the hook goes.

### 5.1 Auth and signup

| Event | Side | Where | Properties |
|---|---|---|---|
| `signup_started` | C | `components/auth/signup-form.tsx` on submit / social click | `method`, `db_source`, `landing_page_h1_variant` |
| `signup_completed` | S | `lib/auth/sync.ts` `ensureLocalUser` first-create branch | `method`, `email_domain_is_free` |
| `email_verification_required` / `email_verified` | S | `password-actions.ts` `signUpWithPasswordAction` / `verifyEmailCodeAction` | `method` |
| `login_succeeded` | S | `app/auth/callback/route.ts` `onSuccess` (`authenticationMethod`) | `method`, `is_first_login` |
| `login_failed` | C | `login/page.tsx` `?error=` banner render | `error_code` |
| `password_reset_requested` / `password_reset_completed` | S | `forgotPasswordAction` / `resetPasswordAction` | `outcome` |
| `logout` | C | `nav-user.tsx` sign out, then `posthog.reset()` | |
| `callback_routed` | S | `app/callback/page.tsx` | `destination` (`onboarding` \| `dashboard` \| `banned` \| `login` \| `return_to`) |

### 5.2 Onboarding funnel

Every onboarding step is reached by server redirect, so track on arrival, not on click.

| Event | Side | Where | Properties |
|---|---|---|---|
| `onboarding_step_viewed` | C | each `/onboarding/*` page | `step` (`workspace` \| `visibility` \| `competitors` \| `pricing`), `is_resuming` |
| `workspace_created` | S | `createOrganizationAction` | `has_logo`, `logo_source` (`upload` \| `domain_lookup`), `heard_about` |
| `onboarding_brand_analysis_started` / `_failed` | S | `workspace/actions.ts` `triggerOnboardingBrandAnalysis` | `reason` (`no-company-domain` \| `website-unreachable` \| `rate_limited`) |
| `onboarding_agent_started` / `_completed` / `_failed` | W | `workflows/onboarding-agent.ts`, `run-status.ts` hooks | `duration_ms`, `signup_credits_granted` |
| `website_discovered` / `website_discovery_failed` | C | `visibility-form.tsx` `useGeoDiscoverWebsite` | `prompt_count_suggested`, `duration_ms` |
| `onboarding_brand_saved` | S | `geo.onboardingBrand` | `alias_count`, `prompt_count` |
| `onboarding_step_skipped` | C | visibility "Skip for now" | `step` |
| `competitor_suggestions_loaded` | C | `competitors-form.tsx` | `suggestion_count`, `outcome` (`ok` \| `empty` \| `error`) |
| `onboarding_competitors_submitted` | C | `competitors-form.tsx` `launch` | `competitor_count`, `added_all`, `started_scan` (true when not locked) |
| `pricing_viewed` | C | `pricing-client.tsx` | `trial_available`, `has_paid_history` |
| `pricing_interval_toggled` / `zdr_addon_toggled` | C | same | `interval`, `enabled` |
| `plan_selected` | C | `handleSelectPlan` | `plan_id`, `interval`, `zdr`, `is_trial`, `surface` (`onboarding` \| `billing_page` \| `sidebar` \| `geo_paywall`) |
| `checkout_redirected` / `checkout_failed` | C | same | `plan_id` |
| `checkout_completed` | C+S | `settings/billing/success/page.tsx` render + Autumn handler | `plan_id`, `is_trial` |

Activation candidates to validate against retention later (see section 6): `geo_scan_completed` with ≥1 mention, `traffic_ingest_first_hit`, `content_generation_completed`, `member_invited`.

### 5.3 GEO

Scans and results:

| Event | Side | Where | Properties |
|---|---|---|---|
| `geo_scan_started` | S | `packages/geo-core/src/geo/programs.ts` `startGeoScan` | `trigger` (`manual` \| `hotkey` \| `onboarding` \| `gaps_empty` \| `schedule` \| `api`), `prompt_count`, `engine_count`, `language_count`, `is_first_scan`, `zdr_enforced` |
| `geo_scan_completed` / `geo_scan_failed` / `geo_scan_skipped` | W | `workflows/steps/geo-scan-steps.ts` next to `flushGeoLog` (mirror the existing `geo.scan.*` evlog taxonomy) | `duration_ms`, `checks_total`, `checks_succeeded`, `mention_rate`, `engines_dropped`, `retried`, `reason` |
| `geo_scan_retry_scheduled` | W | `retryGeoScanStep` path | `delay_ms` |
| `geo_sequence_run` | S | `geo.sequenceRun` | `turn_count`, `outcome`, `rate_limited` |
| `geo_overview_viewed` | C | `geo/page-client.tsx` | `has_data`, `range`, `tab` |
| `geo_range_changed` / `geo_tab_changed` | C | `geo-range-picker.tsx`, `geo-tabs.tsx` | `range_preset`, `is_custom`, `tab` |
| `geo_engine_family_opened` | C | `mention-rate-card.tsx` → sheet | `engine_family`, `mention_rate` |
| `geo_prompt_detail_opened` | C | `prompt-detail-dialog.tsx` | `surface` (`prompts_table` \| `engine_sheet` \| `gaps`), `engine` |
| `geo_share_of_voice_slice_clicked` | C | `share-of-voice-card.tsx` | `is_own_brand`, `is_other` |
| `geo_journey_opened` | C | `journeys-card.tsx` | |

Setup and configuration:

| Event | Side | Where | Properties |
|---|---|---|---|
| `geo_setup_empty_viewed` | C | `geo-setup-empty.tsx` | `page` |
| `geo_settings_saved` | S | `geo.settingsUpsert` (debounced autosave; emit server-side only when a diff exists) | `changed_fields`, `engine_count`, `language_count`, `schedule_enabled`, `interval_hours`, `enforce_zdr` |
| `geo_settings_save_failed` | C | `use-geo.ts:222` toast | |
| `geo_project_created` / `geo_project_switched` | C+S | `project-create-dialog.tsx`, `sidebar-project-switcher.tsx` | `project_count` |
| `geo_prompt_added` | S | `geo.promptsCreate` | `source` (`manual` \| `website_generate` \| `csv` \| `gsc_suggestion` \| `api`) |
| `geo_prompts_generated_from_website` | S | `geo.generateFromWebsite` | `prompt_count` |
| `geo_prompts_imported` / `geo_competitors_imported` | S | `promptsImport` / `competitorsImport` | `rows`, `inserted`, `duplicates`, `issues` |
| `geo_csv_template_downloaded` | C | `geo-csv-import-dialog.tsx:239` | `kind` |
| `geo_prompt_toggled` / `geo_prompt_deleted` | S | `promptsToggle` / `promptsDelete` | `enabled`, `count` |
| `geo_competitor_added` / `_updated` / `_deleted` | S | `competitorUpsert` / `competitorDelete` | `kind`, `source` (`manual` \| `onboarding_suggestion` \| `csv`), `competitor_count` |
| `geo_competitor_detail_viewed` | C | `competitor-detail-view.tsx` | `surface` (`page` \| `modal`) |
| `geo_conversation_created` / `_updated` / `_deleted` / `_run_now` | S | `sequences*` | `turn_count`, `enabled` |
| `geo_suggestion_accepted` / `_accepted_all` / `_dismissed` | S | `suggestionAccept` etc. | `count`, `impressions`, `position` |

Search Console:

| Event | Side | Where | Properties |
|---|---|---|---|
| `gsc_connect_started` | C | `search-console-card.tsx` connect link | `is_reconnect` |
| `gsc_connect_succeeded` / `gsc_connect_failed` | C | `use-gsc-connection-toast.ts` | `error_code` |
| `gsc_site_selected` / `gsc_disconnected` / `gsc_sync_requested` | S | `searchConsoleSelectSite` / `Disconnect` / `Sync` | `rate_limited` |
| `gsc_sync_completed` | W | `workflows/gsc-sync.ts` | `suggestions_created`, `duration_ms` |
| `gsc_card_dismissed` | C | `useGscCardDismissal` | |

Content gaps and writer:

| Event | Side | Where | Properties |
|---|---|---|---|
| `geo_gaps_viewed` | C | `gaps/page-client.tsx` | `tab`, `empty_kind` (`no-scan` \| `no-search-gaps` \| `no-matches` \| null), `gap_count` |
| `geo_gap_write_clicked` | C | `gaps-table.tsx` `WriteCell` | `source_kind` (`prompt` \| `search_console`), `has_existing_post`, `opportunity_bucket` |
| `geo_write_dialog_opened` | C | `write-dialog.tsx` | `entry` (`gap` \| `engine_sheet` \| `write_page` \| `nav_primary`) |
| `geo_brief_planned` | S | `geo.writerPlan` | `auto_approve`, `subtype`, `competitor_count`, `has_sitemap`, `rate_limited` |
| `geo_writer_started` | S | `geo.writerStart` | `brief_id` |
| `geo_writer_completed` / `geo_writer_failed` | W | `workflows/geo-writer.ts` `finishGeoWriter` / failure branches | `duration_ms`, `reason` (`credits_exhausted` \| `invalid_state` \| `duplicate_execution` \| `model_error`), `word_count` |
| `geo_writer_article_ready_viewed` | C | `writer-execute.tsx` `onArticleReady` | |
| `geo_sitemap_added` | S | sitemap create | |

AI traffic and tracker install:

| Event | Side | Where | Properties |
|---|---|---|---|
| `traffic_viewed` | C | `traffic/page-client.tsx` | `has_traffic`, `range` |
| `traffic_install_snippet_viewed` | C | `traffic-empty.tsx` / `geo-ingest-setup.tsx` | `framework`, `package_manager` |
| `traffic_install_snippet_copied` | C | `geo-ingest-setup.tsx:115` | `framework` |
| `traffic_ingest_first_hit` | S | `app/api/geo/ingest/route.ts` when the org/project has no prior ingest | `framework`, `sdk_version` |
| `traffic_ingest_received` (sampled or daily rollup, not per hit) | S | same | `agent_family`, `purpose` |
| `traffic_token_rotated` | S | `geo.ingestTokenRotate` | |
| `traffic_log_filter_changed` / `traffic_live_toggled` | C | `ai-traffic-log-card.tsx` | `filter`, `live` |

Agent readiness:

| Event | Side | Where | Properties |
|---|---|---|---|
| `agent_readiness_scan_started` | S | `geo.agentReadinessScan` | `is_rescan` |
| `agent_readiness_scan_completed` / `_failed` | W | `agent-readiness-steps.ts` | `score`, `check_count`, `error_kind` |
| `agent_readiness_fix_copied` | C | `readiness-checklist.tsx:47` | `check_id` |
| `agent_readiness_report_opened` | C | `readiness-score-card.tsx:184` | |

### 5.4 Studio content

| Event | Side | Where | Properties |
|---|---|---|---|
| `content_create_dialog_opened` | C | `create-content-dialog.tsx` | `entry` (`home` \| `content_list` \| `hotkey` \| `nav_primary`) |
| `content_create_step_completed` | C | step transitions | `step`, `format_count`, `repo_count`, `lookback`, `event_count` |
| `content_generation_requested` | S | `content.generate` | `format`, `voice_id`, `source_count`, `data_points` |
| `content_generation_denied` | S | `content.generate` `paymentRequired` | `reason` (`quota_exhausted` \| `insufficient_ai_credits` \| `no_entitlement`) |
| `content_generation_completed` / `_failed` / `_skipped` | W | `content-generation-steps.ts` `trackContentOutcome` (mirror the Databuddy events) | `source` (`schedule` \| `event` \| `on_demand`), `creation_mode`, `output_type`, `duration_ms`, `reason` |
| `content_opened` | C | `content/[id]/page-client.tsx` | `type`, `status`, `from_geo_writer` |
| `content_saved` | S | `content.update` (body changed) | `type`, `edit_count_session` |
| `content_published` / `content_unpublished` | S | `content.update` status | `type`, `surface` (`editor` \| `card`) |
| `content_deleted` | S | `content.delete` | `type` |
| `content_social_published` | S | `socialAccounts.publish` | `platform`, `from` (`editor` \| `chat_preview`) |
| `image_exported` | C | editor download/copy | `target` |
| `image_revised` | C | `tool-reviseImage` result applied | |
| `collection_renamed` / `collection_opened` | C+S | collection page | `post_count`, `is_generating` |

### 5.5 Chat and AI assistants

Product events (the LLM cost/latency side is section 5.9):

| Event | Side | Where | Properties |
|---|---|---|---|
| `chat_message_sent` | S | `app/api/organizations/[orgId]/chat/route.ts` after billing check | `chat_id`, `model`, `thinking_level`, `attachment_count`, `context_kinds`, `is_new_chat`, `billing_mode` (`unmetered` \| `ai_credits` \| `plan_included`), `transport` (`direct` \| `workflow`) |
| `chat_generation_blocked` | S | same route 403/409/503 branches | `code` (`USAGE_LIMIT_REACHED` \| `CHAT_READ_ONLY` \| `ALREADY_GENERATING` \| `BILLING_ERROR`) |
| `chat_generation_stopped` | S | `/stop` route | |
| `chat_message_edited` / `chat_retry` / `chat_branch_switched` | C | `chat/page-client.tsx` | |
| `chat_model_changed` / `chat_thinking_level_changed` | C | same | `model`, `level` |
| `chat_context_added` / `_removed` | C | same | `kind` (`github` \| `linear` \| `granola` \| `mcp`) |
| `chat_attachment_uploaded` | S | `upload.recordChatAttachment` | `mime`, `size_bucket` |
| `chat_tool_approval` | C | approval handlers | `tool`, `decision`, `relayed_to_slack` |
| `chat_draft_action` | C | draft previews | `action` (`approve` \| `deny` \| `save_draft` \| `save_published` \| `regenerate` \| `publish_social`), `type` |
| `content_agent_message_sent` | S | content chat route | `has_selection`, `context_count` |
| `content_agent_edit_applied` | C | `tool-editMarkdown` | |
| `command_palette_opened` / `_search` / `_result_selected` / `_ai_navigate` | C | `command-palette.tsx` | `source`, `query_length`, `result_count`, `kind`, `action`, `latency_ms` |

### 5.6 Brand, skills, automation, integrations, analytics, feedback, Iris

| Event | Side | Where | Properties |
|---|---|---|---|
| `brand_identity_created` / `_deleted` / `_default_set` | S | `brand.voices.*` | `identity_count` |
| `brand_analysis_started` / `_completed` / `_failed` | S+W | `brand.analysis.start`, `workflows/brand-analysis.ts` | `duration_ms`, `phase_failed` |
| `brand_guidelines_refreshed` | S | `brand.guidelines.refresh` | |
| `brand_reference_added` / `_import_tweets` / `_limit_reached` | S | `brand.references.*` incl. the `forbidden("Reference limit reached")` branch | `source`, `count` |
| `skill_created` / `_imported_from_url` / `_updated` / `_deleted` | S | `skills.*` | `has_frontmatter`, `source_host` |
| `event_trigger_created` / `_toggled` / `_deleted` / `_duplicate_rejected` | S | `automation.events.*` | `output_type`, `auto_publish`, `repo_count` |
| `schedule_created` / `_toggled` / `_deleted` / `_run_now` | S | `automation.schedules.*` | `output_type`, `frequency`, `auto_publish` |
| `onboarding_suggestion_used` / `_dismissed` | S | `onboarding.dismissSuggestion`, create-from-suggestion | `suggestion_kind` |
| `integration_connect_started` | C | integration cards / dialogs | `provider` (`github` \| `linear` \| `slack` \| `granola` \| `mcp` \| `mcp_store` \| `gsc` \| `x` \| `linkedin`) |
| `integration_connected` / `integration_connect_failed` | C+S | `use-*-connection-toast.ts` hooks + OAuth callbacks | `provider`, `error_code`, `auth_kind` (`oauth` \| `api_key` \| `headers` \| `public`) |
| `integration_toggled` / `integration_disconnected` | S | `integrations.*.update/delete` | `provider` |
| `github_repositories_selected` | S | `github.app.saveRepositories` | `repo_count` |
| `mcp_tools_refreshed` / `mcp_connection_tested` | S | `integrations.mcp.refreshTools/test` | `tool_count`, `outcome` |
| `slack_channel_configured` | S | `integrations.slack.update` | `kind` (`notifications` \| `access`) |
| `webhook_secret_regenerated` | S | `repositories.webhook.generateSecret` | |
| `social_account_connected` / `_disconnected` | S | `socialAccounts.*` | `platform` |
| `analytics_viewed` | C | `analytics-shell.tsx` | `state` (`ok` \| `no_accounts` \| `not_configured` \| `flag_off`) |
| `analytics_account_untracked` | S | `analytics.untrackAccount` | `bulk`, `count` |
| `agent_feedback_setup_opened` / `agent_feedback_status_changed` | C+S | feedback page | `status`, `resolved_streak` |
| `agent_feedback_received` | S | `apps/api` `submitOrganizationFeedback` | `kind`, `sentiment`, `classifier_label`, `via` (`public_slug` \| `token`) |
| `product_feedback_sent` | S | `feedback.submit` | `surface` (`header` \| `org_selector` \| `palette`) |
| `iris_started` / `_paused` / `_resumed` / `_run_now` | S | `iris.*` | `pause_reason` |
| `iris_run_completed` / `_noop` / `_failed` | W | `iris-steps.ts` `finalizeIrisRun` / `recordIrisNoOpRun` | `artifact_count`, `signal_count`, `cost_cents`, `gate_reason` |
| `iris_unavailable_viewed` | C | `iris-unavailable-state.tsx` | |

### 5.7 Billing, paywalls, and quota (revenue funnel)

| Event | Side | Where | Properties |
|---|---|---|---|
| `paywall_shown` | C | `geo-upgrade-gate.tsx`, `sidebar-trial-expired.tsx`, `sidebar-upgrade.tsx` render, `nav-lock-hint.tsx` hover | `kind` (`geo_locked` \| `trial_expired` \| `upgrade_card` \| `nav_lock`), `plan_id`, `route` |
| `paywall_dismissed` | C | `GeoUpgradeDialog` close | `kind` |
| `upgrade_clicked` | C | all `attach` callers | `surface`, `target_plan`, `interval`, `zdr` |
| `subscription_required_hit` | S | `assertActiveSubscription` throw sites (shared helper) | `procedure`, `plan_id` |
| `entitlement_denied` | S | `assertGeoEntitlement` 402, `apps/api` `subscriptionMiddleware`/`geoEntitlementMiddleware` | `feature`, `surface` (`dashboard` \| `api`) |
| `quota_exceeded` | S | `describeContentBillingDenial`, chat `USAGE_LIMIT_REACHED`, reference limit, member limit, log retention downgrade | `feature` (`long_form_posts` \| `social_posts` \| `image_generations` \| `ai_answers` \| `ai_credits` \| `references` \| `team_members`), `reason` |
| `credits_topup_opened` / `credits_topup_completed` | C | `credit-topup-content.tsx` | `amount_dollars`, `is_preset` |
| `signup_credits_granted` | W | `grant-signup-credits.ts` | `cents` |
| `zdr_addon_attached` / `_removed` | C+S | `zdr-addon-card.tsx` | `plan_id` |
| `customer_portal_opened` | C | billing + success pages | |
| `plan_changed` | S | `app/api/autumn/[...all]/route.ts` (attach/cancel pass-through) and/or Stripe warehouse | `from_plan`, `to_plan`, `is_trial`, `is_annual` |
| `member_invited` / `member_role_changed` / `member_removed` / `invite_cancelled` / `invite_resent` | S | `organizations/actions.ts` | `role`, `member_count`, `limit_hit` |
| `organization_deleted` / `account_deleted` | S | `user.deleteWithTransfers`, `deleteUserAction` | `had_paid_history` |

Also mirror Autumn usage: each `autumn.track` call for `ai_credits` should co-emit `ai_credits_charged` `{ cost_cents, source, model, billing_basis }` so spend can be broken down by org, feature, and cohort inside PostHog.

### 5.8 Public API, SDK, and MCP

| Event | Side | Where | Properties |
|---|---|---|---|
| `api_request` | S | new post-auth middleware in `apps/api/src/index.ts` | `route_id`, `method`, `status`, `latency_ms`, `key_id`, `scope`, `organization_id`, `sdk` (from UA) |
| `api_key_verified` / `api_key_rejected` | S | `middleware/auth.ts` after `verifyKey` | `unkey_code` |
| `api_rate_limited` | S | `utils/ratelimit.ts` | `route_id` |
| `api_paywalled` | S | 402/503 returns in subscription/geo-entitlement middleware | `feature` |
| `api_key_created` / `_updated` / `_deleted` | S | `apiKeys.*` (dashboard) | `permission_preset`, `scope_count`, `via_deeplink` |
| `sdk_feedback_tool_called` | S | `POST /v1/feedback/{slug}` | (same as `agent_feedback_received`) |
| `$mcp_tool_call`, `$mcp_initialize`, `$mcp_tools_list` | S | wrap `usenotra/notra-mcp` and the `@usenotra/geo` feedback MCP tool with `@posthog/mcp` | provided by SDK (`$mcp_tool_name`, `$mcp_client_name`, `$mcp_duration_ms`, `$mcp_is_error`, `$mcp_error_type`, `$mcp_intent`) |
| `mcp_tool_activated` (Notra as MCP client) | S | wherever `mcpSessionToolActivations` rows are written | `server_id`, `tool_name`, `outcome` |

### 5.9 LLM analytics (AI observability)

Goal: every model call becomes an `$ai_generation` with org, user, feature and session attribution, grouped into `$ai_trace` per request and `$ai_session_id` per conversation/scan/run.

Instrumentation points:

1. AI SDK v6 surfaces (dashboard, api, `packages/ai`, `packages/geo-core`). Add `PostHogSpanProcessor` from `@posthog/ai/otel` to the existing OTel setup: the `NodeSDK` in `apps/api/src/tcc.ts` and the `registerOTelTCC()` call in `apps/dashboard/src/instrumentation.ts` (it must also run outside production for this). Extend `buildExperimentalTelemetry` in `packages/ai/src/utils/tcc.ts` to add `posthog_distinct_id`, `posthog_organization_id`, `posthog_project_id`, `posthog_feature`, `posthog_billing_mode`, `posthog_gateway`, `posthog_zdr`, and `$ai_session_id`. This one change covers chat, content chat, background gen, GEO writer, GEO scan, discovery, GSC suggestions, judge, router, titles, classifiers, command palette, brand analysis, Iris planner.
2. Eve agents (`apps/agent`, `apps/onboarding-agent`, AI SDK v7). Emit `$ai_generation` manually with `posthog-node` from the `step.completed` / `turn.completed` / `turn.failed` hooks in `apps/agent/agent/lib/hooks/usage.ts` (usage and cost are already computed there), and `$ai_trace` per turn with `$ai_is_error` on failure.
3. Image generation (`packages/ai/src/agents/repo-image.ts`) and Iris capabilities: same OTel path, plus `$ai_span` around sandbox runs.

Key `$ai_session_id` choices: `chat:<chatId>` for chats, `scan:<scanId>` for GEO scans, `brief:<briefId>` for writer runs, `iris:<runId>`, `onboarding:<orgId>`.

Custom cost note: Notra applies a markup (`token-pricing.ts`) and OpenRouter ZDR routing; PostHog prices from OpenRouter data by default, so `$ai_total_cost_usd` will be provider cost, not billed cost. Keep `ai_credits_charged` (5.7) as the billed number and compare the two for gross margin per org.

### 5.10 Workflow lifecycle (generic)

Emit from `apps/dashboard/src/lib/workflows/start.ts` (13 starters) and from each workflow's terminal step:

`workflow_started` / `workflow_completed` / `workflow_failed` `{ workflow, run_id, organization_id, project_id, trigger, duration_ms, step_failed, reason }` for `geo-scan`, `geo-writer`, `agent-readiness`, `brand-analysis`, `brand-guidelines`, `chat`, `schedule-content`, `event-content`, `on-demand-content`, `iris-controller`, `onboarding-agent`, `gsc-sync`, `social-analytics-sync`, `content-email-digest`.

Also `workflow_paused` from `recordWorkflowPause` (content limit reached) and `workflow_duplicate_rejected` from `claimWorkflowExecution`.

### 5.11 Errors

`$exception` from: client error boundaries, `capture_exceptions`, dashboard `onRequestError`, `apps/api` `app.onError`, workflow step failures (`step-errors.ts`), agent `turn.failed`/`session.failed`. Tag with `organization_id`, `workflow`, `route_id`, and the frontend `$session_id` from tracing headers.

---

## 6. Metrics and dashboards to build from this

North star candidates (pick one per mode):

- GEO: weekly active projects with a completed scan (`geo_scan_completed`, group = project, weekly).
- Studio: weekly orgs with ≥1 `content_published` or `content_social_published`.

Dashboards:

1. Signup to first value funnel: `signup_completed` → `workspace_created` → `onboarding_brand_saved` → `onboarding_competitors_submitted` → `geo_scan_started` (is_first_scan) → `geo_scan_completed` (mention_rate > 0) → `plan_selected` → `checkout_completed`. Break down by `heard_about`, `db_source`, `landing_page_h1_variant`, `signup_method`.
2. Activation model: follow the retention-lift method (candidate early actions: first scan with mentions, tracker installed, first article written, first content published, teammate invited, integration connected). Pick the combination with the best week-4 retention lift and acceptable reach, then model `activated` per org with time-to-activate.
3. Retention: weekly retention on `geo_scan_completed` (group = organization) and on `content_published`; stickiness of `geo_overview_viewed`; lifecycle (new / returning / resurrecting / dormant) per org.
4. Revenue funnel and paywalls: `paywall_shown` by kind → `upgrade_clicked` → `checkout_completed`; `quota_exceeded` by feature vs `credits_topup_completed`; trial → paid conversion; churn from Stripe warehouse joined to last-30-day activity.
5. GEO health: scans per project per week, scan duration p50/p95, failure and skip rate by reason, engines dropped, ZDR unentitled hits, mention rate distribution, sequence run rate limits.
6. Writer funnel: `geo_gap_write_clicked` → `geo_brief_planned` → `geo_writer_started` → `geo_writer_completed` → `content_published`; time to publish; failure reasons.
7. Tracker adoption: `traffic_install_snippet_copied` → `traffic_ingest_first_hit` (time between, by framework), % of projects with traffic.
8. AI cost: `$ai_total_cost_usd` by org, feature and model; provider cost vs `ai_credits_charged`; cost per scan and per article; error rate and latency by model and gateway; token usage trends after model swaps.
9. Chat quality: messages per user per week, stop rate, retry rate, tool approval deny rate, `chat_generation_blocked` by code, attachments usage, model mix.
10. Integrations: connect started → connected by provider; failure codes; integrations per org vs retention.
11. API and MCP: requests by route and key, 4xx/5xx and 429 rates, 402 paywalled calls, `$mcp_tool_call` error rate and p95 per tool, harness breakdown.
12. Reliability: `$exception` by route/workflow, replays for errored sessions, `workflow_failed` by step.

Experiments worth running once flags are on PostHog: onboarding "Skip" placement, pricing default interval, paywall copy for `geo_locked`, default write mode (Plan vs Write), signup credits banner.

Surveys: NPS 7 days after first `geo_scan_completed`; "why are you pausing" on `iris_paused`; churn reason triggered from a cancellation flag; "was this article useful" after `geo_writer_completed`.

---

## 7. Privacy and cost guardrails

- Keep `person_profiles: "identified_only"` (default). Unauthenticated pages (login/signup) stay anonymous until identify.
- Never put prompt text, competitor names/domains, article bodies, chat content, or emails in event properties. LLM `$ai_input`/`$ai_output_choices` are captured by the OTel processor; set `posthog_privacy_mode` for ZDR-enforced orgs so inputs/outputs are dropped, and respect `enforceZdr` from `geoSettings`.
- The existing `before_send` URL redactor stays. Add a property allowlist per event in code (a typed `capture()` wrapper) so the redactor is a backstop, not the policy.
- Replay: sample 20%, min duration 10s, always-on for `$exception` / `paywall_shown` / `geo_scan_failed` triggers; block `img, video, canvas, iframe` as today; mask inputs; stop masking all text unless legal requires it.
- Throttle high-volume server events: `traffic_ingest_received` should be a daily rollup per project, not per hit (Tinybird already stores raw hits). `api_request` can be sampled for GET routes.
- Reverse proxy through Vercel increases egress; if replay volume is high, proxy only events and flags and send replay direct.

---

## 8. Suggested rollout

Phase 0 (foundations, ~1-2 days): groups, pageviews, tracing headers, `posthog-node` singleton, error tracking, source maps, replay controls, proxy. Typed `capture` wrapper with the event catalog as a union type in `types/analytics/posthog.ts` and event names in `constants/posthog-events.ts`.

Phase 1 (funnels that decide the business, ~2-3 days): auth + onboarding (5.1, 5.2), billing and paywalls (5.7), GEO scan lifecycle and setup (5.3 scans, settings, prompts, competitors), content generation outcome mirror (5.4 via `trackContentOutcome`).

Phase 2 (AI cost and quality, ~2 days): OTel span processor + telemetry metadata (5.9), Eve hook capture, `ai_credits_charged` co-emit, workflow lifecycle (5.10).

Phase 3 (breadth, ongoing): the rest of GEO (writer, traffic, GSC, readiness), chat, integrations, brand/skills/automation, Iris, feedback, API/MCP (5.5, 5.6, 5.8).

Phase 4 (platform): migrate the four Databuddy flags to PostHog flags with server evaluation and bootstrapping; connect the Stripe and Postgres warehouse sources; first experiments and surveys.

Decision to make early: Databuddy coexistence. Options are (a) keep Databuddy for `apps/web` marketing analytics and the cross-domain `signup_started` attribution while PostHog owns the dashboard, or (b) install PostHog on `apps/web` too and use one project so the marketing → product journey is a single funnel. (b) is what the PostHog docs recommend ("group products in one project"); it also removes the second flag provider.

---

## 9. File map of the seams (for whoever implements this)

| Seam | File |
|---|---|
| Client init / config | `apps/dashboard/src/instrumentation-client.ts`, `apps/dashboard/src/constants/posthog.ts` |
| Identify / groups | `apps/dashboard/src/components/providers/posthog-identity.tsx` |
| Server client (new) | `packages/ai/src/posthog.ts` (mirror `packages/ai/src/evlog.ts`) |
| User first-create | `apps/dashboard/src/lib/auth/sync.ts` `ensureLocalUser` |
| Org create / members | `apps/dashboard/src/lib/organizations/actions.ts` |
| Auth callback | `apps/dashboard/src/app/auth/callback/route.ts`, `app/callback/page.tsx` |
| Onboarding | `apps/dashboard/src/app/onboarding/**`, `workspace/actions.ts` |
| GEO router | `apps/dashboard/src/lib/orpc/routers/geo.ts` |
| GEO client hooks | `apps/dashboard/src/lib/hooks/use-geo.ts`, `use-geo-writer.ts`, `lib/db/geo-collections.ts` |
| GEO scan lifecycle | `apps/dashboard/src/workflows/steps/geo-scan-steps.ts`, `packages/geo-core/src/geo/programs.ts`, `packages/geo-core/src/utils/geo-log.ts` |
| Writer lifecycle | `apps/dashboard/src/workflows/geo-writer.ts`, `packages/geo-core/src/geo/writer.ts` |
| Tracker ingest | `apps/dashboard/src/app/api/geo/ingest/route.ts`, `lib/geo-ingest/pipeline.ts` |
| Content generation outcome | `apps/dashboard/src/workflows/steps/content-generation-steps.ts` `trackContentOutcome` |
| Workflow starters | `apps/dashboard/src/lib/workflows/start.ts` |
| Chat routes | `apps/dashboard/src/app/api/organizations/[organizationId]/chat/route.ts`, `.../content/[contentId]/chat/route.ts`, `workflows/steps/chat-steps.ts` |
| Billing gates | `apps/dashboard/src/lib/billing/subscription.ts`, `packages/ai/src/billing/{content-billing,chat-billing,features}.ts`, `app/api/autumn/[...all]/route.ts` |
| Paywall UI | `components/geo/geo-upgrade-gate.tsx`, `components/billing/geo-upgrade-dialog.tsx`, `components/dashboard/{sidebar-upgrade,sidebar-trial-expired,nav-lock-hint}.tsx` |
| LLM telemetry | `packages/ai/src/utils/tcc.ts` `buildExperimentalTelemetry`, `packages/ai/src/model.ts` `createModel`, `apps/dashboard/src/instrumentation.ts`, `apps/api/src/tcc.ts`, `apps/agent/agent/lib/hooks/usage.ts` |
| Feature flags | `apps/dashboard/src/lib/{iris,analytics}/flag.ts`, `lib/geo/{flag,agent-readiness-flag,cursor-flag}.ts`, `lib/hooks/use-nav-visibility.ts`, `components/providers/databuddy-flags-provider.tsx` |
| Public API | `apps/api/src/index.ts`, `middleware/{auth,subscription,geo-entitlement}.ts`, `utils/{ratelimit,feedback,logging}.ts` |
| Errors | `apps/dashboard/src/instrumentation.ts` `onRequestError`, `apps/api/src/index.ts` `onError`, new `app/error.tsx` + `app/global-error.tsx` |

---

## 10. Implementation status (2026-08-31)

Implemented in this branch:

- New workspace package `@notra/posthog` (`packages/posthog`): event catalog (`./events`), server client and capture helpers (`./server`), request-header context (`./request`). Consumed by `apps/dashboard`, `apps/api`, `apps/agent`, `apps/onboarding-agent`, `packages/ai`.
- LLM analytics (section 5.9) was implemented and then removed on request (2026-08-31): no `$ai_generation` / `$ai_trace` capture, no `withTracing` wrapping in `gateway()`, no `posthog` option on `RoutedModelOptions` / `CreateModelOptions`. LLM observability remains evlog to Axiom plus OTel/TCC; `ai_credits_charged` product events still capture cost and token counts per charge. If revisited: the middleware chokepoint approach in `gateway()` works on `ai@6`; the OTel span-processor route does not, because `@contextcompany/otel` owns the OTel registration and does not accept additional processors.
- Dashboard foundations: identify + `organization` and `project` groups (from the session and the `?project=` query), `$pageview` / `$pageleave` with the org slug masked as `[slug]`, `tracing_headers` for the app host, `capture_exceptions`, `error.tsx` / `global-error.tsx` boundaries, `onRequestError` and oRPC `onError` exception capture, `/ingest` reverse proxy rewrites, `person_profiles: identified_only`.
- Events from sections 5.1 to 5.11 (except 5.9) are wired on the client, in oRPC routers, route handlers, workflow steps, `apps/api` middleware/routes, and the Eve agent hooks. See the per-area helper modules under `apps/dashboard/src/lib/analytics/`, `apps/dashboard/src/constants/*-analytics.ts`, `apps/api/src/utils/analytics.ts`.

Deliberately left for a follow-up (needs a product or account-level decision, or PostHog UI configuration):

- Feature flags stay on Databuddy. Moving `iris`, `social-analytics`, `agent-readiness`, `geo-cursor` to PostHog requires creating those flags in PostHog first, otherwise every gated feature turns off in production.
- Databuddy stays installed on the dashboard and `apps/web`; PostHog is not installed on the marketing site, so the marketing to product funnel is still split across tools.
- Session replay sampling, minimum duration and event triggers are project settings in PostHog; masking was left as it was (all text masked).
- `plan_changed` is not emitted from the Autumn handler (no attach/cancel hook); use the Stripe warehouse source in PostHog for plan changes and revenue.
- Warehouse sources (Stripe, Postgres), surveys and experiments are PostHog UI setup.
- MCP analytics (`@posthog/mcp`) applies to `usenotra/notra-mcp`, which lives in a separate repository.
