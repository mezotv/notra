import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );
  const url = await getSignInUrl(returnTo ? { returnTo } : undefined);
  redirect(url);
}
