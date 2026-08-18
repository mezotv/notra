import { cookies } from "next/headers";
import { WORKOS_SESSION_COOKIE } from "@/constants/cookies";

export async function GET() {
  const cookieStore = await cookies();
  const cookieName = process.env.WORKOS_COOKIE_NAME ?? WORKOS_SESSION_COOKIE;
  const domain = process.env.WORKOS_COOKIE_DOMAIN;

  if (domain) {
    cookieStore.delete({ name: cookieName, domain, path: "/" });
  } else {
    cookieStore.delete(cookieName);
  }

  return new Response("Your account has been suspended.", { status: 403 });
}
