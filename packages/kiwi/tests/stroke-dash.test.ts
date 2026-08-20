import { describe, expect, test } from "bun:test";
import { SceneBuilder, solidFill } from "../src/builders/scene-builder";
import { parseSvgDasharray } from "../src/converters/dom-to-scene";

describe("SVG stroke dashes", () => {
  test("parses supported SVG dash lengths", () => {
    expect(parseSvgDasharray("12 6")).toEqual([12, 6]);
    expect(parseSvgDasharray("12px, 6px")).toEqual([12, 6]);
  });

  test("ignores unsupported or solid dash patterns", () => {
    expect(parseSvgDasharray("none")).toBeUndefined();
    expect(parseSvgDasharray("12% 6%")).toBeUndefined();
    expect(parseSvgDasharray("0 0")).toBeUndefined();
  });

  test("writes dash patterns alongside vector stroke settings", () => {
    const builder = new SceneBuilder({ sessionID: 1, pasteID: 1 });
    builder.addVector({
      parent: builder.canvasGuid,
      width: 10,
      height: 10,
      stroke: solidFill(0, 0, 0),
      strokeCap: "ROUND",
      strokeWeight: 4,
      dashPattern: [12, 6],
      network: {
        vertices: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        segments: [{ vStart: 0, vEnd: 1 }],
        regions: [],
      },
    });

    expect(builder.nodes[3]).toMatchObject({
      type: "VECTOR",
      dashPattern: [12, 6],
      strokeCap: "ROUND",
      strokeWeight: 4,
    });
  });
});
