import type React from "react";
import type { SlackIntegration } from "./integrations";

export interface AddSlackIntegrationDialogProps {
  authorizeUrl: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export interface SlackOAuthState {
  organizationId: string;
  userId: string;
  callbackPath: string;
}

export interface SlackChannelOption {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number | null;
}

export interface SlackIntegrationCardProps {
  integration: SlackIntegration;
  organizationId: string;
  onUpdate?: () => void;
}

export interface SlackChannelAccessEditorProps {
  integration: SlackIntegration;
  organizationId: string;
  onUpdate?: () => void;
}

export interface SlackNotificationChannelPickerProps {
  integration: SlackIntegration;
  organizationId: string;
  onUpdate?: () => void;
}

export interface SlackSettingRowProps {
  title: string;
  description: string;
  children: React.ReactNode;
}
