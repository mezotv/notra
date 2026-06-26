import { buildOAuthAuthorizationServerMetadata } from "@/lib/oauth/metadata";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST() {
  return Response.json({
    status: "ok",
    client_id_metadata_document_supported: true,
    authorization_server: buildOAuthAuthorizationServerMetadata(),
  });
}
