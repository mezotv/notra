import { getGranolaToolContextByIntegrationId } from "@notra/ai/integrations/granola";
import { defineTool } from "eve/tools";

import { getGranolaNoteInputSchema } from "../schemas/assistant-tools";
import { granolaApiRequest } from "../utils/granola";
import { requireOrganizationId } from "../utils/organization";

export function createGetGranolaNoteTool() {
  return defineTool({
    description:
      "Get a single Granola meeting note by ID, including its AI summary and metadata. Set includeTranscript to also fetch the full meeting transcript.",
    inputSchema: getGranolaNoteInputSchema,
    async execute({ integrationId, noteId, includeTranscript }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const resolved = await getGranolaToolContextByIntegrationId(
        integrationId,
        { organizationId }
      );

      return granolaApiRequest(
        resolved.apiKey,
        `/notes/${encodeURIComponent(noteId)}`,
        {
          include: includeTranscript ? "transcript" : undefined,
        }
      );
    },
  });
}
