import type { ConnectedAccount } from "@/lib/hooks/use-connected-accounts";
import type { BrandReference } from "@/types/hooks/brand-references";

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
