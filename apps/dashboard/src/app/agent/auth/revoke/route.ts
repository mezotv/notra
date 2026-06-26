import { revokeOAuthRefreshToken } from "@/lib/oauth/storage";
import { oauthRevokeTokenSchema } from "@/schemas/oauth";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());

  const parsed = oauthRevokeTokenSchema.safeParse(body);
  if (parsed.success && parsed.data.token_type_hint !== "access_token") {
    await revokeOAuthRefreshToken(parsed.data.token);
  }

  return new Response(null, { status: 200 });
}
