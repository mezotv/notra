import type { FeedbackSentiment } from "@notra/email/types/feedback";

export interface EmailResult {
  data: { id: string } | null;
  error: { name: string; message: string } | null;
}

export interface SendFeedbackEmailProps {
  to: string;
  message: string;
  sentiment?: FeedbackSentiment;
  userName: string;
  userEmail: string;
  organizationName?: string;
  organizationSlug?: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
}

export interface SendScheduledContentFailedEmailProps {
  recipientEmail: string;
  organizationName: string;
  organizationSlug: string;
  scheduleName: string;
  reason: string;
  subject?: string;
}

export interface SendScheduledContentSkippedEmailProps {
  recipientEmail: string;
  organizationName: string;
  organizationSlug: string;
  scheduleName: string;
  reason: string;
  subject?: string;
}

export interface SendAiCreditsDepletedEmailProps {
  recipientEmail: string;
  organizationName: string;
  organizationSlug: string;
  automationName: string;
  subject?: string;
}

export interface ScheduledCreatedContentItem {
  title: string;
  contentLink: string;
}

export interface SendScheduledContentCreatedEmailProps {
  recipientEmail: string;
  organizationName: string;
  organizationSlug: string;
  scheduleName: string;
  createdContent: ScheduledCreatedContentItem[];
  contentType: string;
  contentOverviewLink: string;
  subject?: string;
}
