export class McpStoreListingUnavailableError extends Error {
  override readonly name = "McpStoreListingUnavailableError";

  constructor() {
    super("The MCP store listing is no longer available.");
  }
}
