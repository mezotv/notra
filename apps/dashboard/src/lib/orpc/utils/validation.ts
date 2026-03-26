import type { ZodType } from "zod";
import { validationError } from "./errors";

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw validationError(result.error);
  }

  return result.data;
}
