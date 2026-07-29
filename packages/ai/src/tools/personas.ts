import type {
  PersonaReferenceSummary,
  PersonaVoiceConfig,
  PersonaVoiceProfile,
} from "@notra/ai/types/personas";
import { toolDescription } from "@notra/ai/utils/description";
import { db } from "@notra/db/drizzle";
import { personas } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { getAICachedTools } from "./tool-cache";

async function loadPersonaVoice(config: PersonaVoiceConfig): Promise<{
  persona: PersonaVoiceProfile | null;
  references: PersonaReferenceSummary[];
}> {
  const persona = await db.query.personas.findFirst({
    where: and(
      eq(personas.id, config.personaId),
      eq(personas.organizationId, config.organizationId)
    ),
    with: {
      socials: true,
      references: {
        orderBy: (reference, { desc }) => [desc(reference.createdAt)],
      },
    },
  });

  if (!persona) {
    return { persona: null, references: [] };
  }

  const agentType = config.agentType;
  const filteredReferences = agentType
    ? persona.references.filter((reference) => {
        const targets: string[] = reference.applicableTo;
        return targets.includes("all") || targets.includes(agentType);
      })
    : persona.references;

  return {
    persona: {
      name: persona.name,
      title: persona.title,
      bio: persona.bio,
      customInstructions: persona.customInstructions,
      socials: persona.socials.map((social) => ({
        platform: social.platform,
        username: social.username,
        url: social.url,
      })),
    },
    references: filteredReferences.map((reference) => ({
      type: reference.type,
      content: reference.content,
      note: reference.note,
    })),
  };
}

export function createGetPersonaVoiceTool(config: PersonaVoiceConfig): Tool {
  const cached = getAICachedTools({
    organizationId: config.organizationId,
    namespace: "personas",
  });

  return cached(
    tool({
      description: toolDescription({
        toolName: "getPersonaVoice",
        intro:
          "Gets the persona this content must be written as: their profile (name, title, bio, writing instructions, social accounts) and real writing samples that define how this person writes.",
        whenToUse:
          "ALWAYS call this tool at the very start before writing any content. The content is published as this person, not as the company brand, so their voice is the source of truth.",
        usageNotes:
          "Returns the persona profile plus an array of writing references with type, content, and optional notes. Write in first person as this individual. Study the tone, vocabulary, sentence structure, and patterns across all references, and follow the persona's writing instructions exactly.",
      }),
      inputSchema: z.object({}),
      execute: () => loadPersonaVoice(config),
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: () =>
        `get_persona_voice:org=${config.organizationId}:persona=${config.personaId}:agent=${config.agentType ?? "all"}`,
    }
  );
}
