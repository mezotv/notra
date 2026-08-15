export interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
}

export interface SendResetPasswordProps {
  userEmail: string;
  resetLink: string;
}

export interface SendWelcomeEmailProps {
  userEmail: string;
}
