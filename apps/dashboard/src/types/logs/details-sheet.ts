import type { Log } from "@/types/webhooks/webhooks";

export interface LogSelection {
  organizationId: string;
  log: Log;
}

export interface LogDetailsSheetProps {
  organizationId: string;
  organizationSlug: string;
  log: Log | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}
