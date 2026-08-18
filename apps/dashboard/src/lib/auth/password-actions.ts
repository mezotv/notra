"use server";

import type { Ratelimit } from "@upstash/ratelimit";
import { getWorkOS, saveSession } from "@workos-inc/authkit-nextjs";
import type { AuthenticationResponse } from "@workos-inc/node";
import { Effect } from "effect";
import { headers } from "next/headers";
import { UserSyncError, WorkOSAuthError } from "@/lib/auth/errors";
import { authenticateResolvingOrgSelection } from "@/lib/auth/org-selection";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { syncAuthenticatedUser } from "@/lib/auth/sync";
import { readWorkOSError } from "@/lib/auth/workos-error";
import { sendResetPasswordAction } from "@/lib/email/actions";
import {
  loginSchema,
  signupSchema,
  verificationCodeSchema,
} from "@/schemas/auth/credentials";
import type {
  AuthFlowResult,
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  VerifyEmailCodeInput,
} from "@/types/auth/password-actions";
import { getClientIpFromHeaders, ratelimit } from "@/utils/ratelimit";

const VERIFICATION_REQUIRED_CODE = "email_verification_required";
const NAME_SPLIT_REGEX = /\s+/;
const DEFAULT_POST_LOGIN_PATH = "/callback";
const RATE_LIMITED_MESSAGE = "Too many attempts. Please try again shortly.";

async function isRateLimited(limiter: Ratelimit, email: string) {
  const headersList = await headers();
  const ip = getClientIpFromHeaders(headersList);
  const { success } = await limiter.limit(`${ip}:${email.toLowerCase()}`);
  return !success;
}

function getClientId() {
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error("WORKOS_CLIENT_ID must be defined");
  }
  return clientId;
}

function getAppUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

const tryWorkOSAuth = <T>(run: () => Promise<T>) =>
  Effect.tryPromise({
    try: run,
    catch: (error) => new WorkOSAuthError({ error }),
  });

const completeAuthentication = Effect.fn("auth.password.completeSession")(
  function* (response: AuthenticationResponse, returnTo?: string | null) {
    yield* Effect.tryPromise({
      try: () => saveSession(response, getAppUrl()),
      catch: (cause) =>
        new UserSyncError({ message: "Failed to persist session", cause }),
    });

    yield* syncAuthenticatedUser({
      workosUser: response.user,
      oauthTokens: response.oauthTokens,
      authenticationMethod: response.authenticationMethod,
    });

    const redirectTo =
      sanitizeReturnTo(returnTo ?? null) ?? DEFAULT_POST_LOGIN_PATH;

    const result: AuthFlowResult = { status: "success", redirectTo };
    return result;
  }
);

const mapAuthFailure =
  (email: string) =>
  (error: WorkOSAuthError | UserSyncError | { message: string }) => {
    if (error instanceof WorkOSAuthError) {
      const info = readWorkOSError(error.error);

      if (
        info.code === VERIFICATION_REQUIRED_CODE &&
        info.pendingAuthenticationToken
      ) {
        return Effect.succeed<AuthFlowResult>({
          status: "verification-required",
          pendingAuthenticationToken: info.pendingAuthenticationToken,
          email,
        });
      }

      return Effect.succeed<AuthFlowResult>({
        status: "error",
        message: info.message,
      });
    }

    return Effect.succeed<AuthFlowResult>({
      status: "error",
      message: error.message,
    });
  };

const runAuthFlow = (
  email: string,
  flow: Effect.Effect<AuthFlowResult, WorkOSAuthError | UserSyncError>
): Promise<AuthFlowResult> =>
  Effect.runPromise(flow.pipe(Effect.catch(mapAuthFailure(email))));

export async function signInWithPasswordAction(
  input: SignInWithPasswordInput
): Promise<AuthFlowResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid credentials",
    };
  }

  if (await isRateLimited(ratelimit.signIn, parsed.data.email)) {
    return { status: "error", message: RATE_LIMITED_MESSAGE };
  }

  return runAuthFlow(
    parsed.data.email,
    Effect.gen(function* () {
      const response = yield* authenticateResolvingOrgSelection(() =>
        getWorkOS().userManagement.authenticateWithPassword({
          clientId: getClientId(),
          email: parsed.data.email,
          password: parsed.data.password,
        })
      );

      return yield* completeAuthentication(response, input.returnTo);
    })
  );
}

export async function signUpWithPasswordAction(
  input: SignUpWithPasswordInput
): Promise<AuthFlowResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  }

  if (await isRateLimited(ratelimit.signUp, parsed.data.email)) {
    return { status: "error", message: RATE_LIMITED_MESSAGE };
  }

  const [firstName, ...rest] = (input.name ?? "")
    .trim()
    .split(NAME_SPLIT_REGEX);

  return runAuthFlow(
    parsed.data.email,
    Effect.gen(function* () {
      yield* tryWorkOSAuth(() =>
        getWorkOS().userManagement.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          firstName: firstName || undefined,
          lastName: rest.join(" ") || undefined,
        })
      );

      const response = yield* authenticateResolvingOrgSelection(() =>
        getWorkOS().userManagement.authenticateWithPassword({
          clientId: getClientId(),
          email: parsed.data.email,
          password: parsed.data.password,
        })
      );

      return yield* completeAuthentication(response, input.returnTo);
    })
  );
}

export async function verifyEmailCodeAction(
  input: VerifyEmailCodeInput
): Promise<AuthFlowResult> {
  const codeValidation = verificationCodeSchema.safeParse(input.code);

  if (!codeValidation.success) {
    return {
      status: "error",
      message: codeValidation.error.issues[0]?.message ?? "Invalid code",
    };
  }

  return runAuthFlow(
    "",
    Effect.gen(function* () {
      const response = yield* authenticateResolvingOrgSelection(() =>
        getWorkOS().userManagement.authenticateWithEmailVerification({
          clientId: getClientId(),
          code: codeValidation.data,
          pendingAuthenticationToken: input.pendingAuthenticationToken,
        })
      );

      return yield* completeAuthentication(response, input.returnTo);
    })
  );
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<{ sent: boolean }> {
  if (await isRateLimited(ratelimit.forgotPassword, input.email)) {
    return { sent: false };
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const reset = yield* tryWorkOSAuth(() =>
        getWorkOS().userManagement.createPasswordReset({ email: input.email })
      );

      yield* tryWorkOSAuth(() =>
        sendResetPasswordAction({
          userEmail: input.email,
          resetLink: reset.passwordResetUrl,
        })
      );

      return { sent: true };
    }).pipe(
      Effect.catch((error) =>
        Effect.logWarning("Password reset request failed").pipe(
          Effect.annotateLogs({
            error: readWorkOSError(error.error).message,
          }),
          Effect.as({ sent: true })
        )
      )
    )
  );
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<AuthFlowResult> {
  return Effect.runPromise(
    tryWorkOSAuth(() =>
      getWorkOS().userManagement.resetPassword({
        token: input.token,
        newPassword: input.newPassword,
      })
    ).pipe(
      Effect.as<AuthFlowResult>({ status: "success", redirectTo: "/login" }),
      Effect.catch((error) =>
        Effect.succeed<AuthFlowResult>({
          status: "error",
          message: readWorkOSError(error.error).message,
        })
      )
    )
  );
}
