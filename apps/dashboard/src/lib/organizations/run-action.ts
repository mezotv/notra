import { Effect } from "effect";

import { OrganizationActionError } from "@/lib/organizations/errors";
import type { ActionResult } from "@/types/organizations/actions";

export function runOrganizationAction<T>(
  effect: Effect.Effect<T, OrganizationActionError>
): Promise<ActionResult<T>> {
  return Effect.runPromise(
    effect.pipe(
      Effect.catchDefect((defect) =>
        Effect.fail(
          new OrganizationActionError({
            message: "Something went wrong",
            cause: defect,
          })
        )
      ),
      Effect.match({
        onSuccess: (data): ActionResult<T> => ({ data, error: null }),
        onFailure: (error): ActionResult<T> => ({
          data: null,
          error: { message: error.message },
        }),
      })
    )
  );
}
