#!/usr/bin/env node
// Extract a single video frame at a timestamp, as PNG. Zero-dep (Node >=22 + ffmpeg on PATH).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--at") o.at = Number(argv[++i]);
    else if (a === "--out") o.out = argv[++i];
    else if (!a.startsWith("--") && o.input === undefined) o.input = a;
  }
  return o;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.input || !existsSync(o.input)) {
    console.error("[extract-frame] input file not found");
    process.exit(1);
  }
  if (!Number.isFinite(o.at) || o.at < 0) {
    console.error("[extract-frame] --at <seconds> required (>=0)");
    process.exit(1);
  }
  const out =
    o.out ??
    path.join(path.dirname(path.resolve(o.input)), `frame-${o.at}.png`);
  // -ss before -i for fast seek; one frame; overwrite.
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      String(o.at),
      "-i",
      o.input,
      "-frames:v",
      "1",
      out,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0 || !existsSync(out)) {
    console.error("[extract-frame] ffmpeg failed:", r.stderr);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify({ ok: true, out, at: o.at }) + "\n");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
)
  main();
