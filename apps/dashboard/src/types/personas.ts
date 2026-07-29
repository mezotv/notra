import type * as z from "zod";
import type {
  createPersonaReferenceSchema,
  createPersonaSchema,
  personaSocialInputSchema,
  personaSocialPlatformSchema,
  updatePersonaReferenceSchema,
  updatePersonaSchema,
} from "@/schemas/personas";
import type { ApplicablePlatform } from "@/types/hooks/brand-references";

export type PersonaSocialPlatform = z.infer<typeof personaSocialPlatformSchema>;

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;

export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;

export type PersonaSocialInput = z.infer<typeof personaSocialInputSchema>;

export type CreatePersonaReferenceInput = z.infer<
  typeof createPersonaReferenceSchema
>;

export type UpdatePersonaReferenceInput = z.infer<
  typeof updatePersonaReferenceSchema
>;

export interface PersonaSocial {
  id: string;
  personaId: string;
  platform: PersonaSocialPlatform;
  username: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PersonaLinkedMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
}

export interface Persona {
  id: string;
  organizationId: string;
  memberId: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  customInstructions: string | null;
  socials: PersonaSocial[];
  linkedMember: PersonaLinkedMember | null;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaReference {
  id: string;
  personaId: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  note: string | null;
  sourceUrl: string | null;
  applicableTo: ApplicablePlatform[];
  createdAt: string;
  updatedAt: string;
}
