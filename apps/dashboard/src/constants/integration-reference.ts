export const GITHUB_REFERENCE_VALUE_PATTERN =
  /^@?integration\/github\/([^/\s]+)\/([^/\s]+)\/([^/\s]+)$/;

export const LINEAR_REFERENCE_VALUE_PATTERN =
  /^@?integration\/linear\/([^/\s]+)$/;

export const MCP_REFERENCE_VALUE_PATTERN =
  /^@?integration\/mcp\/([^/\s]+)\/([^/\s]+)$/;

export const INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX =
  /(@?integration\/(?:github\/[^/\s]+\/[^/\s]+\/[^/\s]+|linear\/[^/\s]+|mcp\/[^/\s]+\/[^/\s]+))/g;
