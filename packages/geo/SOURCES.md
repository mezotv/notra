# AI agent signature evidence

This is the audit trail for `AI_AGENT_SIGNATURES` in
[`src/signatures.ts`](./src/signatures.ts). The table below mirrors every shipped
signature. A token should not be added to the code unless its evidence is recorded
here.

## How to read this file

The classifier performs a case-insensitive substring match against the
`User-Agent` header and returns the first matching signature. A signature may set
`match: "exact"`, in which case the trimmed, lowercased header must equal the token;
this is used for one-word user agents such as `Google` that would otherwise swallow
unrelated tokens (`Googlebot`, `GoogleOther`, `Google-Agent`).

Confidence describes the evidence for the token and category:

- **verified** — the operator publishes the HTTP user-agent token and describes a
  function that directly supports the assigned category.
- **reported** — the token comes from a controlled header capture, a credible
  server-log study, or a third-party catalog rather than vendor documentation.
- **heuristic** — the token is real, but treating it as AI traffic or assigning it
  to the selected category requires an inference.

Confidence does not prove that a particular request is genuine. User-agent strings
are freely spoofable. The **Origin check** column records a vendor-published IP list
or verification method when one exists; `@usenotra/geo` does not currently perform
those checks.

## Audit snapshot

Last fully audited: **2026-08-22** (previous full audit 2026-08-05).

- 2026-08-30: added Parallel's vendor-documented `ShapBot` search crawler and
  published IP list plus its user-triggered `Shap-User` fetcher. Split Exa's
  vendor-documented, Web Bot Auth-signed `ExaSearchBot` from the legacy reported
  `ExaBot` token. Reclassified `FirecrawlAgent` as heuristic using Firecrawl's
  official scraping documentation; Firecrawl explicitly publishes no fixed crawler
  IPs and does not document the search-index purpose directly.
- 2026-08-22: re-checked OpenAI, Meta, Amazon, Google (user-triggered fetchers and
  special-case crawlers), Perplexity, Ai2, Mozilla Tabstack and Cloudflare AutoRAG
  documentation, plus the `ai-robots-txt` catalog. Added eight vendor-documented
  tokens (`meta-webindexer`, `meta-externalads`, `Amzn-SearchBot`, `Amzn-User`,
  `Google-Agent`, `Google-GeminiNotebook`, `Mozilla-Tabstack`, `AI2Bot`), two
  controlled-capture tokens (`Google` exact for the Gemini app, `opencode` exact for
  OpenCode's fallback) and ten `reported` catalog tokens for major AI assistants and
  AI data providers. OpenAI, Anthropic and Perplexity publish no new tokens since the
  previous audit; `OAI-AdsBot` and Meta's crawlers were explicitly re-verified.
- Total shipped signatures: 66.

- All 63 signatures shipped at the full audit and every matched token were checked
  against the cited evidence below.
- Every cited source was reachable during the audit. Fourteen machine-readable
  origin endpoints returned parseable JSON with non-empty keys or prefixes; Amazon's
  separately published HTML IP list was also reachable and non-empty.
- The audit corrected Google's crawler class and IP list, corrected Diffbot's
  category, separated two different Gemini CLI signatures, and downgraded four
  non-AI-specific crawlers from `verified` to `heuristic`.
- `reported` and `heuristic` mean exactly that: those matches are useful attribution
  leads, not authenticated proof of the caller's identity or purpose.

## Shipped signatures

| Agent | Vendor | Category | Matched token | Confidence | Source | Origin check |
| --- | --- | --- | --- | --- | --- | --- |
| GPTBot | OpenAI | training-crawler | `GPTBot` | verified | [OpenAI bot docs](https://developers.openai.com/api/docs/bots) | [IP ranges](https://openai.com/gptbot.json) |
| OAI-SearchBot | OpenAI | search-index | `OAI-SearchBot` | verified | [OpenAI bot docs](https://developers.openai.com/api/docs/bots) | [IP ranges](https://openai.com/searchbot.json) |
| ChatGPT-User | OpenAI | assistant-browse | `ChatGPT-User` | verified | [OpenAI bot docs](https://developers.openai.com/api/docs/bots) | [IP ranges](https://openai.com/chatgpt-user.json) |
| OAI-AdsBot | OpenAI | search-index | `OAI-AdsBot` | verified | [OpenAI bot docs](https://developers.openai.com/api/docs/bots) | [IP ranges](https://openai.com/adsbot.json) |
| Claude Code | Anthropic | assistant-browse | `claude-code/` | reported | [Crawler UA catalog](https://github.com/monperrus/crawler-user-agents) | — |
| Claude-SearchBot | Anthropic | search-index | `Claude-SearchBot` | verified | [Anthropic bot docs](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | [IP ranges](https://claude.com/crawling/bots.json) |
| Claude-User | Anthropic | assistant-browse | `Claude-User` | verified | [Anthropic bot docs](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | [IP ranges](https://claude.com/crawling/bots.json) |
| ClaudeBot | Anthropic | training-crawler | `ClaudeBot` | verified | [Anthropic bot docs](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | [IP ranges](https://claude.com/crawling/bots.json) |
| anthropic-ai | Anthropic | training-crawler | `anthropic-ai` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| claude-web | Anthropic | assistant-browse | `claude-web` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| PerplexityBot | Perplexity | search-index | `PerplexityBot` | verified | [Perplexity bot docs](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | [IP ranges](https://www.perplexity.ai/perplexitybot.json) |
| Perplexity-User | Perplexity | assistant-browse | `Perplexity-User` | verified | [Perplexity bot docs](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | [IP ranges](https://www.perplexity.ai/perplexity-user.json) |
| Google-CloudVertexBot | Google | search-index | `Google-CloudVertexBot` | verified | [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | [Common-crawler IP ranges](https://developers.google.com/static/crawling/ipranges/common-crawlers.json) |
| GoogleOther-Image | Google | training-crawler | `GoogleOther-Image` | heuristic | [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | [Common-crawler IP ranges](https://developers.google.com/static/crawling/ipranges/common-crawlers.json) |
| GoogleOther-Video | Google | training-crawler | `GoogleOther-Video` | heuristic | [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | [Common-crawler IP ranges](https://developers.google.com/static/crawling/ipranges/common-crawlers.json) |
| GoogleOther | Google | training-crawler | `GoogleOther` | heuristic | [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | [Common-crawler IP ranges](https://developers.google.com/static/crawling/ipranges/common-crawlers.json) |
| Bytespider | ByteDance | training-crawler | `Bytespider` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| Amazonbot | Amazon | training-crawler | `Amazonbot` | verified | [Amazonbot docs](https://developer.amazon.com/amazonbot) | [IP ranges](https://developer.amazon.com/amazonbot/ip-addresses/) |
| Amzn-SearchBot | Amazon | search-index | `Amzn-SearchBot` | verified | [Amazonbot docs](https://developer.amazon.com/amazonbot) | [IP ranges](https://developer.amazon.com/amazonbot/searchbot-ip-addresses/) |
| Amzn-User | Amazon | assistant-browse | `Amzn-User` | verified | [Amazonbot docs](https://developer.amazon.com/amazonbot) | [IP ranges](https://developer.amazon.com/amazonbot/live-ip-addresses/) |
| Applebot | Apple | search-index | `Applebot/` | verified | [Applebot docs](https://support.apple.com/en-us/119829) | [IP ranges](https://search.developer.apple.com/applebot.json) |
| cohere-training-data-crawler | Cohere | training-crawler | `cohere-training-data-crawler` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| cohere-ai | Cohere | assistant-browse | `cohere-ai` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| meta-externalagent | Meta | training-crawler | `meta-externalagent` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
| meta-externalfetcher | Meta | assistant-browse | `meta-externalfetcher` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
| meta-webindexer | Meta | search-index | `meta-webindexer` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
| meta-externalads | Meta | search-index | `meta-externalads` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
| FacebookBot | Meta | training-crawler | `FacebookBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| DuckAssistBot | DuckDuckGo | assistant-browse | `DuckAssistBot` | verified | [DuckAssistBot docs](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/) | [IP ranges](https://duckduckgo.com/duckassistbot.json) |
| LinerBot | Liner | search-index | `LinerBot` | verified | [LinerBot docs](https://docs.getliner.com/docs/linerbot) | [IP ranges](https://docs.getliner.com/linerbot.json) |
| YouBot | You.com | search-index | `YouBot` | verified | [YouBot docs](https://you.com/docs/youbot) | [Web Bot Auth keys](https://you.com/.well-known/http-message-signatures-directory) |
| MistralAI-User | Mistral | assistant-browse | `MistralAI-User` | verified | [Mistral bot docs](https://docs.mistral.ai/robots) | [IP ranges](https://mistral.ai/mistralai-user-ips.json) |
| CCBot | Common Crawl | training-crawler | `CCBot` | heuristic | [CCBot docs](https://commoncrawl.org/ccbot) | [IP ranges](https://index.commoncrawl.org/ccbot.json) |
| Diffbot | Diffbot | search-index | `Diffbot` | verified | [Diffbot robots FAQ](https://www.diffbot.com/docs/crawl/faq/robots-txt) | — |
| Timpibot | Timpi | training-crawler | `Timpibot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| Devin | Cognition | assistant-browse | `Devin/` | reported | [Cloudflare Devin record](https://radar.cloudflare.com/bots/directory/devin) | — |
| Gemini CLI | Google | assistant-browse | `GoogleAgent-URLContext` | reported | [Controlled header study](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) | — |
| Gemini CLI (legacy) | Google | assistant-browse | `Google-Gemini-CLI` | reported | [Known Agents entry](https://knownagents.com/agents/google-gemini-cli) | — |
| Google-Agent | Google | assistant-browse | `Google-Agent` | verified | [Google user-triggered fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers) | [Agent IP ranges](https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json) |
| Google-GeminiNotebook | Google | assistant-browse | `Google-GeminiNotebook` | verified | [Google user-triggered fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers) | [Fetcher IP ranges](https://developers.google.com/static/crawling/ipranges/user-triggered-fetchers-google.json) |
| Gemini | Google | assistant-browse | `Google` (exact) | reported | Controlled capture 2026-08-22 (see below) | — |
| Cursor | Anysphere | assistant-browse | `Cursor/` | reported | [Controlled test; vendor download](https://cursor.com/download) | — |
| OpenCode | OpenCode | assistant-browse | `opencode` (exact) | reported | [OpenCode source](https://github.com/sst/opencode) (webfetch fallback, see below) | — |
| Cline | Cline Bot | assistant-browse | `Mozilla/5.0 (compatible; AgentBot/1.0)`<br>`VSCodeExtension/1.0; +https://cline.bot` | reported | [Cline link-preview source](https://github.com/cline/cline/blob/main/apps/vscode/src/integrations/misc/link-preview.ts) | — |
| Trae-Agent | ByteDance | assistant-browse | `Trae-Agent` | reported | [Known Agents entry](https://knownagents.com/agents/trae) | — |
| omgili | Webz.io | training-crawler | `omgilibot`<br>`omgili` | heuristic | [Webz.io bot docs](https://webz.io/blog/web-data/what-is-the-omgili-bot-and-why-is-it-crawling-your-website/) | — |
| Mozilla Tabstack | Mozilla | assistant-browse | `Mozilla-Tabstack` | verified | [Tabstack access docs](https://docs.tabstack.ai/trust/controlling-access) | — |
| AI2Bot | Ai2 | training-crawler | `AI2Bot` | verified | [Ai2 crawler notice](https://allenai.org/crawler) | — |
| Kimi-User | Moonshot AI | assistant-browse | `Kimi-User` | verified | [Kimi crawler policy](https://www.kimi.ai/policies/kimi-crawlers) | [IP ranges](https://www.kimi.ai/policies/kimi-user.json) |
| KimiBot | Moonshot AI | training-crawler | `KimiBot` | verified | [Kimi crawler policy](https://www.kimi.ai/policies/kimi-crawlers) | [IP ranges](https://www.kimi.ai/policies/kimibot.json) |
| Kimi-SearchBot | Moonshot AI | search-index | `Kimi-SearchBot` | verified | [Kimi crawler policy](https://www.kimi.ai/policies/kimi-crawlers) | [IP ranges](https://www.kimi.ai/policies/kimi-searchbot.json) |
| ChatGLM-Spider | Zhipu AI | training-crawler | `ChatGLM-Spider` | reported | [Known Agents entry](https://knownagents.com/agents/chatglm-spider) | — |
| TongyiBot | Alibaba | assistant-browse | `TongyiBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| YiyanBot | Baidu | assistant-browse | `YiyanBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| Manus-User | Butterfly Effect | assistant-browse | `Manus-User` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| kagi-fetcher | Kagi | assistant-browse | `kagi-fetcher` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| DeepSeekBot | DeepSeek | training-crawler | `DeepSeekBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| TikTokSpider | ByteDance | training-crawler | `TikTokSpider` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| PanguBot | Huawei | training-crawler | `PanguBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| Cloudflare-AutoRAG | Cloudflare | search-index | `Cloudflare-AutoRAG` | reported | [AutoRAG website source docs](https://developers.cloudflare.com/autorag/configuration/data-source/website/) (bot directory id 122933950; token from catalog) | — |
| ExaSearchBot | Exa | search-index | `ExaSearchBot` | verified | [Exa crawler docs](https://crawler.exa.ai/) | [Web Bot Auth key directory](https://crawler.exa.ai/.well-known/http-message-signatures-directory) |
| ExaBot | Exa | search-index | `ExaBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| ShapBot | Parallel | search-index | `ShapBot` | verified | [Parallel crawler docs](https://docs.parallel.ai/resources/crawler) | [IP ranges](https://docs.parallel.ai/resources/shapbot.json) |
| Shap-User | Parallel | assistant-browse | `Shap-User` | verified | [Parallel bot docs](https://parallel.ai/parallel-web-systems-bots) | — |
| TavilyBot | Tavily | search-index | `TavilyBot` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| FirecrawlAgent | Firecrawl | search-index | `FirecrawlAgent` | heuristic | [Firecrawl scraping guide](https://docs.firecrawl.dev/advanced-scraping-guide) | No fixed outbound IPs |

## Matching and ordering notes

- `Claude Code` appears before `Claude-User` because current Claude Code user agents
  may contain both tokens. This preserves the more specific label.
- `GoogleOther-Image` and `GoogleOther-Video` appear before `GoogleOther` for the
  same reason.
- `OAI-AdsBot` is categorized as `search-index` because the type system has no
  ad-safety category. OpenAI describes it as a landing-page checker, not a training
  crawler.
- `Google-CloudVertexBot` is a common crawler for indexes built by site owners for
  Vertex AI Agents. Google does not describe it as a model-training crawler.
- The three `GoogleOther` variants are heuristic. Google explicitly says they are
  generic crawlers with no affected product; their use for AI training cannot be
  inferred from the user agent alone.
- `CCBot` is heuristic as AI traffic. Common Crawl verifies the crawler and its IPs,
  but the same public crawl data has many non-AI uses.
- Diffbot explicitly describes `Diffbot` as a general search-index crawler and says it
  is not used for generative-AI training. It is therefore `search-index`, not
  `training-crawler`.
- Webz.io verifies the `omgili/0.5` user agent, but its crawl feeds many downstream
  uses. `omgilibot` is a legacy name, and Webz.io introduced replacement crawlers in
  2024. Treat either match as a historical/heuristic AI-training signal.
- `meta-externalads` is categorized as `search-index` for the same reason as
  `OAI-AdsBot`: Meta describes it as an advertising and business-products crawler and
  the type system has no ad-safety category.
- `Amzn-SearchBot` and `Amzn-User` are documented by Amazon as non-training fetchers
  (Alexa search eligibility and live Alexa answers respectively).
- `Google-Agent` is Google's documented user-triggered agent fetcher ("performs web
  navigation on user request"); it has its own IP list. It does not overlap the
  `GoogleAgent-URLContext` token used by Gemini CLI.
- `Google` (exact match) is the bare user agent observed from the consumer Gemini app;
  Google does not document it, so it stays `reported`. Exact matching keeps it from
  claiming every other Google token.
- The `reported` catalog tokens added on 2026-08-22 (`TongyiBot`, `YiyanBot`,
  `Manus-User`, `kagi-fetcher`, `DeepSeekBot`, `TikTokSpider`, `PanguBot`, legacy
  `ExaBot`, `TavilyBot`) are vendor-branded strings whose operators are named in the
  catalog; none of those vendors publishes a crawler page with an IP list yet. Treat
  them as attribution leads.
- Moonshot has published an official Kimi crawler policy with IP JSON files since
  2026. As of May 2026, each list contains four individual `/32` addresses in Alibaba
  Cloud ranges.
- `Applebot/` includes the slash intentionally. It avoids matching the robots-only
  `Applebot-Extended` directive.
- The two Cline tokens share one signature and therefore both resolve to the agent name
  `Cline`.

## Controlled coding-agent tests

These observations are useful but path-specific. They do not imply that every request
from the product carries the same user agent.

### Cursor

On 2026-08-03, a controlled test of Cursor 3.14.7 opened a localhost target through
Cursor's built-in Browser Tab after native WebFetch could not reach it. The receiver
captured:

```text
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
(KHTML, like Gecko) Cursor/3.14.7 Chrome/144.0.7559.236
Electron/40.10.3 Safari/537.36
```

The `Cursor/` token identifies the desktop application's browser request. It cannot
distinguish an agent-opened tab from a human-opened tab, and it does not cover every
Cursor fetch path. Other observed Cursor paths use stock Chrome, `curl`, or
`python-urllib`, none of which are attributable to Cursor. Cursor Cloud Agents also
publish [egress IPs](https://cursor.com/docs/ips.json), but this package does not check
them.

The `IntelFeed-People/0.1` value sometimes attributed to Cursor is deliberately
excluded. The catalog record points to an unrelated repository and would create false
positives.

### Cline

Two separate Cline paths were exercised on 2026-08-03:

1. Cline CLI 3.0.49's native `fetch_web_content` tool sent:

   ```text
   Mozilla/5.0 (compatible; AgentBot/1.0)
   ```

2. Cline 4.1.3's real MCP rich-display link preview sent this preliminary image check:

   ```http
   HEAD /...
   User-Agent: Mozilla/5.0 (compatible; VSCodeExtension/1.0; +https://cline.bot)
   ```

   The following metadata `GET` used `User-Agent: undici`. The vendor-branded
   `cline.bot` signal is therefore live-observed on the preview's `HEAD` request,
   not on every request in the sequence. Cline's source defines the same header in
   [`link-preview.ts`](https://github.com/cline/cline/blob/main/apps/vscode/src/integrations/misc/link-preview.ts).

`AgentBot/1.0` is generic and easier to misattribute. The `cline.bot` token is much
more specific, but it only appears on this preview path.

### Pi

Pi is deliberately absent. Pi 0.83.0 exposes a shell rather than a dedicated browser
fetcher. In a controlled session, the request arrived as ordinary `curl/8.7.1`.
Another task could choose `wget`, Python, Node, or a plugin, so there is no stable
stock Pi user agent to match.

### Gemini app

On 2026-08-22 a URL pasted into the consumer Gemini app (gemini.google.com) was fetched
with `User-Agent: Google`, `Accept: */*` and no `Referer`. Google's fetcher documentation
lists `Google-Agent` and `Google-GeminiNotebook` for Gemini surfaces but not this bare
token, so it ships as an exact-match `reported` signature.

### Codex CLI

Codex CLI 0.147.0 has no local web-fetch tool. In controlled runs it either invoked
OpenAI's server-side `web_search` (which did not fetch the page) or ran `curl`, arriving
as `curl/8.7.1`. The only HTTP client inside the binary (`codex-openai-docs`) fetches
OpenAI's own documentation. The web and desktop Codex products fetch through OpenAI's
documented bots and are covered by `ChatGPT-User` and `OAI-SearchBot`.

### OpenCode

OpenCode 1.18.18's `webfetch` tool hardcodes
`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
Chrome/143.0.0.0 Safari/537.36`, `Accept-Language: en-US,en;q=0.9`, and one of three
`Accept` values depending on the requested format (`markdown`, `text`, `html`), all of
which rank `text/markdown` explicitly. On a Cloudflare challenge it retries with
`User-Agent: opencode`, which is the token shipped here. The Chrome-branded path is not
attributable by user agent; the Notra ingest classifier attributes it from the exact
`Accept` strings and from the absence of client-hint and fetch-metadata headers.

### Cursor chat URL fetch

On 2026-08-22 a URL mentioned in Cursor chat was fetched with
`Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` and
`Accept: text/markdown,text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,image/webp;q=0.6,*/*;q=0.5`.
A spoofed Googlebot user agent is deliberately not matched here; the ingest classifier
attributes this path from the user agent plus the exact `Accept` string.

## Deliberately excluded tokens

- **`Google-Extended`** — Google documents it as a robots.txt control token, not a
  separate HTTP user agent.
- **`Applebot-Extended`** — Apple documents it as a data-use directive applied to
  Applebot crawls, not a separate fetcher.
- **`ChatGPT-Agent` and `Operator`** — these are not published OpenAI user-agent
  tokens. ChatGPT agent traffic may use an ordinary Chrome user agent and
  [Web Bot Auth](https://chatgpt.com/.well-known/http-message-signatures-directory).
- **Plain `Googlebot`** — conventional search indexing rather than an AI-specific
  signal.
- **Generic clients** — `curl`, `wget`, `undici`, `axios`,
  `python-urllib`, stock Chrome, and VS Code Electron identify software families,
  not a particular AI agent.

## Other products checked

- **GitHub Copilot** — observed with generic VS Code Electron and `curl` user agents.
  GitHub publishes Copilot network ranges under the `copilot` key in
  [GitHub Meta](https://api.github.com/meta), but there is no stable UA-only signal.
- **Windsurf / Codeium** — observed using the generic Colly scraper user agent. It is
  shared by unrelated Go applications and is intentionally unmatched.
- **Replit** — no attributable fetch token was found in vendor documentation or the
  reviewed catalogs.
- **OpenAI Codex** — the web product reuses `ChatGPT-User` and is covered by that
  signature; the CLI has no fetcher of its own (see the controlled test above).
- **Microsoft Copilot / Bing** — Bing's crawler documentation is rendered client-side and
  could not be audited on 2026-08-22; `AzureAI-SearchBot` appears only in catalogs with
  an unknown operator and is not shipped.
- **Brave Search** — Brave states it deliberately does not advertise a differentiated
  user agent, so `Bravebot` is not shipped.

## Source-quality rules

- Prefer vendor documentation and vendor-published IP lists.
- Treat controlled captures as path-specific runtime evidence.
- Use third-party catalogs only when the token is independently plausible, and keep
  the confidence at `reported`.
- Do not treat robots.txt product tokens as proof of an HTTP user-agent string.
- Do not add generic library or browser user agents merely because an agent happened
  to use them in one test.
- `knownagents.com` and
  [`ai-robots-txt/ai.robots.txt`](https://github.com/ai-robots-txt/ai.robots.txt)
  are discovery aids, not authorities. The latter republishes catalog entries and
  mixes robots directives with observed user-agent tokens.
- Cloudflare recognizes stronger bot-verification mechanisms such as Web Bot Auth,
  vendor IP ranges, and forward-confirmed reverse DNS. See
  [Cloudflare's verified-bot documentation](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/).
