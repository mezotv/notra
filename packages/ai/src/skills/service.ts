import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, asc, count, eq } from "drizzle-orm";
import {
  filterPromptableSkills,
  normalizeSkillSummary,
  type SkillContent,
} from "./guidance";

export interface SkillServiceContext {
  organizationId: string;
}

export interface ListSkillsOptions {
  limit?: number;
  offset?: number;
}

export async function listSkillCatalog(
  ctx: SkillServiceContext,
  options: ListSkillsOptions = {}
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .where(eq(skills.organizationId, ctx.organizationId))
      .orderBy(asc(skills.name))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(skills)
      .where(eq(skills.organizationId, ctx.organizationId)),
  ]);

  return {
    skills: filterPromptableSkills(rows.map(normalizeSkillSummary)),
    total: totalResult[0]?.total ?? 0,
  };
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
