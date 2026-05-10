import type { IconSvgElement } from "@hugeicons/react";

export interface NotificationSettings {
  scheduledContentCreation: boolean;
  scheduledContentFailed: boolean;
  scheduledContentSkipped: boolean;
  marketingEmails: boolean;
}

export type NotificationToggleKey = keyof NotificationSettings;

export interface NotificationToggleConfig {
  key: NotificationToggleKey;
  label: string;
  description: string;
  defaultValue: boolean;
  icon: IconSvgElement;
}

export interface NotificationToggleGroup {
  heading: string;
  toggles: NotificationToggleConfig[];
}

export interface NotificationToggleRowProps {
  config: NotificationToggleConfig;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface NotificationFooterProps {
  emails: string[];
}
