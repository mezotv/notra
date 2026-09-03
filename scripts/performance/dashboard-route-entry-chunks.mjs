import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const dashboardRoot = "apps/dashboard/.next";
const manifestRoot = join(dashboardRoot, "server/app/(dashboard)");
const staticRoot = join(dashboardRoot, "static");
const outputPath =
  process.argv[2] ?? "/tmp/notra-perf/dashboard-route-entry-chunks.json";

function collectManifests(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectManifests(path));
    } else if (entry.endsWith("_client-reference-manifest.js")) {
      files.push(path);
    }
  }
  return files;
}

function readManifest(path) {
  const assignment = readFileSync(path, "utf8")
    .split("\n")
    .find((line) => line.includes("__RSC_MANIFEST[") && line.includes(" = "));

  if (!assignment) {
    throw new Error(`Could not find manifest assignment in ${path}`);
  }

  return JSON.parse(assignment.slice(assignment.indexOf(" = ") + 3, -1));
}

function routeFor(path) {
  const route = relative(manifestRoot, path)
    .split(sep)
    .join("/")
    .replace(/\/page_client-reference-manifest\.js$/, "")
    .replace(/^page_client-reference-manifest\.js$/, "");
  return route ? `/${route}` : "/";
}

const chunkSizes = new Map();

function getChunkSizes(chunk) {
  const cached = chunkSizes.get(chunk);
  if (cached) {
    return cached;
  }

  const bytes = readFileSync(join(staticRoot, chunk.replace(/^static\//, "")));
  const sizes = {
    raw: bytes.length,
    gz: gzipSync(bytes).length,
    br: brotliCompressSync(bytes).length,
  };
  chunkSizes.set(chunk, sizes);
  return sizes;
}

const routes = collectManifests(manifestRoot).map((path) => {
  const manifest = readManifest(path);
  const entrypoints = Object.keys(manifest.entryJSFiles);
  const chunks = new Set(
    entrypoints.flatMap((entry) => manifest.entryJSFiles[entry])
  );
  const totals = { raw: 0, gz: 0, br: 0 };

  for (const chunk of chunks) {
    const sizes = getChunkSizes(chunk);
    totals.raw += sizes.raw;
    totals.gz += sizes.gz;
    totals.br += sizes.br;
  }

  return {
    route: routeFor(path),
    entrypoints,
    ...totals,
    chunkCount: chunks.size,
    chunks: [...chunks].sort(),
  };
});

routes.sort((left, right) => right.br - left.br);
const report = {
  generatedAt: new Date().toISOString(),
  measurement: {
    scope: "Client-reference manifest entryJSFiles only",
    excludes: [
      "async chunks",
      "CSS",
      "HTML and RSC payloads",
      "runtime network requests",
    ],
    compression: "Locally recompressed with node:zlib gzip and Brotli defaults",
  },
  routeCount: routes.length,
  routes,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      measurement: report.measurement,
      largestRoutes: routes
        .slice(0, 20)
        .map(({ chunks: _, ...route }) => route),
    },
    null,
    2
  )
);
