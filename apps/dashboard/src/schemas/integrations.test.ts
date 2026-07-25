import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  repositoryContentDirectoryConfigSchema,
  repositoryContentDirectoryInputSchema,
  repositoryContentDirectorySchema,
} from "./integrations";

describe("repositoryContentDirectorySchema", () => {
  test("accepts the repository root and nested directories", () => {
    assert.equal(repositoryContentDirectorySchema.parse(""), "");
    assert.equal(
      repositoryContentDirectorySchema.parse("apps/docs/changelogs"),
      "apps/docs/changelogs"
    );
  });

  for (const directory of [
    "/changelogs",
    "changelogs/",
    "apps//changelogs",
    "apps/../changelogs",
    "apps\\changelogs",
    "changelogs?ref=main",
  ]) {
    test(`rejects unsafe directory ${directory}`, () => {
      assert.equal(
        repositoryContentDirectorySchema.safeParse(directory).success,
        false
      );
    });
  }
});

describe("repositoryContentDirectoryConfigSchema", () => {
  test("keeps unrelated output configuration", () => {
    const config = repositoryContentDirectoryConfigSchema.parse({
      directory: "changelogs",
      format: "markdown",
    });

    assert.equal(config.directory, "changelogs");
    assert.equal(config.format, "markdown");
  });
});

describe("repositoryContentDirectoryInputSchema", () => {
  test("only accepts supported output types", () => {
    assert.equal(
      repositoryContentDirectoryInputSchema.safeParse({
        contentType: "changelog",
      }).success,
      true
    );
    assert.equal(
      repositoryContentDirectoryInputSchema.safeParse({
        contentType: "unsupported",
      }).success,
      false
    );
  });
});
