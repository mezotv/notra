import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { GeoCheckScanComparisonInput } from "../src/types/geo-checks";

// Run with TEST_DATABASE_URL pointing to a local PostgreSQL database.
// All fixtures live in connection-local temporary tables, never app tables.
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "GEO scan comparison SQL",
  () => {
    const pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 1,
    });
    let queryGeoScanComparison: typeof import("../src/utils/geo-checks").queryGeoScanComparison;
    const input: GeoCheckScanComparisonInput = {
      projectId: "project",
      window: {
        from: new Date("2026-09-04T00:00:00Z"),
        toExclusive: new Date("2026-09-05T00:00:00Z"),
      },
    };

    beforeAll(async () => {
      await pool.query(`
      CREATE TEMP TABLE geo_scans (
        id text PRIMARY KEY, project_id text, status text,
        started_at timestamp, finished_at timestamp
      );
      CREATE TEMP TABLE geo_mention_checks (
        scan_id text, project_id text, engine text DEFAULT 'openai',
        prompt_id text DEFAULT 'prompt', prompt text DEFAULT 'Which tool?',
        mentioned boolean, position integer, competitors text[] DEFAULT '{}',
        grounding jsonb DEFAULT '{"queries":[],"sources":[]}',
        captured_at timestamp DEFAULT now(), turn integer DEFAULT 0,
        sequence_id text, language text DEFAULT 'English'
      );
    `);
      mock.module("../src/drizzle", () => ({ db: drizzle(pool) }));
      ({ queryGeoScanComparison } = await import("../src/utils/geo-checks"));
    });

    beforeEach(async () => {
      await pool.query(
        "TRUNCATE pg_temp.geo_scans, pg_temp.geo_mention_checks"
      );
    });

    afterAll(async () => {
      mock.restore();
      await pool.end();
    });

    async function scan(
      id: string,
      finished: string | null,
      mentioned = false,
      started = finished
    ) {
      await pool.query(
        "INSERT INTO pg_temp.geo_scans VALUES ($1, 'project', 'completed', $2, $3)",
        [id, started, finished]
      );
      await pool.query(
        "INSERT INTO pg_temp.geo_mention_checks (scan_id, project_id, mentioned) VALUES ($1, 'project', $2)",
        [id, mentioned]
      );
    }

    test("compares closing snapshots and ignores today's scans on reruns", async () => {
      await scan("baseline", "2026-09-03T23:00:00Z");
      await scan("morning", "2026-09-04T08:00:00Z", true);
      await scan("evening", "2026-09-04T20:00:00Z", true);
      const before = await queryGeoScanComparison(input);
      expect(before.previousScan?.id).toBe("baseline");
      expect(before.currentScan?.id).toBe("evening");
      expect(before.previous[0]?.mentioned).toBe(false);
      expect(before.current[0]?.mentioned).toBe(true);
      await scan("today", "2026-09-05T06:00:00Z");
      expect(await queryGeoScanComparison(input)).toEqual(before);
    });

    test("does not report an intraday reversal as a daily gain", async () => {
      await scan("baseline", "2026-09-03T23:00:00Z", true);
      await scan("morning", "2026-09-04T08:00:00Z");
      await scan("evening", "2026-09-04T20:00:00Z", true);
      const result = await queryGeoScanComparison(input);
      expect(result.previous[0]?.mentioned).toBe(result.current[0]?.mentioned);
    });

    test("uses completion order for overlaps and deterministic ties", async () => {
      await scan("old", "2026-09-03T22:00:00Z", false, "2026-09-03T21:00:00Z");
      await scan(
        "baseline",
        "2026-09-03T23:00:00Z",
        false,
        "2026-09-03T20:00:00Z"
      );
      await scan(
        "later-start",
        "2026-09-04T18:00:00Z",
        false,
        "2026-09-04T17:00:00Z"
      );
      await scan("a", "2026-09-04T20:00:00Z", true, "2026-09-04T10:00:00Z");
      await scan("z", "2026-09-04T20:00:00Z", true, "2026-09-04T09:00:00Z");
      const result = await queryGeoScanComparison(input);
      expect(result.previousScan?.id).toBe("baseline");
      expect(result.currentScan?.id).toBe("z");
      const unbounded = await queryGeoScanComparison({ projectId: "project" });
      expect(unbounded.currentScan?.id).toBe("later-start");
      expect(unbounded.previousScan?.id).toBe("a");
    });

    test("respects exclusive cutoffs, status, project and null completion", async () => {
      await scan("baseline", "2026-09-01T00:00:00Z");
      await scan("start", "2026-09-04T00:00:00Z", true);
      await scan("end", "2026-09-05T00:00:00Z");
      await scan("failed", "2026-09-04T22:00:00Z");
      await scan("running", "2026-09-04T23:00:00Z");
      await scan("other", "2026-09-04T23:30:00Z");
      await scan("null", null, false, "2026-09-04T23:00:00Z");
      await pool.query(
        "UPDATE pg_temp.geo_scans SET status = id WHERE id IN ('failed', 'running')"
      );
      await pool.query(
        "UPDATE pg_temp.geo_scans SET project_id = 'other' WHERE id = 'other'"
      );
      const result = await queryGeoScanComparison(input);
      expect(result.previousScan?.id).toBe("baseline");
      expect(result.currentScan?.id).toBe("start");
    });

    test("no baseline does not synthesize new-engine changes", async () => {
      expect((await queryGeoScanComparison(input)).currentScan).toBeNull();
      await scan("first", "2026-09-04T08:00:00Z", true);
      expect(
        (await queryGeoScanComparison({ projectId: "project" })).current
      ).toEqual([]);
      await scan("second", "2026-09-04T20:00:00Z", true);
      const result = await queryGeoScanComparison(input);
      expect(result.currentScan?.id).toBe("second");
      expect(result.previousScan).toBeNull();
      expect(result.previous).toEqual([]);
      expect(result.current).toEqual([]);
    });

    test("carries forward an unchanged snapshot when the window has no scans", async () => {
      await scan("baseline", "2026-09-03T20:00:00Z", true);
      const result = await queryGeoScanComparison(input);
      expect(result.currentScan).toEqual(result.previousScan);
      expect(result.current).toHaveLength(1);
      expect(result.current).toEqual(result.previous);
    });
  }
);
