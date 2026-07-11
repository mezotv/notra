import { Schema } from "effect";

export class McpUnauthorizedError extends Schema.TaggedErrorClass<McpUnauthorizedError>()(
  "McpUnauthorizedError",
  {
    message: Schema.String,
    statusCode: Schema.Literal(401),
  }
) {
  constructor() {
    super({
      message: "The MCP server rejected the access token.",
      statusCode: 401,
    });
  }
}
