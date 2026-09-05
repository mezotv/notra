import { describe, expect, test } from "bun:test";

import type { GeoShelfPlacement, GeoShelfSource } from "@/types/geo-shelf";

import {
  changedShelfOpportunityWrite,
  filterShelfRows,
  toShelfRows,
} from "./geo-shelf";

function sourceWithOwnPlacement(
  status: GeoShelfPlacement["status"]
): GeoShelfSource {
  return {
    id: `source-${status}`,
    url: `https://example.com/${status}`,
    domain: "example.com",
    title: "Example page",
    kind: "other",
    ownership: "third_party",
    origin: "manual",
    fetchStatus: "ok",
    lastFetchedAt: null,
    citations: {
      windowCount: 0,
      totalCount: 0,
      promptCount: 0,
      engines: [],
      firstCitedAt: null,
      lastCitedAt: null,
    },
    placements: [
      {
        competitorId: null,
        brandName: "Notra",
        brandDomain: "notra.ai",
        status,
        position: null,
        hasLink: false,
        evidence: "manual",
        excerpt: null,
        checkedAt: "2026-09-04T00:00:00.000Z",
      },
    ],
    opportunity: null,
    createdByUserId: null,
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  };
}

describe("filterShelfRows", () => {
  test("matches the own brand only when it is present", () => {
    const rows = toShelfRows(
      [sourceWithOwnPlacement("present"), sourceWithOwnPlacement("absent")],
      []
    );
    const filtered = filterShelfRows(rows, {
      search: "Notra",
      shelf: "all",
      ticket: "any",
      currentMemberId: null,
    });

    expect(filtered.map((row) => row.id)).toEqual(["source-present"]);
  });
});

describe("changedShelfOpportunityWrite", () => {
  test("returns only changed ticket fields", () => {
    const original = sourceWithOwnPlacement("absent");
    original.opportunity = {
      id: "opportunity-1",
      status: "open",
      priority: "high",
      assigneeMemberId: "member-1",
      pocMemberId: null,
      notes: "Keep this note",
      dueAt: null,
      createdByUserId: "user-1",
      resolvedAt: null,
      createdAt: "2026-09-04T00:00:00.000Z",
      updatedAt: "2026-09-04T00:00:00.000Z",
    };
    const modified = {
      ...original,
      opportunity: { ...original.opportunity, status: "in_progress" as const },
    };

    expect(changedShelfOpportunityWrite(modified, original)).toEqual({
      status: "in_progress",
    });
  });
});
