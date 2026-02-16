export interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
}

export interface SendVerificationEmailProps {
  userEmail: string;
  otp: string;
  type: "sign-in" | "email-verification";
}

export interface SendResetPasswordProps {
  userEmail: string;
  resetLink: string;
}

export interface SendWelcomeEmailProps {
  userEmail: string;
}
