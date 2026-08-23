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
});

describe("stripReviewMarks", () => {
  test("keeps additions and drops removals", () => {
    assert.equal(
      stripReviewMarks("Send ~~files~~==streams==, not ~~streams~~==files==."),
      "Send streams, not files."
    );
  });
});
