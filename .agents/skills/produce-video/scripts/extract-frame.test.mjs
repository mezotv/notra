import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs } from "./extract-frame.mjs";

test("parses input, --at seconds, --out", () => {
  const o = parseArgs(["v.mp4", "--at", "12.5", "--out", "f.png"]);
  assert.equal(o.input, "v.mp4");
  assert.equal(o.at, 12.5);
  assert.equal(o.out, "f.png");
});

test("default out derived when omitted", () => {
  const o = parseArgs(["v.mp4", "--at", "3"]);
  assert.equal(o.at, 3);
  assert.equal(o.out, undefined);
});
