import type { IconSvgElement } from "@hugeicons/react";
import type { ConnectedCardsVariant } from "@notra/ui/components/shared/connected-cards";
import type {
  ApiKeyExpiration,
  ApiKeyPermission,
  ApiKeyPresetId,
} from "@/schemas/api-keys";

export interface ApiKeyPreset {
  id: ApiKeyPresetId;
  icon: IconSvgElement;
  accentIcon: string;
  title: string;
  description: string;
  docsHref: string;
  defaultName: string;
  permission: ApiKeyPermission;
  expiration: ApiKeyExpiration;
}

export type ApiKeyCardVariant = ConnectedCardsVariant;
