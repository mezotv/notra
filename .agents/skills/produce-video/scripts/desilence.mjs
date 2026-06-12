#!/usr/bin/env node
// De-silence WITHOUT quality loss. auto-editor's own export re-encodes the whole video at a
// crushingly low bitrate (~0.6 Mbps), destroying sharpness (esp. faces) before anything
// downstream can matter. So we use auto-editor ONLY to DETECT the loud/quiet segments
// (--export v3, no encode), then cut the ORIGINAL with ffmpeg at near-lossless CRF, keeping
// the original audio. Zero-dep (Node>=22 + auto-editor + ffmpeg/ffprobe).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export function parseArgs(argv) {
  const o = { margin: "0.3s", crf: 12 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--margin") o.margin = argv[++i];
    else if (a === "--crf") o.crf = Number(argv[++i]);
    else if (!a.startsWith("--") && o.input === undefined) o.input = a;
  }
  return o;
}

function sh(cmd, args) {
  return spawnSync(cmd, args, { encoding: "utf8" });
}
function duration(file) {
  const r = sh("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    file,
  ]);
  const d = Number.parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) ? d : null;
}

// Parse auto-editor's v3 timeline into keep-ranges (original seconds): each kept clip is
// original frames [offset, offset+dur) at the timeline's fps.
export function keepRangesFromV3(edl) {
  const [num, den] = String(edl.timebase || "30/1")
    .split("/")
    .map(Number);
  const fps = (num || 30) / (den || 1);
  const clips = (edl.v && edl.v[0]) || [];
  return clips
    .filter((c) => c && c.dur > 0)
    .map((c) => [c.offset / fps, (c.offset + c.dur) / fps]);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.input || !existsSync(o.input)) {
    console.error("[desilence] input not found");
    process.exit(1);
  }
  if (!o.out) {
    console.error("[desilence] --out <file> required");
    process.exit(1);
  }
  for (const bin of ["auto-editor", "ffmpeg", "ffprobe"]) {
    const r = sh(bin, bin === "auto-editor" ? ["--version"] : ["-version"]);
    if (r.error && r.error.code === "ENOENT") {
      console.error(`[desilence] ${bin} is REQUIRED but not found on PATH.`);
      process.exit(1);
    }
  }

  const before = duration(o.input);
  const tmp = path.join(os.tmpdir(), `desilence-${process.pid}`);
  const v3 = `${tmp}.v3`,
    filterFile = `${tmp}.filter`;
  try {
    // 1) DETECT silence only (no encode) -> v3 timeline of kept segments
    const det = sh("auto-editor", [
      o.input,
      "--margin",
      o.margin,
      "--export",
      "v3",
      "-o",
      v3,
      "--no-open",
      "--progress",
      "none",
    ]);
    if (det.status !== 0 || !existsSync(v3)) {
      console.error(
        "[desilence] auto-editor detection failed:",
        det.stderr || det.stdout
      );
      process.exit(1);
    }
    const keep = keepRangesFromV3(JSON.parse(readFileSync(v3, "utf8")));
    if (keep.length === 0) {
      console.error(
        "[desilence] no loud segments detected (margin too tight?)."
      );
      process.exit(1);
    }

    // 2) CUT the original with ffmpeg at near-lossless CRF, keeping original audio
    const parts = [];
    keep.forEach(([a, b], i) => {
      parts.push(
        `[0:v]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}];`
      );
      parts.push(
        `[0:a]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS[a${i}];`
      );
    });
    parts.push(
      `${keep.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${keep.length}:v=1:a=1[v][a]`
    );
    writeFileSync(filterFile, parts.join("\n"), "utf8");

    const r = sh("ffmpeg", [
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
      "256k",
      o.out,
    ]);
    if (r.status !== 0 || !existsSync(o.out)) {
      console.error("[desilence] ffmpeg cut failed:", r.stderr);
      process.exit(1);
    }
  } finally {
    for (const f of [v3, filterFile]) {
      try {
        rmSync(f, { force: true });
      } catch {
        /* best-effort */
      }
    }
  }

  const after = duration(o.out);
  process.stdout.write(
    JSON.stringify({
      ok: true,
      out: o.out,
      crf: o.crf,
      beforeSec: before,
      afterSec: after,
      removedSec:
        before != null && after != null
          ? Math.round((before - after) * 100) / 100
          : null,
    }) + "\n"
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
)
  main();
