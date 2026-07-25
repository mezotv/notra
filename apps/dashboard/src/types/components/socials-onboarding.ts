import type { BrandReference } from "@/types/hooks/brand-references";
import type { ConnectedAccount } from "@/types/hooks/connected-accounts";

export interface SocialsClientProps {
  organizationId: string;
  voiceId: string | null;
  initialAccount: ConnectedAccount | null;
}

export interface ImportButtonContentProps {
  isPending: boolean;
  importedCount: number;
}

export interface ImportedTweetCardProps {
  isDeleting: boolean;
  onDelete: (reference: BrandReference) => void;
  reference: BrandReference;
}
