import { NextResponse } from "next/server";

export function GET() {
  const cacheControlHeaders = { "Cache-Control": "no-store" };

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
