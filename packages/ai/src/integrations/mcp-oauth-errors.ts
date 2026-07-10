import { Data } from "effect";

export class McpOAuthAuthorizationError extends Data.TaggedError(
  "McpOAuthAuthorizationError"
)<{
  readonly message: string;
}> {
  constructor(message: string) {
    super({ message });
  }
}

export class McpOAuthRefreshTokenRequiredError extends Data.TaggedError(
  "McpOAuthRefreshTokenRequiredError"
)<{
  readonly message: string;
}> {
  constructor() {
    super({
      message:
        "This MCP server did not issue a refresh token, so Notra cannot keep the connection signed in.",
    });
  }
}

export class McpOAuthReauthorizationRequiredError extends Data.TaggedError(
  "McpOAuthReauthorizationRequiredError"
)<{
  readonly message: string;
}> {
  constructor() {
    super({ message: "Reconnect this MCP server to restore OAuth access." });
  }
}

export class McpOAuthNameConflictError extends Data.TaggedError(
  "McpOAuthNameConflictError"
)<{
  readonly message: string;
}> {
  constructor() {
    super({ message: "An MCP server with this name already exists." });
  }
}
