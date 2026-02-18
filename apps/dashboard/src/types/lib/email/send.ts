export interface EmailResult {
  data: { id: string } | null;
  error: { name: string; message: string } | null;
}

export interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
}

export interface SendScheduledContentCreatedEmailProps {
  recipientEmail: string;
  organizationName: string;
  scheduleName: string;
  contentTitle: string;
  contentType: string;
  contentLink: string;
  subject?: string;
}
