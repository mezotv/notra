import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { topRivalSharePoint } from "./geo-competitors";

describe("topRivalSharePoint", () => {
  test("skips own brand aliases and empty names", () => {
    const rival = topRivalSharePoint(
      [
        { brand: "TapeDeck", mentions: 90 },
        { brand: "  ", mentions: 80 },
        { brand: "Jasper", mentions: 48 },
        { brand: "Copy.ai", mentions: 12 },
      ],
      "tapedeck",
      ["TapeDeck"]
    );

    assert.deepEqual(rival, { brand: "Jasper", mentions: 48 });
  });
});
