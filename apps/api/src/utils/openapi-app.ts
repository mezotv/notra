import { OpenAPIHono } from "@hono/zod-openapi";
import type { ZodError } from "zod";

import type { ApiEnv } from "../types/env";

export function formatValidationError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid request";
  }

  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function createOpenApiApp() {
  return new OpenAPIHono<ApiEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({ error: formatValidationError(result.error) }, 400);
      }
    },
  });
}
