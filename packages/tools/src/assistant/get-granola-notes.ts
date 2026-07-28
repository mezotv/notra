import { getGranolaToolContextByIntegrationId } from "@notra/ai/integrations/granola";
import { defineTool } from "eve/tools";
import { getGranolaNotesInputSchema } from "../schemas/assistant-tools";
import { granolaApiRequest } from "../utils/granola";
import { requireOrganizationId } from "../utils/organization";

export function createGetGranolaNotesTool() {
  return defineTool({
    description:
      "List Granola meeting notes with AI summaries (title, summary, attendees, timestamps). Supports createdAfter/createdBefore ISO timestamps, folder filtering, and cursor pagination. Use get_granola_note to fetch a full note with its transcript.",
    inputSchema: getGranolaNotesInputSchema,
    async execute(
      { integrationId, createdAfter, createdBefore, folderId, cursor },
      ctx
    ) {
      const organizationId = requireOrganizationId(ctx);
      const resolved = await getGranolaToolContextByIntegrationId(
        integrationId,
        { organizationId }
      );

      return granolaApiRequest(resolved.apiKey, "/notes", {
        created_after: createdAfter,
        created_before: createdBefore,
        folder_id: folderId,
        cursor,
        page_size: "30",
      });
    },
  });
}
