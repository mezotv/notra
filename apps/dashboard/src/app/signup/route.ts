import { getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.searchParams);
  const returnTo = sanitizeReturnTo(params.get("returnTo"));
  params.delete("returnTo");

  const passthrough = params.toString();
  const destination =
    returnTo ?? (passthrough ? `/callback?${passthrough}` : null);

  const url = await getSignUpUrl(
    destination ? { returnTo: destination } : undefined
  );
  redirect(url);
}
