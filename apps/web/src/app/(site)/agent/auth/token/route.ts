import type { NextRequest } from "next/server";

import { redirectToAuthServer } from "@/utils/oauth-redirect";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export function POST(request: NextRequest) {
  return redirectToAuthServer(
    request,
    "https://auth.usenotra.com/oauth2/token"
  );
}
