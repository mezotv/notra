export interface ScheduledContentStatusEmailProps {
  organizationName: string;
  scheduleName: string;
  reason: string;
  settingsLink: string;
  organizationSlug: string;
}

export type ScheduledContentStatus = "failed" | "skipped";

export interface ScheduledContentStatusTemplateProps extends ScheduledContentStatusEmailProps {
  status: ScheduledContentStatus;
}
