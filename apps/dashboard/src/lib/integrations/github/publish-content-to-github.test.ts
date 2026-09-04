import assert from "node:assert/strict";
import { test } from "node:test";

import type { GitHubClient } from "../../../types/integrations/github";
import { publishContentDraftPullRequest } from "./publish-content-to-github";

test("refreshes the body when pull request creation races with another publisher", async () => {
  let pullRequestListCalls = 0;
  let patchedBody: string | undefined;

  const octokit = {
    graphql: async () => ({
      createCommitOnBranch: { commit: { oid: "commit-sha" } },
    }),
    request: async (route: string, options: Record<string, unknown>) => {
      if (route === "GET /repos/{owner}/{repo}/git/ref/{ref}") {
        return { data: { object: { sha: "base-sha" } } };
      }
      if (route === "GET /repos/{owner}/{repo}/contents/{path}") {
        throw Object.assign(new Error("Not found"), { status: 404 });
      }
      if (route === "GET /repos/{owner}/{repo}/pulls") {
        pullRequestListCalls += 1;
        return {
          data:
            pullRequestListCalls === 1
              ? []
              : [
                  {
                    html_url: "https://github.com/acme/docs/pull/7",
                    number: 7,
                  },
                ],
        };
      }
      if (route === "POST /repos/{owner}/{repo}/git/refs") {
        return { data: {} };
      }
      if (route === "POST /repos/{owner}/{repo}/pulls") {
        throw new Error("Another publisher created the pull request");
      }
      if (route === "GET /repos/{owner}/{repo}/pulls/{pull_number}") {
        return {
          data: {
            body: "Maintainer-authored context.",
            head: { sha: "commit-sha" },
            state: "open",
          },
        };
      }
      if (route === "PATCH /repos/{owner}/{repo}/pulls/{pull_number}") {
        patchedBody = options.body as string;
        return { data: {} };
      }

      throw new Error(`Unexpected GitHub route: ${route}`);
    },
  } as unknown as GitHubClient;

  const result = await publishContentDraftPullRequest(octokit, {
    contentId: "changelog-123",
    contentType: "changelog",
    defaultBranch: "main",
    markdown: "# Changelog",
    owner: "acme",
    path: "changelogs/release.md",
    repo: "docs",
    title: "Release",
    contentUrl: "https://app.usenotra.com/acme/content/changelog-123",
  });

  assert.equal(result.operation, "created");
  assert.match(patchedBody ?? "", /^Maintainer-authored context\./);
  assert.match(patchedBody ?? "", /<!-- notra:content:start -->/);
  assert.match(
    patchedBody ?? "",
    /\[Open in Notra\]\(https:\/\/app\.usenotra\.com\/acme\/content\/changelog-123\)/
  );
});
