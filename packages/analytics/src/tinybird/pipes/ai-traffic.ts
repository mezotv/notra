import { defineEndpoint, node, p, t } from "@tinybirdco/sdk";

import { TRAILING_DAYS_PARAM } from "../../constants/analytics-params";

export const aiTrafficOverview = defineEndpoint("ai_traffic_overview", {
  description: "AI agent hits per agent over the trailing window",
  params: {
    organization_id: p.string().describe("Organization id"),
    ...TRAILING_DAYS_PARAM,
  },
  nodes: [
    node({
      name: "per_agent",
      sql: `
        SELECT
          agent,
          any(category) AS category,
          any(confidence) AS confidence,
          count() AS hits,
          uniqExact(path) AS paths,
          max(captured_at) AS last_seen_at
        FROM ai_traffic_events
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY agent
        ORDER BY hits DESC, agent ASC
      `,
    }),
  ],
  output: {
    agent: t.string(),
    category: t.string(),
    confidence: t.string(),
    hits: t.uint64(),
    paths: t.uint64(),
    last_seen_at: t.dateTime(),
  },
});

export const aiTrafficTimeseries = defineEndpoint("ai_traffic_timeseries", {
  description: "Daily AI agent hits per category",
  params: {
    organization_id: p.string().describe("Organization id"),
    ...TRAILING_DAYS_PARAM,
  },
  nodes: [
    node({
      name: "daily",
      sql: `
        SELECT
          toDate(captured_at) AS day,
          category,
          count() AS hits
        FROM ai_traffic_events
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY day, category
        ORDER BY day ASC, category ASC
      `,
    }),
  ],
  output: {
    day: t.date(),
    category: t.string(),
    hits: t.uint64(),
  },
});

export const aiTrafficLog = defineEndpoint("ai_traffic_log", {
  description: "Most recent individual AI agent requests, newest first",
  params: {
    organization_id: p.string().describe("Organization id"),
    limit: p.int32().optional(50).describe("Max events"),
  },
  nodes: [
    node({
      name: "recent",
      sql: `
        SELECT
          captured_at,
          agent,
          category,
          confidence,
          path,
          method,
          referer
        FROM ai_traffic_events
        WHERE organization_id = {{String(organization_id)}}
        ORDER BY captured_at DESC
        LIMIT {{Int32(limit, 50)}}
      `,
    }),
  ],
  output: {
    captured_at: t.dateTime(),
    agent: t.string(),
    category: t.string(),
    confidence: t.string(),
    path: t.string(),
    method: t.string(),
    referer: t.string().nullable(),
  },
});
