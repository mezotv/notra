import { ScheduledContentStatusEmail } from "../components/scheduled-content-status";
import type { ScheduledContentStatusEmailProps } from "../types/scheduled-content-status";

export const ScheduledContentSkippedEmail = ({
  organizationName = "Acme Inc",
  scheduleName = "Weekly Product Updates",
  reason = "No meaningful changes were found in the lookback window.",
  organizationSlug = "acme",
  settingsLink = `https://app.usenotra.com/${organizationSlug}/automation/schedules`,
}: ScheduledContentStatusEmailProps) => (
  <ScheduledContentStatusEmail
    organizationName={organizationName}
    organizationSlug={organizationSlug}
    reason={reason}
    scheduleName={scheduleName}
    settingsLink={settingsLink}
    status="skipped"
  />
);
