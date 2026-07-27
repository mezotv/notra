import { Effect } from "effect";
import {
  badRequest,
  paymentRequired,
  serviceUnavailable,
} from "@/lib/orpc/utils/errors";
import {
  getSocialConnectStatusCode,
  type SocialConnectConfigError,
  type SocialConnectRequestError,
} from "@/lib/social-connect/errors";

type SocialConnectFailure =
  | SocialConnectConfigError
  | SocialConnectRequestError;

interface RunSocialConnectOptions {
  logLabel: string;
  reconnectHint?: boolean;
}

export async function runSocialConnect<A>(
  effect: Effect.Effect<A, SocialConnectFailure>,
  options: RunSocialConnectOptions
): Promise<A> {
  const result = await Effect.runPromise(
    effect.pipe(
      Effect.map((value) => ({ ok: true as const, value })),
      Effect.catch((error) => Effect.succeed({ ok: false as const, error }))
    )
  );

  if (result.ok) {
    return result.value;
  }

  const { error } = result;
  if (error._tag === "SocialConnectConfigError") {
    throw serviceUnavailable(error.message);
  }

  console.error(`${options.logLabel}:`, error);
  const message =
    error.cause instanceof Error ? error.cause.message : error.message;
  const statusCode = getSocialConnectStatusCode(error.cause);

  if (options.reconnectHint && (statusCode === 401 || statusCode === 403)) {
    throw badRequest("This account is not authorized to post right now.", {
      code: "reconnect_required",
    });
  }
  if (statusCode === 402) {
    throw paymentRequired(message);
  }
  if (statusCode !== null && statusCode >= 400 && statusCode < 500) {
    throw badRequest(message);
  }
  throw serviceUnavailable(
    "The social platform service is temporarily unavailable. Please try again in a few minutes."
  );
}
