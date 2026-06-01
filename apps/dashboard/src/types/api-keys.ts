import type { IconSvgElement } from "@hugeicons/react";
import type {
  API_KEY_EXPIRATION_VALUES,
  API_KEY_PERMISSIONS,
  API_KEY_PRESET_IDS,
} from "@/constants/api-keys";

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];
export type ApiKeyPresetId = (typeof API_KEY_PRESET_IDS)[number];
export type ApiKeyExpiration = (typeof API_KEY_EXPIRATION_VALUES)[number];

export interface ApiKeyPreset {
  id: ApiKeyPresetId;
  icon: IconSvgElement;
  title: string;
  description: string;
  docsHref: string;
  defaultName: string;
  permission: ApiKeyPermission;
  expiration: ApiKeyExpiration;
}
