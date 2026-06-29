import type { WebhookEventType } from "@/schemas/integrations";
import type { Trigger } from "@/types/triggers/triggers";

export type { EventTriggerFormValues } from "@/schemas/automation/event-trigger-form";

export interface CreateEventTriggerDialogProps {
  organizationId: string;
  onSuccess?: (trigger: Trigger) => void;
  trigger?: React.ReactElement;
  editTrigger?: Trigger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface EventTypeCardProps {
  eventType: WebhookEventType;
  selected: boolean;
  onSelect: () => void;
}
