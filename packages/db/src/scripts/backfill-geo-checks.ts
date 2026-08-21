/**
 * One-off backfill: copies historic GEO mention checks from the Tinybird
 * `geo_mention_checks` datasource into Postgres (`geo_scans` +
 * `geo_mention_checks`).
 *
 * Run BEFORE the Tinybird deploy that drops the datasource:
 *   bun run --cwd packages/db backfill:geo-checks [--dry-run] [--org <id>]
 *
 * Idempotent: scan ids are derived deterministically from
 * (organization, project, tinybird scan_id) and check inserts skip conflicts
 * on the (scan, engine, prompt, turn, language) unique index. Tinybird never
 * stored the full answer, so `answer` is left empty for backfilled rows.
 *
 * Rows with an empty project_id (written before projects existed) are
 * assigned to the organization's oldest non-sample project — the same
 * resolution the old Tinybird pipes applied via `include_unassigned`.
 */
import { createHash } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../drizzle";
import { geoScans, projects } from "../schema";
import type { GeoCheckWrite } from "../types/geo-checks";
import { insertGeoMentionChecks } from "../utils/geo-checks";

const PAGE_SIZE = 5000;
const UUID_VERSION_NIBBLE = "5";

interface TinybirdScanRow {
  organization_id: string;
  project_id: string;
  scan_id: string;
  started_at: string;
  finished_at: string;
  rows: number;
}

interface TinybirdCheckRow {
  organization_id: string;
  project_id: string;
  scan_id: string;
  engine: string;
  prompt_id: string;
  sequence_id: string;
  turn: number;
  prompt: string;
  captured_at: string;
  mentioned: number | boolean;
  position: number | null;
  sentiment: string | null;
  competitors: string[];
  excerpt: string;
  language: string;
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const orgFlagIndex = process.argv.indexOf("--org");
const orgFilter = orgFlagIndex >= 0 ? process.argv[orgFlagIndex + 1] : null;

function tinybirdBaseUrl(): string {
  return (
    process.env.TINYBIRD_BASE_URL ??
    process.env.TINYBIRD_URL ??
    "https://api.tinybird.co"
  );
}

async function tinybirdSql<T>(query: string): Promise<T[]> {
  const token = process.env.TINYBIRD_TOKEN;
  if (!token) {
    throw new Error("TINYBIRD_TOKEN is not set");
  }
  const response = await fetch(`${tinybirdBaseUrl()}/v0/sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `${query} FORMAT JSON`,
  });
  if (!response.ok) {
    throw new Error(
      `Tinybird SQL failed (${response.status}): ${await response.text()}`
    );
  }
  const payload: { data: T[] } = await response.json();
  return payload.data;
}

function parseClickHouseDateTime(value: string): Date {
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

function escapeSql(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Deterministic UUID (v5-shaped) so re-runs map to the same geo_scans row. */
function scanUuid(organizationId: string, projectId: string, scanId: string) {
  const hex = createHash("sha1")
    .update(`geo-scan:${organizationId}:${projectId}:${scanId}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = UUID_VERSION_NIBBLE;
  hex[16] = "8";
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function orgWhere(): string {
  return orgFilter ? `WHERE organization_id = '${escapeSql(orgFilter)}'` : "";
}

async function loadScans(): Promise<TinybirdScanRow[]> {
  return await tinybirdSql<TinybirdScanRow>(`
    SELECT
      organization_id,
      project_id,
      scan_id,
      min(captured_at) AS started_at,
      max(captured_at) AS finished_at,
      count() AS rows
    FROM geo_mention_checks
    ${orgWhere()}
    GROUP BY organization_id, project_id, scan_id
    ORDER BY organization_id, project_id, started_at
  `);
}

async function loadChecksPage(offset: number): Promise<TinybirdCheckRow[]> {
  return await tinybirdSql<TinybirdCheckRow>(`
    SELECT
      organization_id, project_id, scan_id, engine, prompt_id, sequence_id,
      turn, prompt, captured_at, mentioned, position, sentiment, competitors,
      excerpt, language
    FROM geo_mention_checks
    ${orgWhere()}
    ORDER BY organization_id, project_id, scan_id, engine, prompt_id, turn, language
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `);
}

async function main() {
  console.log(
    `[backfill] ${dryRun ? "DRY RUN — " : ""}reading scans from Tinybird${orgFilter ? ` for org ${orgFilter}` : ""}`
  );
  const scans = await loadScans();
  console.log(`[backfill] ${scans.length} distinct scans in Tinybird`);

  const projectIds = [...new Set(scans.map((scan) => scan.project_id))].filter(
    (id) => id.length > 0
  );
  const knownProjects = new Set(
    projectIds.length > 0
      ? (
          await db
            .select({ id: projects.id })
            .from(projects)
            .where(inArray(projects.id, projectIds))
        ).map((row) => row.id)
      : []
  );

  const unassignedOrgs = [
    ...new Set(
      scans
        .filter((scan) => scan.project_id.length === 0)
        .map((scan) => scan.organization_id)
    ),
  ];
  const fallbackProjectByOrg = new Map<string, string>();
  for (const organizationId of unassignedOrgs) {
    const oldest = await db.query.projects.findFirst({
      columns: { id: true },
      where: eq(projects.organizationId, organizationId),
      orderBy: [asc(projects.isSample), asc(projects.createdAt)],
    });
    if (oldest) {
      fallbackProjectByOrg.set(organizationId, oldest.id);
      knownProjects.add(oldest.id);
    }
  }

  // Tinybird key -> { scan row id, resolved project id }
  const scanIdMap = new Map<string, { id: string; projectId: string }>();
  const skippedScans: TinybirdScanRow[] = [];
  const scanRows: (typeof geoScans.$inferInsert)[] = [];
  for (const scan of scans) {
    const projectId =
      scan.project_id.length > 0
        ? scan.project_id
        : fallbackProjectByOrg.get(scan.organization_id);
    if (!(projectId && knownProjects.has(projectId))) {
      skippedScans.push(scan);
      continue;
    }
    const id = scanUuid(scan.organization_id, projectId, scan.scan_id);
    scanIdMap.set(
      `${scan.organization_id}:${scan.project_id}:${scan.scan_id}`,
      {
        id,
        projectId,
      }
    );
    scanRows.push({
      id,
      organizationId: scan.organization_id,
      projectId,
      status: "completed",
      startedAt: parseClickHouseDateTime(scan.started_at),
      finishedAt: parseClickHouseDateTime(scan.finished_at),
    });
  }
  if (skippedScans.length > 0) {
    const skippedRows = skippedScans.reduce(
      (sum, s) => sum + Number(s.rows),
      0
    );
    console.log(
      `[backfill] skipping ${skippedScans.length} scans (${skippedRows} checks) whose project does not exist in Postgres`
    );
  }

  if (!dryRun && scanRows.length > 0) {
    for (let i = 0; i < scanRows.length; i += 500) {
      await db
        .insert(geoScans)
        .values(scanRows.slice(i, i + 500))
        .onConflictDoNothing({ target: geoScans.id });
    }
  }
  console.log(`[backfill] ${scanRows.length} geo_scans rows ensured`);

  let offset = 0;
  let read = 0;
  let written = 0;
  let skipped = 0;
  for (;;) {
    const page = await loadChecksPage(offset);
    if (page.length === 0) {
      break;
    }
    read += page.length;
    offset += page.length;

    const writes: GeoCheckWrite[] = [];
    for (const row of page) {
      const target = scanIdMap.get(
        `${row.organization_id}:${row.project_id}:${row.scan_id}`
      );
      if (!target) {
        skipped += 1;
        continue;
      }
      writes.push({
        organizationId: row.organization_id,
        projectId: target.projectId,
        scanId: target.id,
        engine: row.engine,
        promptId: row.prompt_id,
        sequenceId: row.sequence_id || null,
        turn: Number(row.turn),
        prompt: row.prompt,
        answer: "",
        mentioned: Boolean(row.mentioned),
        position: row.position === null ? null : Number(row.position),
        sentiment: row.sentiment || null,
        competitors: row.competitors ?? [],
        excerpt: row.excerpt ?? "",
        language: row.language || "English",
        capturedAt: parseClickHouseDateTime(row.captured_at),
      });
    }
    if (dryRun) {
      written += writes.length;
    } else {
      written += await insertGeoMentionChecks(writes);
    }
    console.log(
      `[backfill] read ${read}, ${dryRun ? "would write" : "written"} ${written}, skipped ${skipped}`
    );
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  console.log(
    `[backfill] done. checks read=${read} written=${written} skipped=${skipped}${dryRun ? " (dry run, nothing persisted)" : ""}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[backfill] failed:", error);
    process.exit(1);
  });
