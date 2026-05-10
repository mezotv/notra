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

export interface NotificationRecipientsProps {
  emails: string[];
  isLoading: boolean;
}
