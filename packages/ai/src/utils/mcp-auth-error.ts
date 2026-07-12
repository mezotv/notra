import { McpUnauthorizedError } from "../integrations/mcp-auth-errors";

export function isMcpUnauthorizedError(error: unknown) {
  return (
    error instanceof McpUnauthorizedError ||
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 401)
  );
}
