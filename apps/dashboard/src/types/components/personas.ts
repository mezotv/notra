import type { IconSvgElement } from "@hugeicons/react";
import type {
  Persona,
  PersonaReference,
  PersonaSocialPlatform,
} from "@/types/personas";

export interface PersonaSocialPlatformConfig {
  value: PersonaSocialPlatform;
  label: string;
  icon: IconSvgElement;
  placeholder: string;
  profileUrl: (username: string) => string;
}

export interface PersonasPageClientProps {
  slug: string;
}

export interface PersonaDetailPageClientProps {
  slug: string;
  personaId: string;
}

export interface PersonaCardProps {
  persona: Persona;
  slug: string;
}

export interface CreatePersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  slug: string;
}

export interface PersonaProfileCardProps {
  organizationId: string;
  persona: Persona;
}

export interface PersonaSocialsCardProps {
  organizationId: string;
  persona: Persona;
}

export interface PersonaMemberCardProps {
  organizationId: string;
  persona: Persona;
}

export interface PersonaReferencesCardProps {
  organizationId: string;
  personaId: string;
}

export interface AddPersonaReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  personaId: string;
}

export interface MemberPersonaCellProps {
  member: {
    id: string;
    user: {
      name: string;
    };
  };
}

export interface PersonaReferenceRowProps {
  reference: PersonaReference;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string | null) => void;
  isDeleting: boolean;
}

export interface DeletePersonaDialogProps {
  organizationId: string;
  persona: Persona;
  slug: string;
}
