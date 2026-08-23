import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "../drizzle";
import { geoMentionChecks } from "../schema";
import type {
  GeoCheckCompetitorPromptRow,
  GeoCheckCompetitorShareRow,
  GeoCheckCompetitorTimeseriesRow,
  GeoCheckLanguageShareRow,
  GeoCheckOverviewRow,
  GeoCheckPromptResultRow,
  GeoCheckScope,
  GeoCheckSequenceResultRow,
  GeoCheckTimeseriesRow,
  GeoCheckWindow,
  GeoCheckWindowInput,
  GeoCheckWrite,
} from "../types/geo-checks";

const ENGLISH_LANGUAGES = ["", "English"] as const;
const CHECK_INSERT_CHUNK = 250;

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(String(value));
}

function toDay(value: unknown): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return toDate(value).toISOString().slice(0, 10);
}

function scopeWhere(scope: GeoCheckScope): SQL {
  if (scope.projectId) {
    return and(
      eq(geoMentionChecks.organizationId, scope.organizationId),
      eq(geoMentionChecks.projectId, scope.projectId)
    ) as SQL;
  }
  return eq(geoMentionChecks.organizationId, scope.organizationId);
}

const DAY_MS = 86_400_000;

export function toGeoCheckWindow(
  input: GeoCheckWindowInput | undefined
): GeoCheckWindow | undefined {
  if (!input) {
    return;
  }
  if (input.from) {
    const from = new Date(`${input.from}T00:00:00.000Z`);
    const toExclusive = input.to
      ? new Date(new Date(`${input.to}T00:00:00.000Z`).getTime() + DAY_MS)
      : undefined;
    return { from, toExclusive };
  }
  if (input.days === undefined) {
    return;
  }
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - input.days);
  return { from };
}

function capturedWithin(window: GeoCheckWindow | undefined): SQL[] {
  if (!window) {
    return [];
  }
  const parts: SQL[] = [];
  if (window.from) {
    parts.push(gte(geoMentionChecks.capturedAt, window.from));
  }
  if (window.toExclusive) {
    parts.push(lt(geoMentionChecks.capturedAt, window.toExclusive));
  }
  return parts;
}

function mentionFilters(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined,
  options?: { sequences?: "single"; englishOnly?: boolean }
): SQL {
  const parts: SQL[] = [scopeWhere(scope), ...capturedWithin(window)];
  if (options?.sequences === "single") {
    parts.push(isNull(geoMentionChecks.sequenceId));
  }
  if (options?.englishOnly) {
    parts.push(inArray(geoMentionChecks.language, [...ENGLISH_LANGUAGES]));
  }
  return and(...parts) as SQL;
}

export async function insertGeoMentionChecks(
  rows: GeoCheckWrite[]
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  let written = 0;
  for (let index = 0; index < rows.length; index += CHECK_INSERT_CHUNK) {
    const chunk = rows.slice(index, index + CHECK_INSERT_CHUNK).map((row) => ({
      id: row.id ?? crypto.randomUUID(),
      organizationId: row.organizationId,
      projectId: row.projectId,
      scanId: row.scanId,
      engine: row.engine,
      promptId: row.promptId,
      sequenceId: row.sequenceId ?? null,
      turn: row.turn ?? 0,
      prompt: row.prompt,
      answer: row.answer,
      mentioned: row.mentioned,
      position: row.position,
      sentiment: row.sentiment,
      competitors: row.competitors,
      excerpt: row.excerpt,
      language: row.language,
      capturedAt: row.capturedAt,
    }));
    const inserted = await db
      .insert(geoMentionChecks)
      .values(chunk)
      .onConflictDoNothing({
        target: [
          geoMentionChecks.scanId,
          geoMentionChecks.engine,
          geoMentionChecks.promptId,
          geoMentionChecks.turn,
          geoMentionChecks.language,
        ],
      })
      .returning({ id: geoMentionChecks.id });
    written += inserted.length;
  }
  return written;
}

export async function queryGeoCheckOverview(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckOverviewRow[]> {
  const rows = await db
    .select({
      engine: geoMentionChecks.engine,
      checks: sql<number>`count(*)::int`,
      mentions: sql<number>`count(*) filter (where ${geoMentionChecks.mentioned})::int`,
      mentionRate: sql<number>`round(count(*) filter (where ${geoMentionChecks.mentioned})::numeric / nullif(count(*), 0), 3)::float8`,
      avgPosition: sql<
        number | null
      >`round(avg(${geoMentionChecks.position}) filter (where ${geoMentionChecks.mentioned} and ${geoMentionChecks.position} is not null), 1)::float8`,
      lastCheckedAt: sql<Date>`max(${geoMentionChecks.capturedAt})`,
    })
    .from(geoMentionChecks)
    .where(
      mentionFilters(scope, window, { sequences: "single", englishOnly: true })
    )
    .groupBy(geoMentionChecks.engine)
    .orderBy(
      sql`count(*) filter (where ${geoMentionChecks.mentioned})::numeric / nullif(count(*), 0) desc`
    );

  return rows.map((row) => ({
    engine: row.engine,
    checks: toNumber(row.checks),
    mentions: toNumber(row.mentions),
    mentionRate: toNumber(row.mentionRate),
    avgPosition: toNullableNumber(row.avgPosition),
    lastCheckedAt: toDate(row.lastCheckedAt),
  }));
}

export async function queryGeoCheckTimeseries(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckTimeseriesRow[]> {
  const rows = await db
    .select({
      day: sql<string>`(${geoMentionChecks.capturedAt})::date`,
      engine: geoMentionChecks.engine,
      checks: sql<number>`count(*)::int`,
      mentions: sql<number>`count(*) filter (where ${geoMentionChecks.mentioned})::int`,
    })
    .from(geoMentionChecks)
    .where(mentionFilters(scope, window, { englishOnly: true }))
    .groupBy(
      sql`(${geoMentionChecks.capturedAt})::date`,
      geoMentionChecks.engine
    )
    .orderBy(sql`(${geoMentionChecks.capturedAt})::date asc`);

  return rows.map((row) => ({
    day: toDay(row.day),
    engine: row.engine,
    checks: toNumber(row.checks),
    mentions: toNumber(row.mentions),
  }));
}

export async function queryGeoCheckPromptResults(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckPromptResultRow[]> {
  const rows = await db
    .select({
      promptId: geoMentionChecks.promptId,
      engine: geoMentionChecks.engine,
      prompt: sql<string>`(array_agg(${geoMentionChecks.prompt} order by ${geoMentionChecks.capturedAt} desc))[1]`,
      answer: sql<string>`(array_agg(${geoMentionChecks.answer} order by ${geoMentionChecks.capturedAt} desc))[1]`,
      mentioned: sql<boolean>`bool_or(${geoMentionChecks.mentioned})`,
      position: sql<
        number | null
      >`min(${geoMentionChecks.position}) filter (where ${geoMentionChecks.mentioned} and ${geoMentionChecks.position} is not null)`,
      sentiment: sql<
        string | null
      >`(array_agg(${geoMentionChecks.sentiment} order by ${geoMentionChecks.capturedAt} desc))[1]`,
      excerpt: sql<string>`(array_agg(${geoMentionChecks.excerpt} order by ${geoMentionChecks.capturedAt} desc))[1]`,
      lastCheckedAt: sql<Date>`max(${geoMentionChecks.capturedAt})`,
    })
    .from(geoMentionChecks)
    .where(
      mentionFilters(scope, window, {
        sequences: "single",
        englishOnly: true,
      })
    )
    .groupBy(geoMentionChecks.promptId, geoMentionChecks.engine)
    .orderBy(desc(sql`max(${geoMentionChecks.capturedAt})`));

  return rows.map((row) => ({
    promptId: row.promptId,
    engine: row.engine,
    prompt: String(row.prompt ?? ""),
    answer: String(row.answer ?? ""),
    mentioned: row.mentioned === true,
    position: toNullableNumber(row.position),
    sentiment:
      row.sentiment === null || row.sentiment === undefined
        ? null
        : String(row.sentiment),
    excerpt: String(row.excerpt ?? ""),
    lastCheckedAt: toDate(row.lastCheckedAt),
  }));
}

export async function queryGeoCheckCompetitorShare(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined,
  limit: number
): Promise<GeoCheckCompetitorShareRow[]> {
  const withinParts = capturedWithin(window);
  const projectFilter = scope.projectId
    ? sql`and ${geoMentionChecks.projectId} = ${scope.projectId}`
    : sql``;
  const windowFilter =
    withinParts.length > 0 ? sql`and ${and(...withinParts)}` : sql``;

  const result = await db.execute<{ brand: string; mentions: number }>(sql`
    select brand, count(*)::int as mentions
    from ${geoMentionChecks}
    cross join lateral unnest(${geoMentionChecks.competitors}) as brand
    where ${geoMentionChecks.organizationId} = ${scope.organizationId}
      ${projectFilter}
      ${windowFilter}
    group by brand
    order by mentions desc
    limit ${limit}
  `);

  return (result.rows as { brand: string; mentions: number }[]).map((row) => ({
    brand: row.brand,
    mentions: toNumber(row.mentions),
  }));
}

export async function queryGeoCheckCompetitorTimeseries(
  scope: GeoCheckScope,
  brand: string,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckCompetitorTimeseriesRow[]> {
  const filters = [scopeWhere(scope), ...capturedWithin(window)];

  const rows = await db
    .select({
      day: sql<string>`(${geoMentionChecks.capturedAt})::date`,
      mentions: sql<number>`count(*) filter (where ${geoMentionChecks.competitors} @> array[${brand}]::text[])::int`,
      checks: sql<number>`count(*)::int`,
    })
    .from(geoMentionChecks)
    .where(and(...filters))
    .groupBy(sql`(${geoMentionChecks.capturedAt})::date`)
    .orderBy(sql`(${geoMentionChecks.capturedAt})::date asc`);

  return rows.map((row) => ({
    day: toDay(row.day),
    mentions: toNumber(row.mentions),
    checks: toNumber(row.checks),
  }));
}

export async function queryGeoCheckCompetitorPrompts(
  scope: GeoCheckScope,
  brand: string,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckCompetitorPromptRow[]> {
  const filters = [
    scopeWhere(scope),
    sql`${geoMentionChecks.competitors} @> array[${brand}]::text[]`,
    ...capturedWithin(window),
  ];

  const rows = await db
    .selectDistinctOn([geoMentionChecks.promptId, geoMentionChecks.engine], {
      promptId: geoMentionChecks.promptId,
      engine: geoMentionChecks.engine,
      prompt: geoMentionChecks.prompt,
      mentioned: geoMentionChecks.mentioned,
      position: geoMentionChecks.position,
      capturedAt: geoMentionChecks.capturedAt,
    })
    .from(geoMentionChecks)
    .where(and(...filters))
    .orderBy(
      geoMentionChecks.promptId,
      geoMentionChecks.engine,
      desc(geoMentionChecks.capturedAt)
    );

  return rows
    .map((row) => ({
      promptId: row.promptId,
      engine: row.engine,
      prompt: row.prompt,
      mentioned: row.mentioned,
      position: row.position,
      capturedAt: row.capturedAt,
    }))
    .sort(
      (left, right) => right.capturedAt.getTime() - left.capturedAt.getTime()
    );
}

export async function queryGeoCheckLanguageShare(
  scope: GeoCheckScope,
  window: GeoCheckWindow | undefined
): Promise<GeoCheckLanguageShareRow[]> {
  const filters = [scopeWhere(scope), ...capturedWithin(window)];

  const rows = await db
    .select({
      language: sql<string>`case when ${geoMentionChecks.language} = '' then 'English' else ${geoMentionChecks.language} end`,
      checks: sql<number>`count(*)::int`,
      mentions: sql<number>`count(*) filter (where ${geoMentionChecks.mentioned})::int`,
      mentionRate: sql<number>`round(count(*) filter (where ${geoMentionChecks.mentioned})::numeric / nullif(count(*), 0), 3)::float8`,
      avgPosition: sql<
        number | null
      >`round(avg(${geoMentionChecks.position}) filter (where ${geoMentionChecks.mentioned} and ${geoMentionChecks.position} is not null), 1)::float8`,
      lastCheckedAt: sql<Date>`max(${geoMentionChecks.capturedAt})`,
    })
    .from(geoMentionChecks)
    .where(and(...filters))
    .groupBy(
      sql`case when ${geoMentionChecks.language} = '' then 'English' else ${geoMentionChecks.language} end`
    )
    .orderBy(
      sql`count(*) filter (where ${geoMentionChecks.mentioned})::numeric / nullif(count(*), 0) desc`
    );

  return rows.map((row) => ({
    language: row.language,
    checks: toNumber(row.checks),
    mentions: toNumber(row.mentions),
    mentionRate: toNumber(row.mentionRate),
    avgPosition: toNullableNumber(row.avgPosition),
    lastCheckedAt: toDate(row.lastCheckedAt),
  }));
}

export async function queryGeoCheckSequenceResults(
  scope: GeoCheckScope,
  sequenceId: string | undefined
): Promise<GeoCheckSequenceResultRow[]> {
  const filters = [
    scopeWhere(scope),
    sql`${geoMentionChecks.sequenceId} is not null`,
  ];
  if (sequenceId) {
    filters.push(eq(geoMentionChecks.sequenceId, sequenceId));
  }

  const rows = await db
    .selectDistinctOn(
      [
        geoMentionChecks.sequenceId,
        geoMentionChecks.turn,
        geoMentionChecks.engine,
      ],
      {
        sequenceId: geoMentionChecks.sequenceId,
        turn: geoMentionChecks.turn,
        engine: geoMentionChecks.engine,
        prompt: geoMentionChecks.prompt,
        answer: geoMentionChecks.answer,
        mentioned: geoMentionChecks.mentioned,
        position: geoMentionChecks.position,
        sentiment: geoMentionChecks.sentiment,
        excerpt: geoMentionChecks.excerpt,
        lastCheckedAt: geoMentionChecks.capturedAt,
      }
    )
    .from(geoMentionChecks)
    .where(and(...filters))
    .orderBy(
      geoMentionChecks.sequenceId,
      geoMentionChecks.turn,
      geoMentionChecks.engine,
      desc(geoMentionChecks.capturedAt)
    );

  return rows.flatMap((row) => {
    if (!row.sequenceId) {
      return [];
    }
    return [
      {
        sequenceId: row.sequenceId,
        turn: row.turn,
        engine: row.engine,
        prompt: row.prompt,
        answer: row.answer,
        mentioned: row.mentioned,
        position: row.position,
        sentiment: row.sentiment,
        excerpt: row.excerpt,
        lastCheckedAt: row.lastCheckedAt,
      },
    ];
  });
}
