import { beforeEach, expect, mock, test } from "bun:test";

import { PgDialect } from "drizzle-orm/pg-core";

const settingsWhere = mock(() => ({
  orderBy: async () => [{ organizationId: "org" }],
}));
const scans = mock(async () => [{ id: "yesterday", projectId: "project" }]);
const overview = mock(async () => [{ checks: 10, mentions: 4 }]);
const comparison = mock(async () => ({
  currentScan: { id: "yesterday" },
  previous: [],
  current: [],
}));
const send = mock(async () => ({ data: { id: "email" }, error: null }));

mock.module("@notra/db/drizzle", () => ({
  db: {
    select: () => ({
      from: () => ({ leftJoin: () => ({ where: settingsWhere }) }),
    }),
    query: {
      organizations: {
        findFirst: async () => ({ name: "Acme", slug: "acme" }),
      },
      members: {
        findMany: async () => [
          { users: { email: "first@example.com" } },
          { users: { email: "second@example.com" } },
        ],
      },
      geoScans: { findMany: scans },
      projects: { findMany: async () => [{ id: "project", name: "Project" }] },
    },
  },
}));
mock.module("@notra/db/utils/geo-checks", () => ({
  queryGeoCheckOverview: overview,
  queryGeoScanComparison: comparison,
  toGeoCheckWindow: (value: unknown) => value,
}));
mock.module("@notra/email/utils/resend", () => ({ getResend: () => ({}) }));
mock.module("@/lib/email/send", () => ({ sendDailySummaryEmail: send }));
const { runDailySummaryCron } = await import("./daily-summary");

beforeEach(() => {
  settingsWhere.mockClear();
  comparison.mockClear();
  send.mockClear();
  scans.mockResolvedValue([{ id: "yesterday", projectId: "project" }]);
  overview.mockResolvedValue([{ checks: 10, mentions: 4 }]);
});

test("includes default settings and bounds the comparison to the reporting day", async () => {
  const result = await runDailySummaryCron(new Date("2026-09-05T08:00:00Z"));
  expect(result.emailsSent).toBe(2);
  expect(comparison).toHaveBeenCalledWith({
    projectId: "project",
    window: {
      from: new Date("2026-09-04T00:00:00Z"),
      toExclusive: new Date("2026-09-05T00:00:00Z"),
    },
  });
  const predicate = new PgDialect().sqlToQuery(settingsWhere.mock.calls[0][0]);
  expect(predicate.sql).toContain('"daily_summary" = $1');
  expect(predicate.sql).toContain(
    'or "organization_notification_settings"."id" is null'
  );
  expect(predicate.params).toEqual([true]);
});

test("one rejected recipient does not block other owners or erase successful counts", async () => {
  send.mockResolvedValueOnce({
    data: null,
    error: { name: "validation_error", message: "Invalid recipient" },
  });
  const result = await runDailySummaryCron(new Date("2026-09-05T08:00:00Z"));
  expect(send).toHaveBeenCalledTimes(2);
  expect(result.emailsSent).toBe(1);
  expect(result.failed).toBe(1);
});

test("quiet organizations do not send emails", async () => {
  scans.mockResolvedValue([]);
  overview.mockResolvedValue([]);
  const result = await runDailySummaryCron(new Date("2026-09-05T08:00:00Z"));
  expect(result.skippedQuiet).toBe(1);
  expect(send).not.toHaveBeenCalled();
});
