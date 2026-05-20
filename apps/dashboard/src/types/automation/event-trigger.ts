import type { WebhookEventType } from "@/schemas/integrations";
import type { Trigger } from "@/types/triggers/triggers";

export interface CreateEventTriggerDialogProps {
  organizationId: string;
  onSuccess?: (trigger: Trigger) => void;
  trigger?: React.ReactElement;
}

export interface EventTypeCardProps {
  eventType: WebhookEventType;
  selected: boolean;
  onSelect: () => void;
}
