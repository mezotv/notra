import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { GitHubClient } from "@/types/integrations/github";
import {
  classifyGitHubPublishFailure,
  GitHubContentPublishError,
  publishContentDraftPullRequest,
  resolveGitHubContentPath,
} from "./publish-content-to-github";

const BLOG_POST_BRANCH_REGEX = /^refs\/heads\/notra\/blog-post-/;

const publishParams = {
  contentType: "changelog" as const,
  owner: "notra",
  repo: "docs",
  defaultBranch: "main",
  path: "changelogs/july.md",
  title: "July update",
  markdown: "New features",
};

function githubError(status: number) {
  return Object.assign(new Error(`GitHub ${status}`), { status });
}

function githubApiError(params: {
  headers?: Record<string, string | number | undefined>;
  message: string;
  status: number;
}) {
  return Object.assign(new Error(params.message), {
    status: params.status,
    response: { headers: params.headers },
  });
}

function createGitHubClient(
  handler: (route: string, options: Record<string, unknown>) => unknown
) {
  return {
    request: async (route: string, options: Record<string, unknown>) =>
      handler(route, options),
  } as unknown as GitHubClient;
}

function defaultResponse(route: string) {
  if (route === "GET /repos/{owner}/{repo}/git/ref/{ref}") {
    return { data: { object: { sha: "base-sha" } } };
  }
  if (route === "GET /repos/{owner}/{repo}/contents/{path}") {
    throw githubError(404);
  }
  if (route === "GET /repos/{owner}/{repo}/pulls") {
    return { data: [] };
  }
  return { data: {} };
}

describe("resolveGitHubContentPath", () => {
  test("builds the path from the configured directory and content slug", () => {
    const path = resolveGitHubContentPath({
      contentId: "content-123",
      directory: "apps/docs/changelogs",
      slug: "july-update",
      title: "July update",
    });

    assert.equal(path, "apps/docs/changelogs/july-update.md");
  });

  test("supports the repository root and falls back to the title", () => {
    const path = resolveGitHubContentPath({
      contentId: "content-123",
      directory: "",
      slug: null,
      title: "July Update!",
    });

    assert.equal(path, "july-update.md");
  });

  for (const [slug, fileName] of [
    ["../release", "release"],
    ["nested/release", "nested-release"],
    ["Release.md", "release-md"],
  ] as const) {
    test(`normalizes unsafe stored slug ${slug}`, () => {
      const path = resolveGitHubContentPath({
        contentId: "content-123",
        directory: "changelogs",
        slug,
        title: "Fallback title",
      });

      assert.equal(path, `changelogs/${fileName}.md`);
    });
  }

  test("keeps an explicit custom path", () => {
    const path = resolveGitHubContentPath({
      contentId: "content-123",
      customPath: "special/update.md",
      directory: "changelogs",
      slug: "july-update",
      title: "July update",
    });

    assert.equal(path, "special/update.md");
  });
});

describe("classifyGitHubPublishFailure", () => {
  test("classifies authentication failures separately", () => {
    assert.equal(
      classifyGitHubPublishFailure(githubError(401)),
      "authentication"
    );
  });

  test("recognizes primary and secondary rate-limit 403 responses", () => {
    assert.equal(
      classifyGitHubPublishFailure(
        githubApiError({
          headers: { "X-RateLimit-Remaining": "0" },
          message: "Forbidden",
          status: 403,
        })
      ),
      "rate_limit"
    );
    assert.equal(
      classifyGitHubPublishFailure(
        githubApiError({
          message: "You have exceeded a secondary rate limit",
          status: 403,
        })
      ),
      "rate_limit"
    );
  });

  test("recognizes GitHub App permission denials", () => {
    assert.equal(
      classifyGitHubPublishFailure(
        githubApiError({
          message: "Resource not accessible by integration",
          status: 403,
        })
      ),
      "permissions"
    );
  });

  test("does not present organization policy blocks as missing permissions", () => {
    assert.equal(
      classifyGitHubPublishFailure(
        githubApiError({
          message: "The organization has blocked access to this application",
          status: 403,
        })
      ),
      "forbidden"
    );
  });
});

describe("publishContentDraftPullRequest", () => {
  test("uses blog-specific branch and pull request copy", async () => {
    let branchRef: unknown;
    let pullRequestOptions: Record<string, unknown> | undefined;
    const client = createGitHubClient((route, options) => {
      if (route === "POST /repos/{owner}/{repo}/git/refs") {
        branchRef = options.ref;
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        pullRequestOptions = options;
        return { data: { number: 18, html_url: "https://github.com/pr/18" } };
      }
      return defaultResponse(route);
    });

    await publishContentDraftPullRequest(client, {
      ...publishParams,
      contentType: "blog_post",
      path: "blog/july.md",
    });

    assert.match(String(branchRef), BLOG_POST_BRANCH_REGEX);
    assert.equal(
      pullRequestOptions?.body,
      "Draft blog post generated and published with Notra."
    );
  });

  test("updates the branch before returning an existing pull request", async () => {
    const routes: string[] = [];
    let updateOptions: Record<string, unknown> | undefined;
    const client = createGitHubClient((route, options) => {
      routes.push(route);
      if (route === "GET /repos/{owner}/{repo}/pulls") {
        return {
          data: [
            { number: 42, html_url: "https://github.com/notra/docs/pull/42" },
          ],
        };
      }
      if (
        route === "GET /repos/{owner}/{repo}/contents/{path}" &&
        options.ref !== "base-sha"
      ) {
        return { data: { sha: "existing-file-sha" } };
      }
      if (route === "PUT /repos/{owner}/{repo}/contents/{path}") {
        updateOptions = options;
      }
      return defaultResponse(route);
    });

    const result = await publishContentDraftPullRequest(client, publishParams);

    assert.equal(result.pullRequestNumber, 42);
    assert.ok(!routes.includes("POST /repos/{owner}/{repo}/git/refs"));
    assert.ok(!routes.includes("POST /repos/{owner}/{repo}/pulls"));
    assert.equal(updateOptions?.sha, "existing-file-sha");
    assert.equal(
      updateOptions?.content,
      Buffer.from(publishParams.markdown).toString("base64")
    );
  });

  test("recovers an existing branch instead of creating a duplicate", async () => {
    const routes: string[] = [];
    const client = createGitHubClient((route) => {
      routes.push(route);
      if (route === "POST /repos/{owner}/{repo}/git/refs") {
        throw githubError(422);
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        return { data: { number: 12, html_url: "https://github.com/pr/12" } };
      }
      return defaultResponse(route);
    });

    const result = await publishContentDraftPullRequest(client, publishParams);

    assert.equal(result.pullRequestNumber, 12);
    assert.ok(routes.includes("PUT /repos/{owner}/{repo}/contents/{path}"));
    assert.ok(!routes.includes("DELETE /repos/{owner}/{repo}/git/refs/{ref}"));
  });

  test("uses the same branch for the same path after a title edit", async () => {
    const branchRefs: unknown[] = [];
    const client = createGitHubClient((route, options) => {
      if (route === "POST /repos/{owner}/{repo}/git/refs") {
        branchRefs.push(options.ref);
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        return { data: { number: 12, html_url: "https://github.com/pr/12" } };
      }
      return defaultResponse(route);
    });

    await publishContentDraftPullRequest(client, publishParams);
    await publishContentDraftPullRequest(client, {
      ...publishParams,
      title: "Renamed July update",
    });

    assert.equal(branchRefs.length, 2);
    assert.equal(branchRefs[0], branchRefs[1]);
  });

  test("checks the destination against the exact base commit", async () => {
    let checkedRef: unknown;
    const client = createGitHubClient((route, options) => {
      if (route === "GET /repos/{owner}/{repo}/contents/{path}") {
        checkedRef = options.ref;
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        return { data: { number: 12, html_url: "https://github.com/pr/12" } };
      }
      return defaultResponse(route);
    });

    await publishContentDraftPullRequest(client, publishParams);

    assert.equal(checkedRef, "base-sha");
  });

  test("lets GitHub attribute the commit to the authenticated app", async () => {
    let createFileOptions: Record<string, unknown> | undefined;
    const client = createGitHubClient((route, options) => {
      if (route === "PUT /repos/{owner}/{repo}/contents/{path}") {
        createFileOptions = options;
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        return { data: { number: 12, html_url: "https://github.com/pr/12" } };
      }
      return defaultResponse(route);
    });

    await publishContentDraftPullRequest(client, publishParams);

    assert.ok(createFileOptions);
    assert.equal("author" in createFileOptions, false);
    assert.equal("committer" in createFileOptions, false);
  });

  test("keeps the branch recoverable when creating the file fails", async () => {
    const routes: string[] = [];
    const client = createGitHubClient((route) => {
      routes.push(route);
      if (route === "PUT /repos/{owner}/{repo}/contents/{path}") {
        throw githubError(422);
      }
      return defaultResponse(route);
    });

    await assert.rejects(
      publishContentDraftPullRequest(client, publishParams),
      (error: unknown) =>
        error instanceof GitHubContentPublishError && error.branchName !== null
    );
    assert.ok(!routes.includes("DELETE /repos/{owner}/{repo}/git/refs/{ref}"));
  });

  test("keeps the branch recoverable when pull request creation fails", async () => {
    const routes: string[] = [];
    const client = createGitHubClient((route) => {
      routes.push(route);
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        throw githubError(422);
      }
      if (route === "GET /repos/{owner}/{repo}/pulls") {
        return { data: [] };
      }
      return defaultResponse(route);
    });

    await assert.rejects(
      publishContentDraftPullRequest(client, publishParams),
      (error: unknown) =>
        error instanceof GitHubContentPublishError && error.branchName !== null
    );
    assert.ok(!routes.includes("DELETE /repos/{owner}/{repo}/git/refs/{ref}"));
  });

  test("returns a pull request found after a lost create response", async () => {
    const routes: string[] = [];
    const client = createGitHubClient((route) => {
      routes.push(route);
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        throw new Error("Connection closed");
      }
      if (route === "GET /repos/{owner}/{repo}/pulls") {
        return {
          data: [
            { number: 42, html_url: "https://github.com/notra/docs/pull/42" },
          ],
        };
      }
      return defaultResponse(route);
    });

    const result = await publishContentDraftPullRequest(client, publishParams);

    assert.equal(result.pullRequestNumber, 42);
    assert.equal(
      result.pullRequestUrl,
      "https://github.com/notra/docs/pull/42"
    );
    assert.ok(!routes.includes("DELETE /repos/{owner}/{repo}/git/refs/{ref}"));
  });
});
