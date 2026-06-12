#!/usr/bin/env node
// Bake explicit cut ranges out of a video by keeping the complement segments and
// concatenating them (ffmpeg trim/atrim + concat — trims video AND audio identically,
// one re-encode). Zero-dep (Node >=22 + ffmpeg/ffprobe on PATH).
//
// Why not auto-editor --cut-out? Its variadic arg mis-assigns the last range as a
// positional input, and a select-filter approach desyncs audio. trim/concat is reliable.
//
// Usage:
//   node bake-cuts.mjs <input> --out <file> --cut 0,6.52 --cut 14.76,18.79 ...
//   node bake-cuts.mjs <input> --out <file> --cuts-json cuts.json   # cuts.json = [[s,e],...]
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export function parseArgs(argv) {
  const o = { cuts: [], crf: 12 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--cut") {
      const [s, e] = argv[++i].split(",").map(Number);
      o.cuts.push([s, e]);
    } else if (a === "--cuts-json") o.cutsJson = argv[++i];
    else if (a === "--total") o.total = Number(argv[++i]);
    else if (a === "--crf") o.crf = Number(argv[++i]);
    else if (!a.startsWith("--") && o.input === undefined) o.input = a;
  }
  return o;
}

export function keepsFromCuts(cuts, total) {
  const sorted = [...cuts].sort((a, b) => a[0] - b[0]);
  const keeps = [];
  let cursor = 0;
  for (const [s, e] of sorted) {
    if (s > cursor) keeps.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < total) keeps.push([cursor, total]);
  return keeps;
}

function probeDuration(file) {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ],
    { encoding: "utf8" }
  );
  const d = Number.parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) ? d : null;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.input || !existsSync(o.input)) {
    console.error("[bake-cuts] input not found");
    process.exit(1);
  }
  if (!o.out) {
    console.error("[bake-cuts] --out <file> required");
    process.exit(1);
  }
  if (o.cutsJson) {
    try {
      o.cuts = JSON.parse(readFileSync(o.cutsJson, "utf8"));
    } catch (e) {
      console.error("[bake-cuts] could not read --cuts-json:", e.message);
      process.exit(1);
    }
  }
  if (!Array.isArray(o.cuts) || o.cuts.length === 0) {
    console.error(
      "[bake-cuts] provide at least one --cut s,e (or --cuts-json)"
    );
    process.exit(1);
  }
  for (const c of o.cuts) {
    if (
      !Array.isArray(c) ||
      c.length !== 2 ||
      !Number.isFinite(c[0]) ||
      !Number.isFinite(c[1]) ||
      c[1] <= c[0]
    ) {
      console.error(
        "[bake-cuts] bad cut range (need start,end with end>start):",
        JSON.stringify(c)
      );
      process.exit(1);
    }
  }
  const total = o.total ?? probeDuration(o.input);
  if (total == null) {
    console.error(
      "[bake-cuts] could not determine duration; pass --total <sec>"
    );
    process.exit(1);
  }

  const keeps = keepsFromCuts(o.cuts, total);
  if (keeps.length === 0) {
    console.error("[bake-cuts] cuts remove the entire clip");
    process.exit(1);
  }

  const parts = [];
  keeps.forEach(([s, e], k) => {
    parts.push(`[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[v${k}];`);
    parts.push(`[0:a]atrim=start=${s}:end=${e},asetpts=PTS-STARTPTS[a${k}];`);
  });
  parts.push(
    `${keeps.map((_, k) => `[v${k}][a${k}]`).join("")}concat=n=${keeps.length}:v=1:a=1[v][a]`
  );

  const filterFile = path.join(os.tmpdir(), `bake-cuts-${process.pid}.filter`);
  writeFileSync(filterFile, parts.join("\n"), "utf8");
  try {
    const r = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        o.input,
        "-/filter_complex",
        filterFile,
        "-map",
        "[v]",
        "-map",
        "[a]",
        // Dense keyframes (-g 30 -keyint_min 30) + faststart so HyperFrames can seek frame-accurately
        // at render time; sparse keyframes cause "seek failures and frame freezing" / capture stalls.
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        String(o.crf),
        "-g",
        "30",
        "-keyint_min",
        "30",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        o.out,
      ],
      { encoding: "utf8" }
    );
    if (r.status !== 0 || !existsSync(o.out)) {
      console.error("[bake-cuts] ffmpeg failed:", r.stderr);
      process.exit(1);
    }
  } finally {
    try {
      rmSync(filterFile, { force: true });
    } catch {
      /* best-effort */
    }
  }
  const removed = o.cuts.reduce((a, [s, e]) => a + (e - s), 0);
  process.stdout.write(
    JSON.stringify({
      ok: true,
      out: o.out,
      keeps: keeps.length,
      removedSec: Math.round(removed * 100) / 100,
      finalSec: probeDuration(o.out),
    }) + "\n"
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
)
  main();
