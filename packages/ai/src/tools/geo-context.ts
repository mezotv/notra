import { getGeoWriterContextInputSchema } from "@notra/ai/schemas/geo-tools";
import type { GeoContextToolConfig } from "@notra/ai/types/geo-writer";
import { toolDescription } from "@notra/ai/utils/description";
import { loadGeoProjectContextForTool } from "@notra/ai/utils/geo-tool-data";
import { type Tool, tool } from "ai";

export function createGetGeoContextTool(config: GeoContextToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "getGeoContext",
      intro:
        "Returns the brand's GEO tracking data: the brand name and aliases, tracked competitors, the prompts being monitored, and the latest answer from each AI engine with whether the brand was mentioned.",
      whenToUse:
        "For positioning: to see which questions competitors currently win, how AI assistants describe the category, and which competitor names are fair to mention.",
      usageNotes:
        "Pass includeAnswers=true only if you need the full AI answers instead of short excerpts. Data may be empty for new projects.",
    }),
    inputSchema: getGeoWriterContextInputSchema,
    execute: ({ includeAnswers }) =>
      loadGeoProjectContextForTool(
        config.organizationId,
        config.projectId,
        includeAnswers
      ),
  });
}
