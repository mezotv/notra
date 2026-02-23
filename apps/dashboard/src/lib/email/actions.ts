"use server";

import { EMAIL_CONFIG, getResend, sendDevEmail } from "@notra/email";
import { headers } from "next/headers";
import type {
  SendInviteEmailProps,
  SendResetPasswordProps,
  SendVerificationEmailProps,
  SendWelcomeEmailProps,
} from "@/types/lib/email/actions";
import { getServerSession } from "../auth/session";
import {
  sendInviteEmail,
  sendResetPassword,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./send";

const isDevelopment = process.env.NODE_ENV === "development";
const resend = getResend();

export async function sendInviteEmailAction({
  inviteeEmail,
  inviterName,
  inviterEmail,
  workspaceName,
  inviteLink,
}: SendInviteEmailProps) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: EMAIL_CONFIG.from,
      to: inviteeEmail,
      subject: `Join ${workspaceName} on Notra`,
      text: "This is a mock invite email",
      _mockContext: {
        type: "invite",
        data: {
          inviteeEmail,
          inviterName,
          inviterEmail,
          workspaceName,
          inviteLink,
        },
      },
    });
  }

  const { session } = await getServerSession({ headers: await headers() });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    const { error } = await sendInviteEmail(resend, {
      inviteeEmail,
      inviterName,
      inviterEmail,
      organizationName: workspaceName,
      inviteLink,
    });

    if (error) {
      console.error(`Failed to send invite email to ${inviteeEmail}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(
      `Unexpected error sending invite email to ${inviteeEmail}:`,
      error
    );
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationEmailAction({
  userEmail,
  otp,
  type,
}: SendVerificationEmailProps) {
  if (!resend && isDevelopment) {
    const subject =
      type === "sign-in" ? "Your sign-in code" : "Verify your email address";
    return sendDevEmail({
      from: EMAIL_CONFIG.from,
      to: userEmail,
      text: "This is a mock verification email",
      subject,
      _mockContext: {
        type: "verification",
        data: { userEmail, otp, verificationType: type },
      },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    const { error } = await sendVerificationEmail(resend, {
      userEmail,
      otp,
      type,
    });

    if (error) {
      console.error(`Failed to send ${type} email to ${userEmail}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(
      `Unexpected error sending ${type} email to ${userEmail}:`,
      error
    );
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendResetPasswordAction({
  userEmail,
  resetLink,
}: SendResetPasswordProps) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: EMAIL_CONFIG.from,
      to: userEmail,
      text: "This is a mock reset password email",
      subject: "Reset your password",
      _mockContext: { type: "reset", data: { userEmail, resetLink } },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    const { error } = await sendResetPassword(resend, {
      userEmail,
      resetLink,
    });

    if (error) {
      console.error(`Failed to send reset email to ${userEmail}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(
      `Unexpected error sending reset email to ${userEmail}:`,
      error
    );
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendWelcomeEmailAction({
  userEmail,
}: SendWelcomeEmailProps) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Dominik from Notra <dominik@usenotra.com>",
      to: userEmail,
      text: "This is a mock welcome email from the founder",
      subject: "Welcome to Notra",
      _mockContext: { type: "welcome", data: { userEmail } },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    const { error } = await sendWelcomeEmail(resend, {
      userEmail,
    });

    if (error) {
      console.error(`Failed to send welcome email to ${userEmail}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(
      `Unexpected error sending welcome email to ${userEmail}:`,
      error
    );
    return { success: false, error: "Failed to send email" };
  }
}
