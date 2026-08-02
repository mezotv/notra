# Signature sources

Every entry in `src/signatures.ts` is listed here with the source it came from and a
confidence level. Nothing in the table is invented. If a vendor does not publish a
user-agent, the agent is either absent from the table or documented below as
unmatchable.

Confidence levels:

- **verified** — the operator publishes the token in its own documentation.
- **reported** — the token appears only in credible third-party catalogs, controlled
  header tests, or server-log studies. Spoofable and unconfirmed by the vendor.
- **heuristic** — the token is real but our category assignment is an inference.

Matching is a case-insensitive substring test on the `User-Agent` header only. UA
matching is trivially spoofable; the `verification` field points at the published IP
range list or reverse-DNS method that can prove a hit is genuine. Nothing in this
package performs that verification yet.

## OpenAI

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| GPTBot | training-crawler | `GPTBot` | verified |
| OAI-SearchBot | search-index | `OAI-SearchBot` | verified |
| ChatGPT-User | assistant-browse | `ChatGPT-User` | verified |
| OAI-AdsBot | search-index | `OAI-AdsBot` | verified |

Source: <https://developers.openai.com/api/docs/bots>. IP ranges:
<https://openai.com/gptbot.json>, <https://openai.com/searchbot.json>,
<https://openai.com/chatgpt-user.json>, <https://openai.com/adsbot.json>. Each file has
the shape `{"creationTime": ISO8601, "prefixes": [{"ipv4Prefix": "..."}]}`.

OAI-AdsBot is filed under `search-index` because our category enum has no ad-safety
bucket; OpenAI describes it as a landing-page checker, not a training crawler.

There is **no** `ChatGPT-Agent` or `Operator` user-agent token. ChatGPT Atlas and the
ChatGPT agent send an ordinary Chrome user-agent and identify themselves with Web Bot
Auth HTTP message signatures instead
(<https://chatgpt.com/.well-known/http-message-signatures-directory>). They cannot be
detected by user-agent and are deliberately absent from the table.

## Anthropic

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| ClaudeBot | training-crawler | `ClaudeBot` | verified |
| Claude-User | assistant-browse | `Claude-User` | verified |
| Claude-SearchBot | search-index | `Claude-SearchBot` | verified |
| Claude Code | assistant-browse | `claude-code/` | reported |
| anthropic-ai | training-crawler | `anthropic-ai` | reported (legacy) |
| claude-web | assistant-browse | `claude-web` | reported (legacy) |

Source: <https://support.claude.com/en/articles/8896518>. IP ranges:
<https://claude.com/crawling/bots.json>.

Anthropic documents the three tokens but publishes **no** full user-agent strings, so
we match on the token only. `anthropic-ai` and `claude-web` are legacy names that
appear only in <https://github.com/ai-robots-txt/ai.robots.txt>; that catalog itself
notes there is no official documentation for `Claude-Web`.

Claude Code sends `Claude-User (claude-code/<version>; +https://support.anthropic.com/)`
in newer builds (<https://github.com/monperrus/crawler-user-agents>); older builds sent
a bare `axios/1.8.4`, which is not attributable. The `claude-code/` entry is ordered
before `Claude-User` so Claude Code hits are labelled specifically.

## Perplexity

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| PerplexityBot | search-index | `PerplexityBot` | verified |
| Perplexity-User | assistant-browse | `Perplexity-User` | verified |

Source: <https://docs.perplexity.ai/guides/bots>. IP ranges:
<https://www.perplexity.ai/perplexitybot.json>,
<https://www.perplexity.ai/perplexity-user.json>.

Perplexity has been documented fetching from undeclared user-agents and IPs, so a UA
miss does not mean Perplexity did not visit.

## Google

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| Google-CloudVertexBot | training-crawler | `Google-CloudVertexBot` | verified |
| GoogleOther-Image | training-crawler | `GoogleOther-Image` | verified |
| GoogleOther-Video | training-crawler | `GoogleOther-Video` | verified |
| GoogleOther | training-crawler | `GoogleOther` | heuristic |
| GoogleAgent-URLContext | assistant-browse | `GoogleAgent-URLContext`, `Google-Gemini-CLI` | reported |

Sources:
<https://developers.google.com/search/docs/crawling-indexing/google-special-case-crawlers>,
<https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers>.
IP ranges: `https://developers.google.com/static/search/apis/ipranges/special-crawlers.json`
plus reverse DNS in `*.googlebot.com` / `*.google.com`.

**`Google-Extended` is deliberately absent.** Google states it "doesn't have a separate
HTTP request user agent string" — it is a robots.txt control token for Gemini and Vertex
AI grounding only. Any request whose UA literally contains `Google-Extended` is spoofed,
so matching it would produce fake data.

`GoogleOther` is marked heuristic: the token is verified, but Google describes it as a
shared one-off crawl pool for internal R&D rather than a dedicated AI training crawler,
so the `training-crawler` category is our inference.

`GoogleAgent-URLContext` is the Gemini CLI / URL-context fetcher, observed in a
controlled header test (<https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/>)
rather than documented by Google.

Plain `Googlebot` is not in the table: it is classic search indexing, not AI traffic.

## Apple

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| Applebot | search-index | `Applebot/` | verified |

Source: <https://support.apple.com/en-us/119829>. IP ranges:
<https://search.developer.apple.com/applebot.json>, plus forward-confirmed reverse DNS
in `*.applebot.apple.com`.

**`Applebot-Extended` is deliberately absent.** Apple states it "does not crawl
webpages... only used to determine how to use the data crawled by the Applebot user
agent". It is a robots.txt directive, not a fetcher. The token is matched with a
trailing slash (`Applebot/`) because Apple's real UA reads `(Applebot/0.1; +...)`.

## Meta

| Agent | Category | Token | Confidence |
| --- | --- | --- | --- |
| meta-externalagent | training-crawler | `meta-externalagent` | verified |
| meta-externalfetcher | assistant-browse | `meta-externalfetcher` | verified |
| FacebookBot | training-crawler | `FacebookBot` | reported |

Source: <https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/>. Meta
publishes no IP list, so none of these can be verified. `FacebookBot` is not on Meta's
crawler page and comes from ai.robots.txt only.

## Amazon, DuckDuckGo, Liner, You.com, Mistral, Common Crawl

| Agent | Vendor | Category | Token | Confidence | Verification |
| --- | --- | --- | --- | --- | --- |
| Amazonbot | Amazon | training-crawler | `Amazonbot` | verified | <https://developer.amazon.com/amazonbot/ip-addresses/> |
| DuckAssistBot | DuckDuckGo | assistant-browse | `DuckAssistBot` | verified | <https://duckduckgo.com/duckassistbot.json> |
| LinerBot | Liner | search-index | `LinerBot` | verified | <https://docs.getliner.com/linerbot.json> |
| YouBot | You.com | search-index | `YouBot` | verified | rDNS `*.search.you.com`, `68.67.112.0/24` |
| MistralAI-User | Mistral | assistant-browse | `MistralAI-User` | verified | <https://mistral.ai/mistralai-user-ips.json> |
| CCBot | Common Crawl | training-crawler | `CCBot` | verified | <https://index.commoncrawl.org/ccbot.json> |

Docs: <https://developer.amazon.com/amazonbot>,
<https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/>,
<https://docs.getliner.com/docs/linerbot>, <https://you.com/docs/youbot>,
<https://docs.mistral.ai/robots>, <https://commoncrawl.org/ccbot>.

## Unverifiable but widely observed

| Agent | Vendor | Category | Token | Confidence |
| --- | --- | --- | --- | --- |
| Bytespider | ByteDance | training-crawler | `Bytespider` | reported |
| cohere-training-data-crawler | Cohere | training-crawler | `cohere-training-data-crawler` | reported |
| cohere-ai | Cohere | assistant-browse | `cohere-ai` | reported |
| Timpibot | Timpi | training-crawler | `Timpibot` | reported |
| Diffbot | Diffbot | training-crawler | `Diffbot` | reported |
| omgili | Webz.io | training-crawler | `omgilibot`, `omgili` | verified token |
| Devin | Cognition | assistant-browse | `Devin/` | reported |
| Trae-Agent | ByteDance | assistant-browse | `Trae-Agent` | reported |

ByteDance, Cohere and Timpi publish no crawler documentation at all; the tokens come
from <https://github.com/ai-robots-txt/ai.robots.txt>. Cohere's `docs.cohere.com/docs/crawling`
returns 404. Diffbot confirms the `Diffbot` and `Diffbot-User` robots.txt tokens
(<https://www.diffbot.com/docs/crawl/faq/robots-txt>) but publishes no UA string.
Webz.io documents `omgili`/`omgilibot`
(<https://webz.io/blog/web-data/what-is-the-omgili-bot-and-why-is-it-crawling-your-website/>).
Devin appears in Cloudflare's verified-bots directory
(<https://radar.cloudflare.com/traffic/verified-bots>) but not in Cognition's own docs.
Trae comes from <https://knownagents.com/agents/trae>.

Bytespider is widely reported to ignore robots.txt. None of these can be verified by
IP, so a UA match is a hint, not proof.

## Cursor: not fingerprintable by user-agent

**Cursor is deliberately absent from `signatures.ts`.** We could not find a Cursor
user-agent token that would be honest to ship. The findings, with confidence:

- **Cursor sends a stock Chrome user-agent** with no vendor token. A controlled
  header-echo test of Cursor 2.4.28's native WebFetch against `httpbin.org/headers`
  recorded `Mozilla/5.0 ... Chrome/139.0.0.0 Safari/537.36` plus Chrome client hints
  (`Sec-Ch-Ua`, `Sec-Fetch-*`) and
  `Accept: text/markdown,text/html;q=0.9,...`
  (<https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/>) — **reported**.
  Independently corroborated by
  <https://github.com/agent-ecosystem/agent-docs-spec>.
- **Cursor also routes some fetches through generic clients.** The same study found
  Cursor falling back to Python `urllib` and `curl` for larger payloads, so some hits
  arrive as `python-urllib/x.y` or `curl/x.y` — **reported**. Those are shared by
  thousands of unrelated scripts and are useless as an attribution signal.
- **Cursor publishes no user-agent.** Cursor staff confirmed no public server
  identifiers exist
  (<https://forum.cursor.com/t/request-for-cursor-server-ip-addresses-for-api-whitelist-configuration/103941>)
  — **verified absence**.
- **Do not trust the catalog entry.** <https://knownagents.com/agents/cursor> lists
  Cursor with the user-agent `IntelFeed-People/0.1 (+https://github.com/bertchen321wehc/Cursor)`
  and operator "xAI". That is a corrupted submission pointing at an unrelated personal
  GitHub repository, and it has propagated verbatim into `ai-robots-txt/ai.robots.txt`.
  Shipping it would produce false positives.
- **Most Cursor `@Web` traffic never reaches your origin.** Cursor's own security page
  names Exa and SerpApi as its search providers, so page content is usually served from
  Exa's index rather than crawled live
  (<https://web.archive.org/web/20260423053001id_/https://cursor.com/security>) —
  **verified**. Exa publishes no crawler user-agent or IP list.

The closest usable signals, none of which we implement:

1. **Cloud Agent IP ranges — verified.** <https://cursor.com/docs/ips.json> lists 416
   `/32` egress addresses plus three git-egress proxy IPs, all inside AWS us-east-1 /
   us-east-2 / us-west-2 prefixes (docs:
   <https://cursor.com/docs/cloud-agent/security-network>). This is the only
   Cursor-attributable network signal, and it covers Cloud Agents only — not the
   desktop IDE. There is no Anysphere ASN; the address space is Amazon's.
2. **Header heuristic — heuristic, not Cursor-specific.** "Chrome desktop UA +
   `Accept: text/markdown` with a q-factor chain + no JavaScript execution" flags
   markdown-negotiating coding agents as a class. OpenCode matches the same shape, so
   it identifies "a coding agent", not "Cursor".
3. **`x-cursor-client-version` / `x-cursor-client-type` headers — reported.** These are
   sent only to Cursor's own API and never reach third-party origins.

**Bottom line: there is no reliable way to detect Cursor from a web request today.** A
44-day Cloudflare log study reached the same conclusion, finding markdown-requesting
"standard Chrome" traffic from headless pools that could not be attributed to any
vendor (<https://suganthan.com/blog/cloudflare-markdown-for-agents/>). If Cursor ships
a real token we will add it; until then the table stays honest and leaves it out.

## Other coding agents we checked and left out

- **GitHub Copilot** — sends a VS Code Electron UA (`Code/1.109.3 ... Electron/39.3.0`)
  or `curl/8.7.1`; no documented fetch token. There *is* an official IP signal: the
  `copilot` key in <https://api.github.com/meta> (17 CIDRs) — **verified**. UA-only
  detection is impossible.
- **Windsurf / Codeium** — observed sending
  `colly - https://github.com/gocolly/colly`, a generic Go scraping library UA shared
  by unrelated scrapers — **reported**, too generic to ship.
- **Cline** — open source; its SDK web-fetch defaults to
  `Mozilla/5.0 (compatible; AgentBot/1.0)`, link previews use
  `Mozilla/5.0 (compatible; VSCodeExtension/1.0; +https://cline.bot)`, and Puppeteer
  browsing spoofs Chrome 128 (<https://github.com/cline/cline>) — **verified from
  source**, but the tokens are generic enough to cause false positives.
- **Replit** — no published user-agent or IP list found in any catalog or in Replit's
  docs — **verified absence**.
- **OpenAI Codex** — reuses `ChatGPT-User`, already covered.

## Catalog caveats

- `darkvisitors.com/agents` now redirects to `knownagents.com`. Its data quality is
  mixed (see the Cursor entry above); treat it as a lead, not a source.
- `ai-robots-txt/ai.robots.txt` contains robots.txt tokens, not user-agent strings, and
  re-imports knownagents entries verbatim including bad ones.
- Cloudflare lists three accepted bot-verification mechanisms: Web Bot Auth, published
  IP ranges with stable user-agents, and reverse DNS
  (<https://developers.cloudflare.com/bots/concepts/bot/verified-bots/>). User-agent
  matching alone is none of them.
