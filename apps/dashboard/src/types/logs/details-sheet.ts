import type { Log } from "@/types/webhooks/webhooks";

export interface LogDetailsSheetProps {
  log: Log | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}
