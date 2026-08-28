import { Effect } from "effect";
import type * as z from "zod";

import { OrganizationActionError } from "@/lib/organizations/errors";

const DEFAULT_INVALID_INPUT_MESSAGE = "Invalid input";

export function validateActionInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Effect.Effect<z.output<Schema>, OrganizationActionError> {
  const result = schema.safeParse(input);

  if (!result.success) {
    return Effect.fail(
      new OrganizationActionError({
        message:
          result.error.issues[0]?.message ?? DEFAULT_INVALID_INPUT_MESSAGE,
      })
    );
  }

  return Effect.succeed(result.data);
}
