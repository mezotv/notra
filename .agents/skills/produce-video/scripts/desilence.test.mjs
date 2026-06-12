import assert from "node:assert/strict";
import { test } from "node:test";
import { keepRangesFromV3, parseArgs } from "./desilence.mjs";

test("defaults: margin 0.3s, crf 12", () => {
  const o = parseArgs(["in.mp4", "--out", "out.mp4"]);
  assert.equal(o.input, "in.mp4");
  assert.equal(o.out, "out.mp4");
  assert.equal(o.margin, "0.3s");
  assert.equal(o.crf, 12);
});

test("margin + crf override", () => {
  const o = parseArgs([
    "in.mp4",
    "--out",
    "o.mp4",
    "--margin",
    "0.5s",
    "--crf",
    "14",
  ]);
  assert.equal(o.margin, "0.5s");
  assert.equal(o.crf, 14);
});

test("keepRangesFromV3 maps clip offset/dur to original seconds at fps", () => {
  const edl = {
    timebase: "30/1",
    v: [
      [
        { dur: 30, offset: 0 }, // original [0, 1)
        { dur: 60, offset: 150 }, // original [5, 7)
      ],
    ],
  };
  assert.deepEqual(keepRangesFromV3(edl), [
    [0, 1],
    [5, 7],
  ]);
});
