import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildReviewMarkdown, stripReviewMarks } from "@/utils/review-markdown";

describe("buildReviewMarkdown", () => {
  test("wraps replaced words for the write editor", () => {
    assert.equal(
      buildReviewMarkdown(
        "Send files, not streams.",
        "Send streams, not files."
      ),
      "Send ~~files~~==streams==, not ~~streams~~==files==."
    );
  });

  test("returns the updated document when nothing changed", () => {
    assert.equal(buildReviewMarkdown("Hello", "Hello"), "Hello");
  });

  test("marks only the changed hunk when the rest of the article is identical", () => {
    const body = Array.from(
      { length: 40 },
      (_, index) => `Unchanged paragraph ${index}.`
    ).join("\n\n");

    assert.equal(
      buildReviewMarkdown(`Old intro.\n\n${body}`, `New intro.\n\n${body}`),
      `~~Old~~==New== intro.\n\n${body}`
    );
  });

  test("keeps a shared leading blank line", () => {
    assert.equal(
      buildReviewMarkdown("\nOld intro.", "\nNew intro."),
      "\n~~Old~~==New== intro."
    );
  });
});

describe("stripReviewMarks", () => {
  test("keeps additions and drops removals", () => {
    assert.equal(
      stripReviewMarks("Send ~~files~~==streams==, not ~~streams~~==files==."),
      "Send streams, not files."
    );
  });
});
