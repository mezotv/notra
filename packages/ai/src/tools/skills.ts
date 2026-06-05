import { renderSkillToolOutput } from "@notra/ai/skills/functions/guidance";
import {
  listSkillCatalog,
  loadSkillByName,
} from "@notra/ai/skills/functions/service";
import { type Tool, tool } from "ai";
import z from "zod";

export interface SkillsToolContext {
  organizationId: string;
}

export function listAvailableSkills(ctx: SkillsToolContext): Tool {
  return tool({
    description:
      "List available skills for this organization. Returns the permission-scoped skill catalog: name, description, and system status. Call getSkillByName to load a skill's full content before applying it.",
    inputSchema: z.object({
      limit: z.number().default(20).describe("The number of skills to list"),
      offset: z
        .number()
        .default(0)
        .describe("The offset to start listing skills from"),
    }),
    execute: async ({ limit, offset }) => {
      return listSkillCatalog(ctx, { limit, offset });
    },
  });
}

export function getSkillByName(ctx: SkillsToolContext): Tool {
  return tool({
    description:
      "Load a skill's full content by name. Returns a <skill_content> block containing the full skill body. Call listAvailableSkills first unless the exact skill name is already present in the prompt catalog.",
    inputSchema: z.object({
      name: z.string().describe("The name of the skill to load."),
    }),
    execute: async ({ name }) => {
      const skill = await loadSkillByName(ctx, name);

      if (!skill) {
        return {
          error: `Skill "${name}" not found. Use listAvailableSkills to see available skills.`,
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
