import type { AgentType } from "@notra/ai/types/brand-references";

export interface PersonaVoiceConfig {
  organizationId: string;
  personaId: string;
  agentType?: AgentType;
}

export interface PersonaVoiceProfile {
  name: string;
  title: string | null;
  bio: string | null;
  customInstructions: string | null;
  socials: Array<{
    platform: string;
    username: string;
    url: string | null;
  }>;
}

export interface PersonaReferenceSummary {
  type: string;
  content: string;
  note: string | null;
}
