import { describe, expect, test } from "bun:test";

import type { GeoShelfPlacement, GeoShelfSource } from "@/types/geo-shelf";

import {
  applyShelfBoardOrder,
  boardColumnsForTicketFilter,
  changedShelfOpportunityWrite,
  filterShelfRows,
  groupRowsByBoardColumn,
  moveShelfBoardItem,
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

describe("groupRowsByBoardColumn", () => {
  test("puts rows without a ticket in untracked", () => {
    const rows = toShelfRows([sourceWithOwnPlacement("present")], []);
    const grouped = groupRowsByBoardColumn(rows);

    expect(grouped.untracked.map((row) => row.id)).toEqual(["source-present"]);
    expect(grouped.open).toEqual([]);
  });
});

describe("boardColumnsForTicketFilter", () => {
  test("keeps every column when the ticket filter is any", () => {
    expect(
      boardColumnsForTicketFilter("any").map((column) => column.id)
    ).toEqual(["untracked", "open", "in_progress", "won", "lost", "dismissed"]);
  });

  test("shows only the in-progress column for that filter", () => {
    expect(
      boardColumnsForTicketFilter("in_progress").map((column) => column.id)
    ).toEqual(["in_progress"]);
  });

  test("shows closed ticket columns for the closed filter", () => {
    expect(
      boardColumnsForTicketFilter("closed").map((column) => column.id)
    ).toEqual(["won", "lost", "dismissed"]);
  });
});

describe("applyShelfBoardOrder", () => {
  test("keeps a previous column order and appends new ids", () => {
    const grouped = groupRowsByBoardColumn(
      toShelfRows(
        [
          sourceWithOwnPlacement("present"),
          sourceWithOwnPlacement("absent"),
          sourceWithOwnPlacement("unknown"),
        ],
        []
      )
    );

    const ordered = applyShelfBoardOrder(grouped, {
      untracked: ["source-unknown", "source-present"],
      open: [],
      in_progress: [],
      won: [],
      lost: [],
      dismissed: [],
    });

    expect(ordered.untracked).toEqual([
      "source-unknown",
      "source-present",
      "source-absent",
    ]);
  });
});

describe("moveShelfBoardItem", () => {
  const items = {
    untracked: ["a"],
    open: ["b", "c"],
    in_progress: [],
    won: [],
    lost: ["d"],
    dismissed: [],
  };

  test("reorders within a column", () => {
    expect(moveShelfBoardItem(items, "b", "c", false)?.open).toEqual([
      "c",
      "b",
    ]);
  });

  test("inserts above a card in another column", () => {
    expect(moveShelfBoardItem(items, "d", "b", false)?.open).toEqual([
      "d",
      "b",
      "c",
    ]);
    expect(moveShelfBoardItem(items, "d", "b", false)?.lost).toEqual([]);
  });

  test("inserts below a card in another column", () => {
    expect(moveShelfBoardItem(items, "d", "b", true)?.open).toEqual([
      "b",
      "d",
      "c",
    ]);
  });

  test("appends when dropping onto an empty column", () => {
    expect(
      moveShelfBoardItem(items, "a", "in_progress", false)?.in_progress
    ).toEqual(["a"]);
    expect(
      moveShelfBoardItem(items, "a", "in_progress", false)?.untracked
    ).toEqual([]);
  });
});
