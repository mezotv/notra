import { cookies } from "next/headers";

import { WORKOS_SESSION_COOKIE_FALLBACK } from "@/constants/cookies";

export async function clearAuthSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: process.env.WORKOS_COOKIE_NAME || WORKOS_SESSION_COOKIE_FALLBACK,
    domain: process.env.WORKOS_COOKIE_DOMAIN,
    path: "/",
  });
}
