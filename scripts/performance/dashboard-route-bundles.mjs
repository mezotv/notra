import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const analyzeRoot = "apps/dashboard/.next/diagnostics/analyze/data";
const outputPath =
  process.argv[2] ?? "/tmp/notra-perf/dashboard-route-bundles.json";

if (!existsSync(analyzeRoot)) {
  throw new Error(
    `Missing ${analyzeRoot}. Run "cd apps/dashboard && bunx next experimental-analyze --output" first.`
  );
}

function collectAnalyzeFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectAnalyzeFiles(path));
    } else if (entry === "analyze.data") {
      files.push(path);
    }
  }
  return files;
}

function parseAnalyzeData(path) {
  const bytes = readFileSync(path);
  const headerLength = bytes.readUInt32BE(0);
  const header = JSON.parse(
    bytes.subarray(4, 4 + headerLength).toString("utf8")
  );
  const sourcePaths = new Map();

  function sourcePath(index) {
    const cached = sourcePaths.get(index);
    if (cached !== undefined) {
      return cached;
    }

    const source = header.sources[index];
    const path =
      source.parent_source_index === null
        ? source.path
        : `${sourcePath(source.parent_source_index)}${source.path}`;
    sourcePaths.set(index, path);
    return path;
  }

  return { header, sourcePath };
}

function routeFor(path) {
  const directory = relative(analyzeRoot, dirname(path)).split(sep).join("/");
  return directory ? `/${directory}` : "/";
}

function sourceGroup(path) {
  const nodeModulesPosition = path.lastIndexOf("/node_modules/");
  if (nodeModulesPosition !== -1) {
    const packagePath = path.slice(
      nodeModulesPosition + "/node_modules/".length
    );
    const segments = packagePath.split("/");
    return segments[0].startsWith("@")
      ? `${segments[0]}/${segments[1]}`
      : segments[0];
  }

  const dashboardSource = "[project]/apps/dashboard/src/";
  if (path.startsWith(dashboardSource)) {
    return `dashboard/${path.slice(dashboardSource.length).split("/")[0]}`;
  }

  const workspacePackage = "[project]/packages/";
  if (path.startsWith(workspacePackage)) {
    return `@notra/${path.slice(workspacePackage.length).split("/")[0]}`;
  }

  return "other";
}

function rankedEntries(map, limit) {
  return [...map.entries()]
    .sort((left, right) => right[1].compressedBytes - left[1].compressedBytes)
    .slice(0, limit)
    .map(([name, sizes]) => ({
      name,
      bytes: sizes.bytes,
      compressedBytes: sizes.compressedBytes,
      ...(sizes.files ? { files: [...sizes.files].sort() } : {}),
    }));
}

const routes = collectAnalyzeFiles(analyzeRoot).map((path) => {
  const { header, sourcePath } = parseAnalyzeData(path);
  const totals = {
    jsBytes: 0,
    jsAnalyzerCompressedBytes: 0,
    cssBytes: 0,
    cssAnalyzerCompressedBytes: 0,
  };
  const sources = new Map();
  const groups = new Map();
  const outputFiles = new Set();

  for (const part of header.chunk_parts) {
    const output = header.output_files[part.output_file_index]?.filename ?? "";
    if (!output.startsWith("[client-fs]/")) {
      continue;
    }

    const isJavaScript = /\.(?:c|m)?js$/.test(output);
    const isCss = output.endsWith(".css");
    if (!(isJavaScript || isCss)) {
      continue;
    }

    outputFiles.add(output);
    if (isJavaScript) {
      totals.jsBytes += part.size;
      totals.jsAnalyzerCompressedBytes += part.compressed_size;
    } else {
      totals.cssBytes += part.size;
      totals.cssAnalyzerCompressedBytes += part.compressed_size;
    }

    const source = sourcePath(part.source_index);
    const sourceSizes = sources.get(source) ?? {
      bytes: 0,
      compressedBytes: 0,
      files: new Set(),
    };
    sourceSizes.bytes += part.size;
    sourceSizes.compressedBytes += part.compressed_size;
    sourceSizes.files.add(output.replace(/^\[client-fs\]\//, ""));
    sources.set(source, sourceSizes);

    const group = sourceGroup(source);
    const groupSizes = groups.get(group) ?? { bytes: 0, compressedBytes: 0 };
    groupSizes.bytes += part.size;
    groupSizes.compressedBytes += part.compressed_size;
    groups.set(group, groupSizes);
  }

  return {
    route: routeFor(path),
    ...totals,
    clientOutputFiles: outputFiles.size,
    topGroups: rankedEntries(groups, 12),
    topSources: rankedEntries(sources, 20),
  };
});

routes.sort(
  (left, right) =>
    right.jsAnalyzerCompressedBytes - left.jsAnalyzerCompressedBytes
);
const report = {
  generatedAt: new Date().toISOString(),
  measurement: {
    scope:
      "All emitted client chunk parts attributed to each Turbopack route analysis",
    excludes: [
      "server chunks",
      "HTML and RSC payloads",
      "runtime loading order",
    ],
    compression:
      "Turbopack analyze.data compressed_size; not labeled as gzip or Brotli",
  },
  routeCount: routes.length,
  routes,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    { routeCount: report.routeCount, largestRoutes: routes.slice(0, 25) },
    null,
    2
  )
);
