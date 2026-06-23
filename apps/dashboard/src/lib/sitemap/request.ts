import type { NextRequest } from "next/server";

export async function readJsonRequest(request: NextRequest) {
  try {
    return { ok: true as const, body: await request.json() };
  } catch {
    return { ok: false as const };
  }
}
