import type {
  members,
  personaReferences,
  personaSocials,
  personas,
} from "@notra/db/schema";

interface PersonaRowLinkedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export type PersonaRow = typeof personas.$inferSelect & {
  socials: (typeof personaSocials.$inferSelect)[];
  member:
    | (typeof members.$inferSelect & { users: PersonaRowLinkedUser })
    | null;
  references: { id: string }[];
};

export type PersonaSocialRow = typeof personaSocials.$inferSelect;

export type PersonaReferenceRow = typeof personaReferences.$inferSelect;
