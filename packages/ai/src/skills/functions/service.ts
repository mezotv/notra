import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { DEFAULT_SKILL_CATALOG_LIMIT } from "../constants";
import type {
  ListSkillsOptions,
  SkillContent,
  SkillServiceContext,
} from "../types";
import { normalizeSkillSummary } from "./guidance";

const promptableSkillWhere = (organizationId: string) =>
  and(
    eq(skills.organizationId, organizationId),
    sql`length(regexp_replace(${skills.description}, '^[[:space:]]+|[[:space:]]+$', '', 'g')) > 0`
  );

export async function listSkillCatalog(
  ctx: SkillServiceContext,
  options: ListSkillsOptions = {}
) {
  const limit = options.limit ?? DEFAULT_SKILL_CATALOG_LIMIT;
  const offset = options.offset ?? 0;
  const where = promptableSkillWhere(ctx.organizationId);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .where(where)
      .orderBy(asc(skills.name))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(skills).where(where),
  ]);

  return {
    skills: rows.map(normalizeSkillSummary),
    total: totalResult[0]?.total ?? 0,
  };
}

export async function listSkillSummaries(
  ctx: SkillServiceContext,
  options: Pick<ListSkillsOptions, "limit"> = {}
) {
  const limit = options.limit ?? DEFAULT_SKILL_CATALOG_LIMIT;
  const rows = await db
    .select({
      name: skills.name,
      description: skills.description,
    })
    .from(skills)
    .where(promptableSkillWhere(ctx.organizationId))
    .orderBy(asc(skills.name))
    .limit(limit);

  return rows.map(normalizeSkillSummary);
}

export async function loadSkillByName(
  ctx: SkillServiceContext,
  name: string
): Promise<SkillContent | null> {
  const row = await db.query.skills.findFirst({
    where: and(
      eq(skills.organizationId, ctx.organizationId),
      eq(skills.name, name)
    ),
  });

  if (!row) {
    return null;
  }

  return {
    name: row.name,
    description: row.description,
    content: row.content.trim(),
  };
}
