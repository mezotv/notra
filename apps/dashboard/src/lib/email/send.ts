import {
  EMAIL_CONFIG,
  InviteUserEmail,
  ResetPasswordEmail,
  ScheduledContentCreatedEmail,
  ScheduledContentFailedEmail,
  VerifyUserEmail,
  WelcomeEmail,
} from "@notra/email";
import type { Resend } from "resend";
import type {
  EmailResult,
  SendInviteEmailProps,
  SendScheduledContentCreatedEmailProps,
  SendScheduledContentFailedEmailProps,
} from "@/types/lib/email/send";

// --- Retry & Idempotency ---

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

function isRetryable(error: { name: string; message: string }): boolean {
  const name = error.name.toLowerCase();
  const msg = error.message.toLowerCase();
  return (
    name.includes("rate_limit") ||
    name.includes("internal_server") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused")
  );
}

function retryDelay(attempt: number): Promise<void> {
  const ms = Math.min(
    BASE_DELAY_MS * 2 ** attempt + Math.random() * 1000,
    MAX_DELAY_MS
  );
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
  idempotencyKey: string
): Promise<EmailResult> {
  let lastError: EmailResult["error"] = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send(payload, {
        idempotencyKey,
      });

      if (data) {
        return { data, error: null };
      }

      if (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          await retryDelay(attempt);
          continue;
        }
        return { data: null, error };
      }

      return {
        data: null,
        error: {
          name: "unknown_error",
          message: "No data or error returned from Resend",
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = { name: "network_error", message };

      if (attempt < MAX_RETRIES) {
        await retryDelay(attempt);
      }
    }
  }

  return {
    data: null,
    error: lastError ?? {
      name: "unknown_error",
      message: "Email send failed after retries",
    },
  };
}

// --- Send Functions ---

export async function sendInviteEmail(
  resend: Resend,
  {
    inviteeEmail,
    inviterName,
    inviterEmail,
    organizationName,
    inviteLink,
  }: SendInviteEmailProps
) {
  return sendWithRetry(
    resend,
    {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: inviteeEmail,
      subject: `Join ${organizationName} on Notra`,
      react: InviteUserEmail({
        inviteeEmail,
        invitedByUsername: inviterName,
        invitedByEmail: inviterEmail,
        organizationName,
        inviteLink,
      }),
      tags: [{ name: "category", value: "invite" }],
    },
    `notra:invite:${inviteeEmail}:${inviteLink}`
  );
}

function getVerificationSubject(type: "sign-in" | "email-verification") {
  switch (type) {
    case "sign-in":
      return "Your sign-in code";
    case "email-verification":
      return "Verify your email address";
    default: {
      const _exhaustiveCheck: never = type;
      return _exhaustiveCheck;
    }
  }
}

export async function sendVerificationEmail(
  resend: Resend,
  {
    userEmail,
    otp,
    type,
  }: {
    userEmail: string;
    otp: string;
    type: "sign-in" | "email-verification";
  }
) {
  return sendWithRetry(
    resend,
    {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: userEmail,
      subject: getVerificationSubject(type),
      react: VerifyUserEmail({
        userEmail,
        otp,
        type,
      }),
      tags: [{ name: "category", value: type }],
      headers: {
        "X-Entity-Ref-ID": `notra:${type}:${userEmail}:${otp}`,
      },
    },
    `notra:verify:${userEmail}:${otp}`
  );
}

export async function sendResetPassword(
  resend: Resend,
  {
    userEmail,
    resetLink,
  }: {
    userEmail: string;
    resetLink: string;
  }
) {
  return sendWithRetry(
    resend,
    {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: userEmail,
      subject: "Reset your password",
      react: ResetPasswordEmail({
        userEmail,
        resetLink,
      }),
      tags: [{ name: "category", value: "password-reset" }],
    },
    `notra:reset:${userEmail}:${resetLink}`
  );
}

export async function sendWelcomeEmail(
  resend: Resend,
  {
    userEmail,
  }: {
    userEmail: string;
  }
) {
  return sendWithRetry(
    resend,
    {
      from: "Dominik from Notra <dominik@usenotra.com>",
      replyTo: "dominik@usenotra.com",
      to: userEmail,
      subject: "Welcome to Notra",
      react: WelcomeEmail(),
      tags: [{ name: "category", value: "welcome" }],
    },
    `notra:welcome:${userEmail}`
  );
}

export async function sendScheduledContentFailedEmail(
  resend: Resend,
  {
    recipientEmail,
    organizationName,
    scheduleName,
    reason,
    organizationSlug,
    subject,
  }: SendScheduledContentFailedEmailProps
) {
  const settingsLink = `${process.env.BETTER_AUTH_URL ?? "https://app.usenotra.com"}/${organizationSlug}/schedules`;

  return sendWithRetry(
    resend,
    {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: recipientEmail,
      subject:
        subject ?? `Your ${scheduleName} schedule failed to generate content`,
      react: ScheduledContentFailedEmail({
        organizationName,
        organizationSlug,
        scheduleName,
        reason,
        settingsLink,
      }),
      tags: [{ name: "category", value: "schedule-content-failed" }],
    },
    `notra:schedule-content-failed:${recipientEmail}:${scheduleName}:${Date.now()}`
  );
}

export async function sendScheduledContentCreatedEmail(
  resend: Resend,
  {
    recipientEmail,
    organizationName,
    scheduleName,
    contentTitle,
    contentType,
    contentLink,
    organizationSlug,
    subject,
  }: SendScheduledContentCreatedEmailProps
) {
  return sendWithRetry(
    resend,
    {
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: recipientEmail,
      subject: subject ?? `Your ${scheduleName} schedule created new content`,
      react: ScheduledContentCreatedEmail({
        organizationName,
        organizationSlug,
        scheduleName,
        contentTitle,
        contentType,
        contentLink,
      }),
      tags: [{ name: "category", value: "schedule-content-created" }],
    },
    `notra:schedule-content-created:${recipientEmail}:${contentLink}`
  );
}
