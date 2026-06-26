import { Effect } from "effect";
import {
  exchangeAuthorizationCode,
  exchangeRefreshToken,
} from "@/lib/oauth/flows";
import { oauthTokenRequestSchema } from "@/schemas/oauth";

function oauthError(
  error: string,
  errorDescription: string,
  status: 400 | 401 | 500 = 400
) {
  return Response.json(
    {
      error,
      error_description: errorDescription,
    },
    { status }
  );
}

async function parseTokenRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json().catch(() => ({}));
  }
  return Object.fromEntries((await request.formData()).entries());
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const body = await parseTokenRequest(request);
  const parsed = oauthTokenRequestSchema.safeParse(body);

  if (!parsed.success) {
    return oauthError("invalid_request", "Invalid OAuth token request");
  }

  if (parsed.data.grant_type === "refresh_token") {
    const result = await Effect.runPromise(
      exchangeRefreshToken({
        refreshToken: parsed.data.refresh_token,
        clientId: parsed.data.client_id,
      }).pipe(
        Effect.match({
          onFailure: (error) => error,
          onSuccess: (tokenResponse) => tokenResponse,
        })
      )
    );

    if ("_tag" in result) {
      if (result._tag === "OAuthInvalidGrantError") {
        return oauthError("invalid_grant", result.message, 401);
      }
      return oauthError("server_error", "Failed to rotate refresh token", 500);
    }

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const result = await Effect.runPromise(
    exchangeAuthorizationCode({
      code: parsed.data.code,
      redirectUri: parsed.data.redirect_uri,
      clientId: parsed.data.client_id,
      codeVerifier: parsed.data.code_verifier,
    }).pipe(
      Effect.match({
        onFailure: (error) => error,
        onSuccess: (tokenResponse) => tokenResponse,
      })
    )
  );

  if ("_tag" in result) {
    if (result._tag === "OAuthInvalidGrantError") {
      return oauthError("invalid_grant", result.message, 401);
    }
    return oauthError(
      "server_error",
      "Failed to exchange authorization code",
      500
    );
  }

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
