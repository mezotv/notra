import { NextResponse } from "next/server";
import type { RevalidateMarbleContentOptions } from "~types/marble";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function getManualRevalidateParams(
  request: Request
): RevalidateMarbleContentOptions {
  const url = new URL(request.url);

  return {
    category: url.searchParams.get("category") ?? undefined,
    slug: url.searchParams.get("slug") ?? undefined,
  };
}
