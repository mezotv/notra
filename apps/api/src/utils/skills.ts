import type { Context } from "hono";
import type {
  SerializedSkill,
  SerializedSkillSummary,
  SkillTimestamps,
  SkillUpdatedAt,
} from "../types/skills";
import { getOrganizationId } from "./auth";

export function getScopedOrganizationId(c: Context) {
  const organizationId = getOrganizationId(c);
  if (!organizationId) {
    return null;
  }
  return organizationId;
}

export function serializeSkill<T extends SkillTimestamps>(
  skill: T
): SerializedSkill<T> {
  return {
    ...skill,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
  };
}

export function serializeSkillSummary<T extends SkillUpdatedAt>(
  skill: T
): SerializedSkillSummary<T> {
  return {
    ...skill,
    updatedAt: skill.updatedAt.toISOString(),
  };
}
