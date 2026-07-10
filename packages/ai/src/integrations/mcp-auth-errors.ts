import { Data } from "effect";

export class McpUnauthorizedError extends Data.TaggedError(
  "McpUnauthorizedError"
)<{
  readonly message: string;
  readonly statusCode: 401;
}> {
  constructor() {
    super({
      message: "The MCP server rejected the access token.",
      statusCode: 401,
    });
  }
}
