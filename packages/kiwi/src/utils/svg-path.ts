import type { PathPoint, PathSubpath } from "../types/svg-path";

export type { PathPoint, PathSubpath } from "../types/svg-path";

const CMD_RE = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
const NUM_RE = /-?\d*\.?\d+(?:[eE][+-]?\d+)?/g;

function parseNumbers(s: string): number[] {
  const out: number[] = [];
  let m: RegExpExecArray | null = NUM_RE.exec(s);
  while (m) {
    out.push(Number.parseFloat(m[0]));
    m = NUM_RE.exec(s);
  }
  NUM_RE.lastIndex = 0;
  return out;
}

function flattenCubic(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  steps: number,
  out: PathPoint[]
): void {
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x =
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x;
    const y =
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y;
    out.push({ x, y });
  }
}

function flattenQuadratic(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  steps: number,
  out: PathPoint[]
): void {
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
    const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
    out.push({ x, y });
  }
}

function flattenArc(
  p0: PathPoint,
  rxAbs: number,
  ryAbs: number,
  xRotDeg: number,
  largeArc: boolean,
  sweep: boolean,
  p1: PathPoint,
  steps: number,
  out: PathPoint[]
): void {
  let rx = Math.abs(rxAbs);
  let ry = Math.abs(ryAbs);
  if (rx === 0 || ry === 0) {
    out.push({ x: p1.x, y: p1.y });
    return;
  }
  const rad = (xRotDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const dx = (p0.x - p1.x) / 2;
  const dy = (p0.y - p1.y) / 2;
  const x1p = cosR * dx + sinR * dy;
  const y1p = -sinR * dx + cosR * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const sign = largeArc === sweep ? -1 : 1;
  const numer = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const denom = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, numer / denom));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cosR * cxp - sinR * cyp + (p0.x + p1.x) / 2;
  const cy = sinR * cxp + cosR * cyp + (p0.y + p1.y) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) {
      a = -a;
    }
    return a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let deltaTheta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry
  );
  if (!sweep && deltaTheta > 0) {
    deltaTheta -= 2 * Math.PI;
  } else if (sweep && deltaTheta < 0) {
    deltaTheta += 2 * Math.PI;
  }

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const theta = theta1 + deltaTheta * t;
    const x = cosR * rx * Math.cos(theta) - sinR * ry * Math.sin(theta) + cx;
    const y = sinR * rx * Math.cos(theta) + cosR * ry * Math.sin(theta) + cy;
    out.push({ x, y });
  }
}

const CURVE_STEPS = 12;
const ARC_STEPS = 18;

export function parseSvgPath(d: string): PathSubpath[] {
  const subpaths: PathSubpath[] = [];
  let current: PathSubpath | null = null;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCubic: PathPoint | null = null;
  let lastQuad: PathPoint | null = null;

  const ensureSubpath = (): PathSubpath => {
    if (!current) {
      current = { points: [], closed: false };
      subpaths.push(current);
    }
    return current;
  };

  const startSubpath = (x: number, y: number) => {
    current = { points: [{ x, y }], closed: false };
    subpaths.push(current);
    cx = x;
    cy = y;
    startX = x;
    startY = y;
  };

  CMD_RE.lastIndex = 0;
  let m: RegExpExecArray | null = CMD_RE.exec(d);
  while (m) {
    const cmd = m[1];
    if (!cmd) {
      m = CMD_RE.exec(d);
      continue;
    }
    const args = parseNumbers(m[2] ?? "");
    const lower = cmd.toLowerCase();
    const isRel = cmd !== cmd.toUpperCase();

    if (lower === "m") {
      let i = 0;
      const firstX = isRel ? cx + (args[i++] ?? 0) : (args[i++] ?? 0);
      const firstY = isRel ? cy + (args[i++] ?? 0) : (args[i++] ?? 0);
      startSubpath(firstX, firstY);
      while (i < args.length) {
        const x = isRel ? cx + (args[i++] ?? 0) : (args[i++] ?? 0);
        const y = isRel ? cy + (args[i++] ?? 0) : (args[i++] ?? 0);
        ensureSubpath().points.push({ x, y });
        cx = x;
        cy = y;
      }
      lastCubic = null;
      lastQuad = null;
    } else if (lower === "l") {
      for (let i = 0; i + 1 < args.length; i += 2) {
        const x = isRel ? cx + (args[i] ?? 0) : (args[i] ?? 0);
        const y = isRel ? cy + (args[i + 1] ?? 0) : (args[i + 1] ?? 0);
        ensureSubpath().points.push({ x, y });
        cx = x;
        cy = y;
      }
      lastCubic = null;
      lastQuad = null;
    } else if (lower === "h") {
      for (const arg of args) {
        const x = isRel ? cx + arg : arg;
        ensureSubpath().points.push({ x, y: cy });
        cx = x;
      }
      lastCubic = null;
      lastQuad = null;
    } else if (lower === "v") {
      for (const arg of args) {
        const y = isRel ? cy + arg : arg;
        ensureSubpath().points.push({ x: cx, y });
        cy = y;
      }
      lastCubic = null;
      lastQuad = null;
    } else if (lower === "c") {
      for (let i = 0; i + 5 < args.length; i += 6) {
        const x1 = isRel ? cx + (args[i] ?? 0) : (args[i] ?? 0);
        const y1 = isRel ? cy + (args[i + 1] ?? 0) : (args[i + 1] ?? 0);
        const x2 = isRel ? cx + (args[i + 2] ?? 0) : (args[i + 2] ?? 0);
        const y2 = isRel ? cy + (args[i + 3] ?? 0) : (args[i + 3] ?? 0);
        const x = isRel ? cx + (args[i + 4] ?? 0) : (args[i + 4] ?? 0);
        const y = isRel ? cy + (args[i + 5] ?? 0) : (args[i + 5] ?? 0);
        flattenCubic(
          { x: cx, y: cy },
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x, y },
          CURVE_STEPS,
          ensureSubpath().points
        );
        cx = x;
        cy = y;
        lastCubic = { x: x2, y: y2 };
      }
      lastQuad = null;
    } else if (lower === "s") {
      for (let i = 0; i + 3 < args.length; i += 4) {
        const x2 = isRel ? cx + (args[i] ?? 0) : (args[i] ?? 0);
        const y2 = isRel ? cy + (args[i + 1] ?? 0) : (args[i + 1] ?? 0);
        const x = isRel ? cx + (args[i + 2] ?? 0) : (args[i + 2] ?? 0);
        const y = isRel ? cy + (args[i + 3] ?? 0) : (args[i + 3] ?? 0);
        const x1 = lastCubic ? 2 * cx - lastCubic.x : cx;
        const y1 = lastCubic ? 2 * cy - lastCubic.y : cy;
        flattenCubic(
          { x: cx, y: cy },
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x, y },
          CURVE_STEPS,
          ensureSubpath().points
        );
        cx = x;
        cy = y;
        lastCubic = { x: x2, y: y2 };
      }
      lastQuad = null;
    } else if (lower === "q") {
      for (let i = 0; i + 3 < args.length; i += 4) {
        const x1 = isRel ? cx + (args[i] ?? 0) : (args[i] ?? 0);
        const y1 = isRel ? cy + (args[i + 1] ?? 0) : (args[i + 1] ?? 0);
        const x = isRel ? cx + (args[i + 2] ?? 0) : (args[i + 2] ?? 0);
        const y = isRel ? cy + (args[i + 3] ?? 0) : (args[i + 3] ?? 0);
        flattenQuadratic(
          { x: cx, y: cy },
          { x: x1, y: y1 },
          { x, y },
          CURVE_STEPS,
          ensureSubpath().points
        );
        cx = x;
        cy = y;
        lastQuad = { x: x1, y: y1 };
      }
      lastCubic = null;
    } else if (lower === "t") {
      for (let i = 0; i + 1 < args.length; i += 2) {
        const x = isRel ? cx + (args[i] ?? 0) : (args[i] ?? 0);
        const y = isRel ? cy + (args[i + 1] ?? 0) : (args[i + 1] ?? 0);
        const x1: number = lastQuad ? 2 * cx - lastQuad.x : cx;
        const y1: number = lastQuad ? 2 * cy - lastQuad.y : cy;
        flattenQuadratic(
          { x: cx, y: cy },
          { x: x1, y: y1 },
          { x, y },
          CURVE_STEPS,
          ensureSubpath().points
        );
        cx = x;
        cy = y;
        lastQuad = { x: x1, y: y1 };
      }
      lastCubic = null;
    } else if (lower === "a") {
      for (let i = 0; i + 6 < args.length; i += 7) {
        const rx = args[i] ?? 0;
        const ry = args[i + 1] ?? 0;
        const xRot = args[i + 2] ?? 0;
        const largeArc = (args[i + 3] ?? 0) !== 0;
        const sweep = (args[i + 4] ?? 0) !== 0;
        const x = isRel ? cx + (args[i + 5] ?? 0) : (args[i + 5] ?? 0);
        const y = isRel ? cy + (args[i + 6] ?? 0) : (args[i + 6] ?? 0);
        flattenArc(
          { x: cx, y: cy },
          rx,
          ry,
          xRot,
          largeArc,
          sweep,
          { x, y },
          ARC_STEPS,
          ensureSubpath().points
        );
        cx = x;
        cy = y;
      }
      lastCubic = null;
      lastQuad = null;
    } else if (lower === "z") {
      const sub = ensureSubpath();
      sub.closed = true;
      cx = startX;
      cy = startY;
      lastCubic = null;
      lastQuad = null;
      current = null;
    }

    m = CMD_RE.exec(d);
  }

  return subpaths.filter((s) => s.points.length >= 2);
}
