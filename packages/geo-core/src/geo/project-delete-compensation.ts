import { Effect } from "effect";

import { GeoProjectDeleteBlockedError } from "./errors";

/**
 * Completes the database phase after QStash cancellation, repairing the scan
 * schedule whenever the database delete fails or is refused.
 *
 * The delete remains the authoritative outcome: repair failures and defects
 * are captured so they cannot replace its original typed error.
 */
export function runProjectDeleteAfterCancellation<E, R, ERepair, RRepair>(
  projectId: string,
  attempt: Effect.Effect<
    "deleted" | "last_project" | "not_found" | "schedule_changed",
    E,
    R
  >,
  repair: Effect.Effect<unknown, ERepair, RRepair>
): Effect.Effect<
  "deleted" | "not_found" | "schedule_changed",
  E | GeoProjectDeleteBlockedError,
  R | RRepair
> {
  const deleteOrBlock = attempt.pipe(
    Effect.flatMap((outcome) =>
      outcome === "last_project"
        ? Effect.fail(
            new GeoProjectDeleteBlockedError({
              projectId,
              reason: "last_project",
            })
          )
        : Effect.succeed(outcome)
    )
  );

  return deleteOrBlock.pipe(
    Effect.catch((error) =>
      repair.pipe(Effect.exit, Effect.andThen(Effect.fail(error)))
    )
  );
}
