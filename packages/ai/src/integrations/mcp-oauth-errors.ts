import { Schema } from "effect";

export class McpOAuthAuthorizationError extends Schema.TaggedErrorClass<McpOAuthAuthorizationError>()(
  "McpOAuthAuthorizationError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect()),
  }
) {
  constructor(message: string, cause?: unknown) {
    super({ message, ...(cause === undefined ? {} : { cause }) });
  }
}

export class McpOAuthRefreshTokenRequiredError extends Schema.TaggedErrorClass<McpOAuthRefreshTokenRequiredError>()(
  "McpOAuthRefreshTokenRequiredError",
  { message: Schema.String }
) {
  constructor() {
    super({
      message:
        "This MCP server did not issue a refresh token, so Notra cannot keep the connection signed in.",
    });
  }
}

export class McpOAuthReauthorizationRequiredError extends Schema.TaggedErrorClass<McpOAuthReauthorizationRequiredError>()(
  "McpOAuthReauthorizationRequiredError",
  { message: Schema.String }
) {
  constructor() {
    super({ message: "Reconnect this MCP server to restore OAuth access." });
  }
}

export class McpOAuthNameConflictError extends Schema.TaggedErrorClass<McpOAuthNameConflictError>()(
  "McpOAuthNameConflictError",
  { message: Schema.String }
) {
  constructor() {
    super({ message: "An MCP server with this name already exists." });
  }
}
