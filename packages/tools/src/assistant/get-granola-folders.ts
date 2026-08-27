import { getGranolaToolContextByIntegrationId } from "@notra/ai/integrations/granola";
import { defineTool } from "eve/tools";

import { getGranolaFoldersInputSchema } from "../schemas/assistant-tools";
import { granolaApiRequest } from "../utils/granola";
import { requireOrganizationId } from "../utils/organization";

export function createGetGranolaFoldersTool() {
  return defineTool({
    description:
      "List Granola folders (sorted alphabetically) with cursor pagination. Use folder IDs to filter notes with get_granola_notes.",
    inputSchema: getGranolaFoldersInputSchema,
    async execute({ integrationId, cursor }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const resolved = await getGranolaToolContextByIntegrationId(
        integrationId,
        { organizationId }
      );

      return granolaApiRequest(resolved.apiKey, "/folders", { cursor });
    },
  });
}
