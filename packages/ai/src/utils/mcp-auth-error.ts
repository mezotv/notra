const MCP_UNAUTHORIZED_ERROR_REGEX = /(?:http|status)[^\n]*401|unauthorized/i;

export function isMcpUnauthorizedError(error: unknown) {
  return (
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 401) ||
    (error instanceof Error && MCP_UNAUTHORIZED_ERROR_REGEX.test(error.message))
  );
}
