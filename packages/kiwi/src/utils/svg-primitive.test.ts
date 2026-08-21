import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { PathSubpath } from "../types/svg-path";
import { svgPrimitiveToSubpaths } from "./svg-primitive";

function bounds(subpaths: PathSubpath[]) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const sub of subpaths) {
    for (const p of sub.points) {
      if (p.x < minX) {
        minX = p.x;
      }
      if (p.y < minY) {
        minY = p.y;
      }
      if (p.x > maxX) {
        maxX = p.x;
      }
      if (p.y > maxY) {
        maxY = p.y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

describe("svgPrimitiveToSubpaths", () => {
  test("circle is a closed loop around its bbox", () => {
    const subpaths = svgPrimitiveToSubpaths("circle", {
      cx: "10",
      cy: "10",
      r: "10",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, true);
    assert.ok((sub?.points.length ?? 0) >= 4);
    const box = bounds(subpaths);
    assert.ok(Math.abs(box.minX - 0) < 0.5);
    assert.ok(Math.abs(box.maxX - 20) < 0.5);
    assert.ok(Math.abs(box.minY - 0) < 0.5);
    assert.ok(Math.abs(box.maxY - 20) < 0.5);
  });

  test("ellipse is a closed loop around its bbox", () => {
    const subpaths = svgPrimitiveToSubpaths("ellipse", {
      cx: "8",
      cy: "4",
      rx: "8",
      ry: "4",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, true);
    assert.ok((sub?.points.length ?? 0) >= 4);
    const box = bounds(subpaths);
    assert.ok(Math.abs(box.minX - 0) < 0.5);
    assert.ok(Math.abs(box.maxX - 16) < 0.5);
    assert.ok(Math.abs(box.minY - 0) < 0.5);
    assert.ok(Math.abs(box.maxY - 8) < 0.5);
  });

  test("rect is a closed box at its corners", () => {
    const subpaths = svgPrimitiveToSubpaths("rect", {
      x: "1",
      y: "2",
      width: "10",
      height: "8",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, true);
    assert.deepEqual(sub?.points, [
      { x: 1, y: 2 },
      { x: 11, y: 2 },
      { x: 11, y: 10 },
      { x: 1, y: 10 },
    ]);
  });

  test("line is an open two-point path", () => {
    const subpaths = svgPrimitiveToSubpaths("line", {
      x1: "0",
      y1: "0",
      x2: "5",
      y2: "10",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, false);
    assert.deepEqual(sub?.points, [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
    ]);
  });

  test("polyline is an open path through its points", () => {
    const subpaths = svgPrimitiveToSubpaths("polyline", {
      points: "0,0 4,0 4,3",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, false);
    assert.deepEqual(sub?.points, [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ]);
  });

  test("polygon is a closed path through its points", () => {
    const subpaths = svgPrimitiveToSubpaths("polygon", {
      points: "0 0 6 0 3 4",
    });
    assert.equal(subpaths.length, 1);
    const sub = subpaths[0];
    assert.equal(sub?.closed, true);
    assert.deepEqual(sub?.points, [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 3, y: 4 },
    ]);
  });
});
