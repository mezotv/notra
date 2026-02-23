import { type NextRequest, NextResponse } from "next/server";
import { getClientIp, ratelimit } from "@/utils/ratelimit";

export async function GET(request: NextRequest) {
  const cacheControlHeaders = { "Cache-Control": "no-store" };

  const { success, reset } = await ratelimit.free.limit(getClientIp(request));

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset },
      { status: 429, headers: cacheControlHeaders }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      time: new Date().toISOString(),
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
    {
      status: 200,
      headers: cacheControlHeaders,
    }
  );
}
