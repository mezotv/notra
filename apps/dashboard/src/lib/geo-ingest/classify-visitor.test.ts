import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classifyVisitor } from "@/lib/geo-ingest/classify-visitor";

const CURSOR_ACCEPT =
  "text/markdown,text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,image/webp;q=0.6,*/*;q=0.5";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const SAFARI_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15";
const OPENCODE_ACCEPT =
  "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1";
const BROWSER_ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";

describe("classifyVisitor", () => {
  test("attributes Cursor by its Googlebot spoof plus markdown accept", () => {
    const result = classifyVisitor({
      userAgent: GOOGLEBOT_UA,
      referer: undefined,
      accept: CURSOR_ACCEPT,
    });
    assert.equal(result.visitorType, "crawler");
    assert.equal(result.agent, "Cursor");
    assert.equal(result.confidence, "reported");
  });

  test("flags unknown clients that prefer markdown over html", () => {
    const result = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept: "text/markdown, text/html;q=0.8",
    });
    assert.equal(result.visitorType, "crawler");
    assert.equal(result.agent, "Markdown-negotiating agent");
    assert.equal(result.confidence, "heuristic");
  });

  test("keeps real Googlebot and browsers as human", () => {
    assert.equal(
      classifyVisitor({
        userAgent: GOOGLEBOT_UA,
        referer: undefined,
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      }).visitorType,
      "human"
    );
    assert.equal(
      classifyVisitor({
        userAgent: CHROME_UA,
        referer: undefined,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      }).visitorType,
      "human"
    );
  });

  test("lets a declared AI user agent win over the accept header", () => {
    assert.equal(
      classifyVisitor({
        userAgent: "Claude-User (claude-code/2.1.169)",
        referer: undefined,
        accept: CURSOR_ACCEPT,
      }).agent,
      "Claude Code"
    );
  });

  test("attributes OpenCode by its Chrome spoof plus accept string", () => {
    const result = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept: OPENCODE_ACCEPT,
    });
    assert.equal(result.visitorType, "crawler");
    assert.equal(result.agent, "OpenCode");
    const textFirst = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept:
        "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1",
    });
    assert.equal(textFirst.agent, "OpenCode");
    const markdownDefault = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept:
        "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1",
    });
    assert.equal(markdownDefault.agent, "OpenCode");
  });

  test("flags Chromium user agents that lack client hints or fetch metadata", () => {
    const spoof = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept: BROWSER_ACCEPT,
      signals: { clientHints: false, fetchMode: null, tracing: false },
    });
    assert.equal(spoof.visitorType, "crawler");
    assert.equal(spoof.agent, "Browser-imitating agent");
    const real = classifyVisitor({
      userAgent: CHROME_UA,
      referer: undefined,
      accept: BROWSER_ACCEPT,
      signals: { clientHints: true, fetchMode: "navigate", tracing: false },
    });
    assert.equal(real.visitorType, "human");
  });

  test("accepts Safari without client hints when fetch metadata is present", () => {
    const safari = classifyVisitor({
      userAgent: SAFARI_UA,
      referer: undefined,
      accept: BROWSER_ACCEPT,
      signals: { clientHints: false, fetchMode: "navigate", tracing: false },
    });
    assert.equal(safari.visitorType, "human");
    const traced = classifyVisitor({
      userAgent: SAFARI_UA,
      referer: undefined,
      accept: BROWSER_ACCEPT,
      signals: { clientHints: false, fetchMode: "navigate", tracing: true },
    });
    assert.equal(traced.visitorType, "crawler");
  });

  test("labels command-line clients while keeping them unknown", () => {
    const curl = classifyVisitor({
      userAgent: "curl/8.7.1",
      referer: undefined,
      accept: "*/*",
    });
    assert.equal(curl.visitorType, "unknown");
    assert.equal(curl.agent, "curl");
    const node = classifyVisitor({
      userAgent: "node",
      referer: undefined,
      accept: "*/*",
    });
    assert.equal(node.agent, "Node.js fetch");
    const bun = classifyVisitor({
      userAgent: "Bun/1.4.0",
      referer: undefined,
      accept: "*/*",
    });
    assert.equal(bun.agent, "Bun");
  });
});
