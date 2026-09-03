import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { publishContentToGitHubSchema } from "./content";

const repositoryId = "123456";

describe("publishContentToGitHubSchema", () => {
  test("adds the Markdown extension to a repository-relative path", () => {
    const result = publishContentToGitHubSchema.parse({
      contentType: "changelog",
      repositoryId,
      path: "apps/docs/changelogs/july-update",
    });

    assert.equal(result.path, "apps/docs/changelogs/july-update.md");
  });

  test("does not duplicate an existing Markdown extension", () => {
    const result = publishContentToGitHubSchema.parse({
      contentType: "blog_post",
      repositoryId,
      path: "apps/docs/changelogs/july-update.md",
    });

    assert.equal(result.path, "apps/docs/changelogs/july-update.md");
  });

  test("allows the file path to be omitted", () => {
    const result = publishContentToGitHubSchema.parse({
      contentType: "blog_post",
      repositoryId,
    });

    assert.equal(result.path, undefined);
  });

  test("defaults legacy requests to changelog publishing", () => {
    const result = publishContentToGitHubSchema.parse({ repositoryId });

    assert.equal(result.contentType, "changelog");
  });

  for (const path of [
    "/apps/docs/changelog",
    "apps/docs/",
    "apps//docs/changelog",
    "apps/../docs/changelog",
    "apps\\docs\\changelog",
    "apps/docs/changelog?raw=1",
  ]) {
    test(`rejects unsafe path ${path}`, () => {
      const result = publishContentToGitHubSchema.safeParse({
        contentType: "changelog",
        repositoryId,
        path,
      });

      assert.equal(result.success, false);
    });
  }
});
