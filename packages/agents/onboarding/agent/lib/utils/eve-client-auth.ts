import { EVE_AGENT_SERVICE_USERNAME } from "@notra/ai/constants/onboarding-agent";
import { getVercelOidcToken } from "@vercel/oidc";

export async function getEveServiceAuth() {
  try {
    const token = await getVercelOidcToken();
    if (token) {
      return { vercelOidc: { token } } as const;
    }
  } catch {
    // Basic auth is the supported fallback outside Vercel.
  }

  const password = process.env.EVE_ONBOARDING_AGENT_PASSWORD;
  return password
    ? {
        basic: { password, username: EVE_AGENT_SERVICE_USERNAME },
      }
    : undefined;
}
