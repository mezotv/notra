import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getEditMarkdownDiff } from "@/utils/chat-document-diff";

describe("getEditMarkdownDiff", () => {
  test("reads previous and updated markdown from a successful edit", () => {
    const diff = getEditMarkdownDiff({
      success: true,
      filename: "notes.md",
      previousMarkdown: "Hello",
      updatedMarkdown: "Hello world",
    });

    assert.deepEqual(diff, {
      filename: "notes.md",
      previousMarkdown: "Hello",
      updatedMarkdown: "Hello world",
    });
  });

  test("ignores failed edits and unchanged documents", () => {
    assert.equal(
      getEditMarkdownDiff({
        success: false,
        previousMarkdown: "A",
        updatedMarkdown: "B",
      }),
      null
    );
    assert.equal(
      getEditMarkdownDiff({
        success: true,
        previousMarkdown: "Same",
        updatedMarkdown: "Same",
      }),
      null
    );
    assert.equal(
      getEditMarkdownDiff({ success: true, updatedMarkdown: "Only new" }),
      null
    );
  });
});
