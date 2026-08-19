# AI agent signature evidence

This is the audit trail for `AI_AGENT_SIGNATURES` in
[`src/signatures.ts`](./src/signatures.ts). The table below mirrors every shipped
signature. A token should not be added to the code unless its evidence is recorded
here.

## How to read this file

The classifier performs a case-insensitive substring match against the
`User-Agent` header. It returns the first matching signature.

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

Last fully audited: **2026-08-05**.

- All 38 shipped signatures and every matched token were checked against the cited
  evidence below.
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
| Applebot | Apple | search-index | `Applebot/` | verified | [Applebot docs](https://support.apple.com/en-us/119829) | [IP ranges](https://search.developer.apple.com/applebot.json) |
| cohere-training-data-crawler | Cohere | training-crawler | `cohere-training-data-crawler` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| cohere-ai | Cohere | assistant-browse | `cohere-ai` | reported | [ai.robots.txt catalog](https://raw.githubusercontent.com/ai-robots-txt/ai.robots.txt/main/robots.json) | — |
| meta-externalagent | Meta | training-crawler | `meta-externalagent` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
| meta-externalfetcher | Meta | assistant-browse | `meta-externalfetcher` | verified | [Meta crawler docs](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers) | — |
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
| Cursor | Anysphere | assistant-browse | `Cursor/` | reported | [Controlled test; vendor download](https://cursor.com/download) | — |
| Cline | Cline Bot | assistant-browse | `Mozilla/5.0 (compatible; AgentBot/1.0)`<br>`VSCodeExtension/1.0; +https://cline.bot` | reported | [Cline link-preview source](https://github.com/cline/cline/blob/main/apps/vscode/src/integrations/misc/link-preview.ts) | — |
| Trae-Agent | ByteDance | assistant-browse | `Trae-Agent` | reported | [Known Agents entry](https://knownagents.com/agents/trae) | — |
| omgili | Webz.io | training-crawler | `omgilibot`<br>`omgili` | heuristic | [Webz.io bot docs](https://webz.io/blog/web-data/what-is-the-omgili-bot-and-why-is-it-crawling-your-website/) | — |

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
- **OpenAI Codex** — observed reusing `ChatGPT-User`; it is covered by that signature
  rather than assigned a separate UA identity.

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
