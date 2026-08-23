import { describe, expect, test } from "bun:test";
import { classifyUserAgent } from "../src/classify";
import { shouldTrackRequest } from "../src/exclude";
import { tagHtmlLinks } from "../src/html";
import { getJourneyId, mintJourneyId, tagMarkdownLinks } from "../src/markdown";
import { createGeoHandler as createNetlifyHandler } from "../src/netlify";
import { createGeoProxy } from "../src/next";
import { toWebRequest } from "../src/nuxt";
import { serializeRequest } from "../src/serialize";
import type { GeoRequestPayload } from "../src/types";

const ID = "abcDEF123_-xyz";
const JOURNEY_ID = /^[A-Za-z0-9_-]{8,32}$/;
const TAGGED_LINK = /\[a\]\(\/b\?ntr=[A-Za-z0-9_-]+\)/;

function request(path: string, headers: Record<string, string> = {}): Request {
  return new Request(`https://example.com${path}`, {
    headers: { "user-agent": "Mozilla/5.0", ...headers },
  });
}

function tracked(path: string): boolean {
  const req = request(path);
  return shouldTrackRequest(req, new URL(req.url));
}

describe("shouldTrackRequest", () => {
  test("captures page paths", () => {
    expect(tracked("/")).toBe(true);
    expect(tracked("/docs")).toBe(true);
    expect(tracked("/docs/page.md")).toBe(true);
  });

  test("always captures llms.txt files", () => {
    expect(tracked("/llms.txt")).toBe(true);
    expect(tracked("/docs/llms-full.txt")).toBe(true);
    expect(tracked("/LLMS.TXT")).toBe(true);
  });

  test("skips assets, other text files and the default exclude", () => {
    expect(tracked("/robots.txt")).toBe(false);
    expect(tracked("/sitemap.xml")).toBe(false);
    expect(tracked("/_next/static/a.js")).toBe(false);
    expect(tracked("/api/users")).toBe(false);
  });

  test("skips non GET requests", () => {
    const req = new Request("https://example.com/", { method: "POST" });
    expect(shouldTrackRequest(req, new URL(req.url))).toBe(false);
  });
});

describe("serializeRequest", () => {
  test("reads ip, geo and request id headers", () => {
    const payload = serializeRequest(
      request("/docs", {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "x-vercel-ip-country": "DE",
        "x-vercel-ip-city": "Berlin%20Mitte",
        "x-vercel-id": "fra1::abc",
      })
    );
    expect(payload.ip).toBe("1.2.3.4");
    expect(payload.geo?.country).toBe("DE");
    expect(payload.geo?.city).toBe("Berlin Mitte");
    expect(payload.requestId).toBe("fra1::abc");
    expect(payload.url).toBe("https://example.com/docs");
  });
});

describe("journey ids", () => {
  test("mints url safe ids that round trip through getJourneyId", () => {
    const id = mintJourneyId();
    expect(id).toMatch(JOURNEY_ID);
    expect(getJourneyId(`https://example.com/a?ntr=${id}`)).toBe(id);
    expect(getJourneyId("https://example.com/a?ntr=bad!")).toBeNull();
    expect(getJourneyId("https://example.com/a")).toBeNull();
  });
});

describe("tagMarkdownLinks", () => {
  test("tags same site links and leaves everything else alone", () => {
    const input = [
      "[a](/docs?x=1#h) [b](https://example.com/p) [c](https://other.com/p)",
      "![i](/img.png) `[d](/x)` [e](/x?ntr=already123)",
      "```",
      "[f](/y)",
      "```",
      "[ref]: /r",
    ].join("\n");

    const output = tagMarkdownLinks(input, ID, { host: "example.com" });

    expect(output).toContain(`[a](/docs?x=1&ntr=${ID}#h)`);
    expect(output).toContain(`[b](https://example.com/p?ntr=${ID})`);
    expect(output).toContain("[c](https://other.com/p)");
    expect(output).toContain("![i](/img.png)");
    expect(output).toContain("`[d](/x)`");
    expect(output).toContain("[e](/x?ntr=already123)");
    expect(output).toContain("\n[f](/y)\n");
    expect(output).toContain(`[ref]: /r?ntr=${ID}`);
  });

  test("returns input untouched for an invalid journey id", () => {
    expect(tagMarkdownLinks("[a](/b)", "no", {})).toBe("[a](/b)");
  });

  test("preserves link titles while normalizing surrounding whitespace", () => {
    expect(tagMarkdownLinks('[a](  /docs  "Title"  )', ID)).toBe(
      `[a](/docs?ntr=${ID}  "Title")`
    );
  });

  test("handles long malformed links without blocking later valid links", () => {
    const unmatchedLabels = "[".repeat(50_000);
    const malformedTarget = `[label](${"a".repeat(50_000)}(`;

    expect(tagMarkdownLinks(unmatchedLabels, ID)).toBe(unmatchedLabels);
    expect(tagMarkdownLinks(`${malformedTarget}[a](/b)`, ID)).toBe(
      `${malformedTarget}[a](/b?ntr=${ID})`
    );
  });

  test("continues after malformed titles and accepts Unicode whitespace", () => {
    const input = '[broken](/x "unterminated [a](\u00a0/b\u00a0)';

    expect(tagMarkdownLinks(input, ID)).toBe(
      `[broken](/x "unterminated [a](/b?ntr=${ID})`
    );
  });
});

describe("tagHtmlLinks", () => {
  test("rewrites anchor hrefs only", () => {
    const input =
      '<a href="/docs?a=1&amp;b=2#x">a</a> <a data-href="/no">b</a> <link href="/style.css"> <a href=\'https://other.com/\'>c</a> <a href=\'/single\'>d</a>';
    const output = tagHtmlLinks(input, ID, { host: "example.com" });

    expect(output).toContain(`<a href="/docs?a=1&amp;b=2&amp;ntr=${ID}#x">`);
    expect(output).toContain('<a data-href="/no">');
    expect(output).toContain('<link href="/style.css">');
    expect(output).toContain("<a href='https://other.com/'>");
    expect(output).toContain(`<a href='/single?ntr=${ID}'>`);
  });
});

describe("serializeRequest signals", () => {
  test("reports client hints, fetch metadata and tracing headers", () => {
    const browser = serializeRequest(
      request("/", {
        "sec-ch-ua": '"Chromium";v="151"',
        "sec-fetch-mode": "navigate",
      })
    );
    expect(browser.signals).toEqual({
      clientHints: true,
      fetchMode: "navigate",
      tracing: false,
    });
    const agent = serializeRequest(
      request("/", { traceparent: "00-abc-def-01" })
    );
    expect(agent.signals).toEqual({
      clientHints: false,
      fetchMode: null,
      tracing: true,
    });
  });
});

describe("classifyUserAgent", () => {
  test("matches known agents and ignores browsers", () => {
    expect(
      classifyUserAgent("Mozilla/5.0 (compatible; GPTBot/1.2)")?.agent
    ).toBe("GPTBot");
    expect(classifyUserAgent("Mozilla/5.0 Chrome/120")).toBeNull();
  });

  test("matches the bare Google user agent used by the Gemini app exactly", () => {
    expect(classifyUserAgent("Google")?.agent).toBe("Gemini");
    expect(classifyUserAgent(" google ")?.agent).toBe("Gemini");
    expect(
      classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")?.agent
    ).not.toBe("Gemini");
    expect(classifyUserAgent("Mozilla/5.0 Google")).toBeNull();
  });

  test("matches vendor-documented assistant fetchers added in the 2026-08-22 audit", () => {
    expect(classifyUserAgent("meta-webindexer/1.1")?.agent).toBe(
      "meta-webindexer"
    );
    expect(classifyUserAgent("meta-externalads/1.1")?.agent).toBe(
      "meta-externalads"
    );
    expect(
      classifyUserAgent(
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amzn-User/0.1)"
      )?.agent
    ).toBe("Amzn-User");
    expect(
      classifyUserAgent("Mozilla/5.0 (compatible; Google-Agent)")?.agent
    ).toBe("Google-Agent");
    expect(classifyUserAgent("Google-GeminiNotebook")?.agent).toBe(
      "Google-GeminiNotebook"
    );
    expect(
      classifyUserAgent("Mozilla-Tabstack/1.0 (+https://tabstack.ai)")?.agent
    ).toBe("Mozilla Tabstack");
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (compatible) AI2Bot (+https://www.allenai.org/crawler)"
      )?.agent
    ).toBe("AI2Bot");
    expect(classifyUserAgent("Kimi-User/1.0")?.agent).toBe("Kimi-User");
  });

  test("matches OpenCode's bare fallback user agent exactly", () => {
    expect(classifyUserAgent("opencode")?.agent).toBe("OpenCode");
    expect(classifyUserAgent("Mozilla/5.0 opencode-extension")).toBeNull();
  });
});

describe("next proxy", () => {
  test("tags markdown for AI agents, strips hop headers and tracks the hit", async () => {
    const calls: { url: string; guard: string | null; body?: string }[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      if (url.includes("/api/geo/ingest")) {
        calls.push({ url, guard: null, body: String(init?.body) });
        return new Response("ok");
      }
      calls.push({ url, guard: headers.get("x-notra-geo-tag") });
      return new Response("# Hi\n[a](/b)", {
        headers: {
          "content-type": "text/markdown",
          "content-length": "99",
          "x-middleware-next": "1",
          "cache-control": "s-maxage=60",
        },
      });
    };

    const geo = createGeoProxy({
      token: "tok",
      tagLinks: true,
      fetch: fetchMock,
    });
    const pending: Promise<unknown>[] = [];
    const response = await geo(
      request("/llms.txt", { "user-agent": "GPTBot" }),
      {
        waitUntil: (promise) => {
          pending.push(promise);
        },
      }
    );
    await Promise.all(pending);

    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("s-maxage=60");
    expect(response?.headers.get("content-length")).toBeNull();
    expect(response?.headers.get("x-middleware-next")).toBeNull();
    expect(await response?.text()).toMatch(TAGGED_LINK);

    expect(calls[0]?.url).toBe("https://example.com/llms.txt");
    expect(calls[0]?.guard).toBe("1");
    expect(calls[1]?.url).toBe("https://app.usenotra.com/api/geo/ingest");
    const payload: GeoRequestPayload = JSON.parse(calls[1]?.body ?? "{}");
    expect(payload.url).toBe("https://example.com/llms.txt");
  });

  test("falls through for humans and still tracks", async () => {
    const urls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      urls.push(String(input));
      return new Response("ok");
    };
    const geo = createGeoProxy({
      token: "tok",
      tagLinks: true,
      fetch: fetchMock,
    });
    const pending: Promise<unknown>[] = [];
    const response = await geo(request("/docs"), {
      waitUntil: (promise) => {
        pending.push(promise);
      },
    });
    await Promise.all(pending);

    expect(response).toBeUndefined();
    expect(urls).toEqual(["https://app.usenotra.com/api/geo/ingest"]);
  });

  test("sends nothing without a token", async () => {
    const urls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      urls.push(String(input));
      return new Response("ok");
    };
    const geo = createGeoProxy({ token: "", fetch: fetchMock });
    await geo(request("/docs"));
    expect(urls).toEqual([]);
  });
});

describe("nuxt adapter", () => {
  test("builds a web request from a node request", () => {
    const webRequest = toWebRequest({
      node: {
        req: {
          method: "GET",
          url: "/hello?x=1",
          headers: {
            host: "example.com",
            "x-forwarded-proto": "https",
            "user-agent": "GPTBot",
          },
        },
      },
    });
    expect(webRequest?.url).toBe("https://example.com/hello?x=1");
    expect(webRequest?.headers.get("user-agent")).toBe("GPTBot");
  });
});

describe("netlify adapter", () => {
  test("maps context.geo into the payload", async () => {
    let payload: GeoRequestPayload | null = null;
    const fetchMock: typeof fetch = async (_input, init) => {
      payload = JSON.parse(String(init?.body));
      return new Response("ok");
    };
    const geo = createNetlifyHandler({ token: "tok", fetch: fetchMock });
    const pending: Promise<unknown>[] = [];
    geo(request("/hello"), {
      waitUntil: (promise) => {
        pending.push(promise);
      },
      geo: {
        city: "Berlin",
        country: { code: "DE" },
        latitude: 52.5,
        longitude: 13.4,
      },
    });
    await Promise.all(pending);

    expect(payload?.geo).toEqual({
      country: "DE",
      city: "Berlin",
      latitude: "52.5",
      longitude: "13.4",
    });
  });
});
