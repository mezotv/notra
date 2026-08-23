import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createMarkdownTools } from "./edit-markdown";

describe("createMarkdownTools", () => {
  test("returns previous and updated markdown for a line replacement", async () => {
    let latest = "";
    const { editMarkdown } = createMarkdownTools({
      currentMarkdown: "hello\nworld",
      onUpdate: (markdown) => {
        latest = markdown;
      },
    });

    const execute = editMarkdown.execute;
    assert.ok(execute);
    const result = await execute(
      { operations: [{ op: "replaceLine", line: 1, content: "hi" }] },
      {
        toolCallId: "test",
        messages: [],
        abortSignal: new AbortController().signal,
      }
    );

    assert.deepEqual(result, {
      success: true,
      lineCount: 2,
      filename: "document.md",
      previousMarkdown: "hello\nworld",
      updatedMarkdown: "hi\nworld",
    });
    assert.equal(latest, "hi\nworld");
  });
});
