import type { NextRequest } from "next/server";

export function redirectToAuthServer(request: NextRequest, target: string) {
  const url = new URL(target);
  url.search = request.nextUrl.search;
  return Response.redirect(url, 308);
}
