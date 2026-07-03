import { db } from "@notra/db/drizzle";
import { githubTitleFilters, linearTitleFilters } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { TitleFilterMatchType, TitleFilterRule } from "../types/tools";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

interface CreateTitleFilterParams {
  matchType: TitleFilterMatchType;
  pattern: string;
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
  const [created] = await db
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
}

export async function setGithubTitleFilterEnabled(
  repositoryId: string,
  filterId: string,
  enabled: boolean
) {
  const [updated] = await db
    .update(githubTitleFilters)
    .set({ enabled })
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
  const [created] = await db
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
}

export async function setLinearTitleFilterEnabled(
  integrationId: string,
  filterId: string,
  enabled: boolean
) {
  const [updated] = await db
    .update(linearTitleFilters)
    .set({ enabled })
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
