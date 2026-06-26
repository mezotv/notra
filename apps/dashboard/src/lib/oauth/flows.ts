import { Effect } from "effect";
import {
  buildOAuthTokenResponse,
  verifyPkceChallenge,
} from "@/lib/oauth/crypto";
import {
  OAuthCryptoError,
  OAuthInvalidGrantError,
  OAuthStorageError,
} from "@/lib/oauth/errors";
import {
  consumeOAuthAuthorizationCode,
  createOAuthAuthorizationCode,
  createOAuthRefreshToken,
  rotateOAuthRefreshToken,
} from "@/lib/oauth/storage";
import type {
  OAuthAuthorizationCodePayload,
  OAuthRefreshTokenPayload,
} from "@/types/oauth";

export const createOAuthCode = Effect.fn("createOAuthCode")(function* (
  payload: OAuthAuthorizationCodePayload
) {
  return yield* Effect.tryPromise({
    try: () => createOAuthAuthorizationCode(payload),
    catch: (cause) =>
      new OAuthStorageError({
        operation: "create_authorization_code",
        cause,
      }),
  });
});

export const exchangeAuthorizationCode = Effect.fn("exchangeAuthorizationCode")(
  function* (input: {
    code: string;
    redirectUri: string;
    clientId: string;
    codeVerifier: string;
  }) {
    const codePayload = yield* Effect.tryPromise({
      try: () => consumeOAuthAuthorizationCode(input.code),
      catch: (cause) =>
        new OAuthStorageError({
          operation: "consume_authorization_code",
          cause,
        }),
    });

    if (!codePayload) {
      return yield* Effect.fail(
        new OAuthInvalidGrantError({ message: "Invalid authorization code" })
      );
    }

    if (
      codePayload.redirectUri !== input.redirectUri ||
      codePayload.clientId !== input.clientId
    ) {
      return yield* Effect.fail(
        new OAuthInvalidGrantError({
          message: "Authorization code binding mismatch",
        })
      );
    }

    if (!verifyPkceChallenge(input.codeVerifier, codePayload.codeChallenge)) {
      return yield* Effect.fail(
        new OAuthInvalidGrantError({ message: "Invalid PKCE verifier" })
      );
    }

    const tokenPayload: OAuthRefreshTokenPayload = {
      clientId: codePayload.clientId,
      scope: codePayload.scope,
      resource: codePayload.resource,
      userId: codePayload.userId,
      organizationId: codePayload.organizationId,
    };

    const refreshToken = yield* Effect.tryPromise({
      try: () => createOAuthRefreshToken(tokenPayload),
      catch: (cause) =>
        new OAuthStorageError({
          operation: "create_refresh_token",
          cause,
        }),
    });

    return yield* Effect.tryPromise({
      try: () => buildOAuthTokenResponse(tokenPayload, refreshToken),
      catch: (cause) =>
        new OAuthCryptoError({
          operation: "sign_access_token",
          cause,
        }),
    });
  }
);

export const exchangeRefreshToken = Effect.fn("exchangeRefreshToken")(
  function* (input: { refreshToken: string; clientId?: string }) {
    const rotated = yield* Effect.tryPromise({
      try: () => rotateOAuthRefreshToken(input.refreshToken),
      catch: (cause) =>
        new OAuthStorageError({
          operation: "rotate_refresh_token",
          cause,
        }),
    });

    if (!rotated) {
      return yield* Effect.fail(
        new OAuthInvalidGrantError({ message: "Invalid refresh token" })
      );
    }

    if (input.clientId && input.clientId !== rotated.payload.clientId) {
      return yield* Effect.fail(
        new OAuthInvalidGrantError({
          message: "Refresh token client mismatch",
        })
      );
    }

    return yield* Effect.tryPromise({
      try: () => buildOAuthTokenResponse(rotated.payload, rotated.refreshToken),
      catch: (cause) =>
        new OAuthCryptoError({
          operation: "sign_access_token",
          cause,
        }),
    });
  }
);
