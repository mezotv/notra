"use server";

import type {
  AuthFlowResult,
  SignInWithPasswordInput,
  VerifyEmailCodeInput,
} from "@notra/ui/lib/auth-types";
import { getWorkOS, saveSession } from "@workos-inc/authkit-nextjs";
import type { AuthenticationResponse } from "@workos-inc/node";
import { Effect } from "effect";
import { UserSyncError, WorkOSAuthError } from "@/lib/auth/errors";
import { authenticateResolvingOrgSelection } from "@/lib/auth/org-selection";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { ensureLocalUser } from "@/lib/auth/sync";
import { readWorkOSError } from "@/lib/auth/workos-error";
import { loginSchema, verificationCodeSchema } from "@/schemas/auth";

const VERIFICATION_REQUIRED_CODE = "email_verification_required";
const DEFAULT_POST_LOGIN_PATH = "/dashboard";

function getClientId() {
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error("WORKOS_CLIENT_ID must be defined");
  }
  return clientId;
}

function getAppUrl() {
  return process.env.CONSOLE_APP_URL ?? "http://localhost:3003";
}

const completeAuthentication = Effect.fn("auth.password.completeSession")(
  function* (response: AuthenticationResponse, returnTo?: string | null) {
    yield* Effect.tryPromise({
      try: () => saveSession(response, getAppUrl()),
      catch: (cause) =>
        new UserSyncError({ message: "Failed to persist session", cause }),
    });

    yield* ensureLocalUser(response.user);

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
