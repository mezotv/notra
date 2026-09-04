import { describe, expect, test } from "bun:test";

import {
  buildOpenInNotraBadgeUrls,
  mergeContentPullRequestBody,
} from "./pull-request-body";

const contentUrl = "https://app.usenotra.com/acme/content/post_123";
const legacyManagedContent = [
  "Draft blog post generated and published with Notra.",
  "",
  `[Open in Notra](${contentUrl})`,
].join("\n");

describe("mergeContentPullRequestBody", () => {
  test("migrates a legacy body with an Open in Notra link", () => {
    expect(
      mergeContentPullRequestBody(legacyManagedContent, {
        contentType: "blog_post",
        contentUrl,
      })
    ).toBe(
      [
        "<!-- notra:content:start -->",
        legacyManagedContent,
        "<!-- notra:content:end -->",
      ].join("\n")
    );
  });

  test("replaces legacy managed content while preserving maintainer notes", () => {
    const currentBody = [
      "Maintainer introduction.",
      "",
      legacyManagedContent,
      "",
      "Maintainer footer.",
    ].join("\n");

    expect(
      mergeContentPullRequestBody(currentBody, {
        contentType: "blog_post",
        contentUrl,
      })
    ).toBe(
      [
        "Maintainer introduction.",
        "",
        "<!-- notra:content:start -->",
        legacyManagedContent,
        "<!-- notra:content:end -->",
        "",
        "Maintainer footer.",
      ].join("\n")
    );
  });

  test("recognizes a legacy markdown link when badges are now available", () => {
    const badgeUrls = buildOpenInNotraBadgeUrls("https://app.usenotra.com");
    const body = mergeContentPullRequestBody(legacyManagedContent, {
      badgeUrls,
      contentType: "blog_post",
      contentUrl,
    });

    expect(body).toStartWith("<!-- notra:content:start -->");
    expect(body).not.toContain("[Open in Notra]");
    expect(body).toContain(`<a href="${contentUrl}"><picture>`);
    expect(body).toEndWith("<!-- notra:content:end -->");
  });

  test("does not replace legacy-looking content inside maintainer text", () => {
    const currentBody = `Quoted legacy content: ${legacyManagedContent}`;
    const body = mergeContentPullRequestBody(currentBody, {
      contentType: "blog_post",
      contentUrl,
    });

    expect(body).toStartWith(`${currentBody}\n\n`);
    expect(body.match(/<!-- notra:content:start -->/g)).toHaveLength(1);
  });
});
