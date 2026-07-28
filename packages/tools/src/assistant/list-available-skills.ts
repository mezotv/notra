import { listSkillCatalog } from "@notra/ai/skills/functions/service";
import { defineTool } from "eve/tools";
import { listAvailableSkillsInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createListAvailableSkillsTool() {
  return defineTool({
    description:
      "List available skills for this organization. Returns the permission-scoped skill catalog: name, description, and system status. Call get_skill_by_name to load a skill's full content before applying it.",
    inputSchema: listAvailableSkillsInputSchema,
    execute({ limit, offset }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      return listSkillCatalog({ organizationId }, { limit, offset });
    },
  });
}
