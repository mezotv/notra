import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { pinRowsFirst } from "./utils";

describe("pinRowsFirst", () => {
  test("moves matching rows to the front and keeps the rest in order", () => {
    const rows = [
      { id: "copy", row: { name: "Copy.ai", own: false } },
      { id: "own", row: { name: "tapedeck", own: true } },
      { id: "disco", row: { name: "Disco", own: false } },
    ];

    assert.deepEqual(
      pinRowsFirst(rows, (row) => row.own).map((entry) => entry.id),
      ["own", "copy", "disco"]
    );
  });
});
