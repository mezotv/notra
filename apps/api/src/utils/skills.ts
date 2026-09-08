import { Effect } from "effect";
import type { Context } from "hono";

import type { SkillDatabaseError } from "../errors/skills";
import type {
  SerializedSkill,
  SerializedSkillSummary,
  SkillDomainError,
  SkillTimestamps,
  SkillUpdatedAt,
} from "../types/skills";
import { getOrganizationId } from "./auth";

/** Leave unexpected database errors to Hono's central error handler. */
export function runSkillProgram<A, E extends SkillDomainError>(
  program: Effect.Effect<A, E | SkillDatabaseError>
) {
  return Effect.runPromise(
    Effect.result(
      program.pipe(
        Effect.catchTag("SkillDatabaseError", (failure) =>
          Effect.die(failure.cause)
        )
      )
    )
  );
}

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
