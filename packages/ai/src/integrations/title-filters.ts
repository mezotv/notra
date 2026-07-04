import { db } from "@notra/db/drizzle";
import { githubTitleFilters, linearTitleFilters } from "@notra/db/schema";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { MAX_TITLE_FILTERS } from "../constants/title-filters";
import type { TitleFilterMatchType, TitleFilterRule } from "../types/tools";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

interface CreateTitleFilterParams {
  matchType: TitleFilterMatchType;
  pattern: string;
}

interface UpdateTitleFilterParams {
  enabled?: boolean;
  matchType?: TitleFilterMatchType;
  pattern?: string;
}

function toTitleFilterUpdateSet(params: UpdateTitleFilterParams) {
  return {
    ...(params.enabled !== undefined ? { enabled: params.enabled } : {}),
    ...(params.matchType !== undefined ? { matchType: params.matchType } : {}),
    ...(params.pattern !== undefined ? { pattern: params.pattern } : {}),
  };
}

export class TitleFilterLimitError extends Error {
  constructor() {
    super(`You can add up to ${MAX_TITLE_FILTERS} title filters`);
    this.name = "TitleFilterLimitError";
  }
}

export async function getGithubTitleFilters(repositoryId: string) {
  return db.query.githubTitleFilters.findMany({
    where: eq(githubTitleFilters.repositoryId, repositoryId),
    orderBy: [asc(githubTitleFilters.createdAt)],
  });
}

export async function getEnabledGithubTitleFilterRules(
  repositoryId: string
): Promise<TitleFilterRule[]> {
  const filters = await db
    .select({
      matchType: githubTitleFilters.matchType,
      pattern: githubTitleFilters.pattern,
    })
    .from(githubTitleFilters)
    .where(
      and(
        eq(githubTitleFilters.repositoryId, repositoryId),
        eq(githubTitleFilters.enabled, true)
      )
    );

  return filters;
}

export async function createGithubTitleFilter(
  repositoryId: string,
  params: CreateTitleFilterParams
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`github_title_filters:${repositoryId}`}))`
    );

    const [existing] = await tx
      .select({ value: count() })
      .from(githubTitleFilters)
      .where(eq(githubTitleFilters.repositoryId, repositoryId));

    if ((existing?.value ?? 0) >= MAX_TITLE_FILTERS) {
      throw new TitleFilterLimitError();
    }

    const [created] = await tx
      .insert(githubTitleFilters)
      .values({
        id: nanoid(),
        repositoryId,
        matchType: params.matchType,
        pattern: params.pattern,
        enabled: true,
      })
      .returning();

    return created;
  });
}

export async function updateGithubTitleFilter(
  repositoryId: string,
  filterId: string,
  params: UpdateTitleFilterParams
) {
  const [updated] = await db
    .update(githubTitleFilters)
    .set(toTitleFilterUpdateSet(params))
    .where(
      and(
        eq(githubTitleFilters.id, filterId),
        eq(githubTitleFilters.repositoryId, repositoryId)
      )
    )
    .returning();

  return updated;
}

export async function deleteGithubTitleFilter(
  repositoryId: string,
  filterId: string
) {
  const [deleted] = await db
    .delete(githubTitleFilters)
    .where(
      and(
        eq(githubTitleFilters.id, filterId),
        eq(githubTitleFilters.repositoryId, repositoryId)
      )
    )
    .returning();

  return deleted;
}

export async function getLinearTitleFilters(integrationId: string) {
  return db.query.linearTitleFilters.findMany({
    where: eq(linearTitleFilters.integrationId, integrationId),
    orderBy: [asc(linearTitleFilters.createdAt)],
  });
}

export async function getEnabledLinearTitleFilterRules(
  integrationId: string
): Promise<TitleFilterRule[]> {
  const filters = await db
    .select({
      matchType: linearTitleFilters.matchType,
      pattern: linearTitleFilters.pattern,
    })
    .from(linearTitleFilters)
    .where(
      and(
        eq(linearTitleFilters.integrationId, integrationId),
        eq(linearTitleFilters.enabled, true)
      )
    );

  return filters;
}

export async function createLinearTitleFilter(
  integrationId: string,
  params: CreateTitleFilterParams
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`linear_title_filters:${integrationId}`}))`
    );

    const [existing] = await tx
      .select({ value: count() })
      .from(linearTitleFilters)
      .where(eq(linearTitleFilters.integrationId, integrationId));

    if ((existing?.value ?? 0) >= MAX_TITLE_FILTERS) {
      throw new TitleFilterLimitError();
    }

    const [created] = await tx
      .insert(linearTitleFilters)
      .values({
        id: nanoid(),
        integrationId,
        matchType: params.matchType,
        pattern: params.pattern,
        enabled: true,
      })
      .returning();

    return created;
  });
}

export async function updateLinearTitleFilter(
  integrationId: string,
  filterId: string,
  params: UpdateTitleFilterParams
) {
  const [updated] = await db
    .update(linearTitleFilters)
    .set(toTitleFilterUpdateSet(params))
    .where(
      and(
        eq(linearTitleFilters.id, filterId),
        eq(linearTitleFilters.integrationId, integrationId)
      )
    )
    .returning();

  return updated;
}

export async function deleteLinearTitleFilter(
  integrationId: string,
  filterId: string
) {
  const [deleted] = await db
    .delete(linearTitleFilters)
    .where(
      and(
        eq(linearTitleFilters.id, filterId),
        eq(linearTitleFilters.integrationId, integrationId)
      )
    )
    .returning();

  return deleted;
}
