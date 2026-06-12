import assert from "node:assert/strict";
import { test } from "node:test";
import { keepsFromCuts, parseArgs } from "./bake-cuts.mjs";

test("parses repeatable --cut and --out", () => {
  const o = parseArgs([
    "in.mp4",
    "--out",
    "o.mp4",
    "--cut",
    "0,6.52",
    "--cut",
    "14.76,18.79",
  ]);
  assert.equal(o.input, "in.mp4");
  assert.equal(o.out, "o.mp4");
  assert.deepEqual(o.cuts, [
    [0, 6.52],
    [14.76, 18.79],
  ]);
});

test("keeps are the complement of cuts within total", () => {
  const keeps = keepsFromCuts(
    [
      [0, 6.52],
      [14.76, 18.79],
    ],
    30
  );
  assert.deepEqual(keeps, [
    [6.52, 14.76],
    [18.79, 30],
  ]);
});

test("cut starting at 0 drops the leading keep", () => {
  const keeps = keepsFromCuts([[0, 5]], 20);
  assert.deepEqual(keeps, [[5, 20]]);
});
