import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildContentPullRequestBody,
  buildOpenInNotraBadgeUrls,
  resolveNotraBaseUrl,
} from "./pull-request-body";

describe("resolveNotraBaseUrl", () => {
  test("prefers APP_URL over NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    assert.equal(
      resolveNotraBaseUrl({
        APP_URL: "https://app.usenotra.com/",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
      "https://app.usenotra.com"
    );
    assert.equal(
      resolveNotraBaseUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
      "http://localhost:3000"
    );
  });

  test("returns null when nothing is configured", () => {
    assert.equal(resolveNotraBaseUrl({}), null);
    assert.equal(resolveNotraBaseUrl({ APP_URL: "  " }), null);
  });
});

describe("buildOpenInNotraBadgeUrls", () => {
  test("builds one URL per color scheme", () => {
    assert.deepEqual(buildOpenInNotraBadgeUrls("https://app.usenotra.com/"), {
      dark: "https://app.usenotra.com/badges/open-in-notra-dark.svg",
      light: "https://app.usenotra.com/badges/open-in-notra-light.svg",
    });
  });
});

describe("buildContentPullRequestBody", () => {
  test("falls back to the plain summary without a content URL", () => {
    assert.equal(
      buildContentPullRequestBody({ contentType: "changelog" }),
      "Draft changelog generated and published with Notra."
    );
  });

  test("renders a theme-aware Open in Notra button", () => {
    const body = buildContentPullRequestBody({
      contentType: "blog_post",
      contentUrl: "https://app.usenotra.com/acme/content/post_123",
      badgeUrls: buildOpenInNotraBadgeUrls("https://app.usenotra.com"),
    });

    assert.equal(
      body,
      [
        "Draft blog post generated and published with Notra.",
        "",
        '<a href="https://app.usenotra.com/acme/content/post_123"><picture>' +
          '<source media="(prefers-color-scheme: dark)" srcset="https://app.usenotra.com/badges/open-in-notra-dark.svg">' +
          '<source media="(prefers-color-scheme: light)" srcset="https://app.usenotra.com/badges/open-in-notra-light.svg">' +
          '<img src="https://app.usenotra.com/badges/open-in-notra-light.svg" alt="Open in Notra" height="44">' +
          "</picture></a>",
      ].join("\n")
    );
  });

  test("falls back to a markdown link when no badge URLs are available", () => {
    const body = buildContentPullRequestBody({
      contentType: "blog_post",
      contentUrl: "https://app.usenotra.com/acme/content/post_123",
    });

    assert.match(
      body,
      /\[Open in Notra\]\(https:\/\/app\.usenotra\.com\/acme\/content\/post_123\)$/
    );
  });
});
