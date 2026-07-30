import { renderSkillToolOutput } from "@notra/ai/skills/functions/guidance";
import { loadSkillByName } from "@notra/ai/skills/functions/service";
import { defineTool } from "eve/tools";
import { getSkillByNameInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetSkillByNameTool() {
  return defineTool({
    description:
      "Load a skill's full content by name. Returns a <skill_content> block containing the full skill body. Call list_available_skills first unless the exact skill name is already known.",
    inputSchema: getSkillByNameInputSchema,
    async execute({ name }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const skill = await loadSkillByName({ organizationId }, name);

      if (!skill) {
        return {
          error: `Skill "${name}" not found. Use list_available_skills to see available skills.`,
        };
      }

      return {
        name: skill.name,
        description: skill.description,
        content: skill.content,
        skillContent: renderSkillToolOutput(skill),
      };
    },
  });
}
