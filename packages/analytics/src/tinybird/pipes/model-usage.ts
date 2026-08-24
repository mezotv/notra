import { defineEndpoint, node, p, t } from "@tinybirdco/sdk";

export const modelUsageLatest = defineEndpoint("model_usage_latest", {
  description:
    "Most recent industry-wide usage share snapshot per model, ranked by share",
  params: {
    source: p.string().optional("openrouter").describe("Snapshot source"),
    limit: p.int32().optional(15).describe("Max models"),
  },
  nodes: [
    node({
      name: "latest_capture",
      sql: `
        SELECT max(captured_at) AS latest_captured_at
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
      `,
    }),
    node({
      name: "latest_models",
      sql: `
        SELECT
          model,
          any(captured_at) AS captured_value,
          any(rank) AS rank_value,
          any(share) AS share_value,
          any(raw_tokens) AS tokens_value
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
          AND captured_at = (SELECT latest_captured_at FROM latest_capture)
        GROUP BY model
      `,
    }),
    node({
      name: "ranked_models",
      sql: `
        SELECT
          model,
          captured_value AS captured_at,
          rank_value AS rank,
          share_value AS share,
          tokens_value AS raw_tokens
        FROM latest_models
        ORDER BY share DESC, model ASC
        LIMIT {{Int32(limit, 15)}}
      `,
    }),
  ],
  output: {
    model: t.string(),
    captured_at: t.dateTime(),
    rank: t.uint64(),
    share: t.float64(),
    raw_tokens: t.uint64().nullable(),
  },
});

export const modelUsageTrend = defineEndpoint("model_usage_trend", {
  description: "Weekly usage share per model over the trailing window",
  params: {
    source: p.string().optional("openrouter").describe("Snapshot source"),
    weeks: p.int32().optional(8).describe("Number of trailing weeks"),
  },
  nodes: [
    node({
      name: "weekly_share",
      sql: `
        SELECT
          toMonday(captured_at) AS week,
          model,
          avg(share) AS avg_share,
          max(raw_tokens) AS peak_tokens
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
          AND captured_at >= toMonday(now()) - toIntervalWeek({{Int32(weeks, 8)}})
        GROUP BY week, model
        ORDER BY week ASC, avg_share DESC
      `,
    }),
  ],
  output: {
    week: t.date(),
    model: t.string(),
    avg_share: t.float64(),
    peak_tokens: t.uint64().nullable(),
  },
});
