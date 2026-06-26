import { buildOAuthAuthorizationServerMetadata } from "@/lib/oauth/metadata";
import { registerOAuthClient } from "@/lib/oauth/storage";
import { oauthClientRegistrationSchema } from "@/schemas/oauth";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = oauthClientRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_client_metadata" }, { status: 400 });
  }

  const client = await registerOAuthClient({
    redirectUris: parsed.data.redirect_uris,
    clientName: parsed.data.client_name,
  });

  return Response.json({
    client_id: client.clientId,
    client_id_issued_at: Math.floor(
      new Date(client.createdAt).getTime() / 1000
    ),
    client_name: client.clientName,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    authorization_server: buildOAuthAuthorizationServerMetadata(),
  });
}
