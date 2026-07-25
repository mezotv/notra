import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { publishChangelogToGitHubSchema } from "./content";

const repositoryId = "123456";

describe("publishChangelogToGitHubSchema", () => {
  test("adds the Markdown extension to a repository-relative path", () => {
    const result = publishChangelogToGitHubSchema.parse({
      repositoryId,
      path: "apps/docs/changelogs/july-update",
    });

    assert.equal(result.path, "apps/docs/changelogs/july-update.md");
  });

  test("does not duplicate an existing Markdown extension", () => {
    const result = publishChangelogToGitHubSchema.parse({
      repositoryId,
      path: "apps/docs/changelogs/july-update.md",
    });

    assert.equal(result.path, "apps/docs/changelogs/july-update.md");
  });

  test("allows the file path to be omitted", () => {
    const result = publishChangelogToGitHubSchema.parse({ repositoryId });

    assert.equal(result.path, undefined);
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
      const result = publishChangelogToGitHubSchema.safeParse({
        repositoryId,
        path,
      });

      assert.equal(result.success, false);
    });
  }
});
