import { EVE_AGENT_SERVICE_USERNAME } from "@notra/ai/constants/onboarding-agent";
import { getVercelOidcToken } from "@vercel/oidc";

export async function getEveServiceAuth() {
  const token = await getVercelOidcToken().catch(() => undefined);
  if (token) {
    return { vercelOidc: { token } } as const;
  }

  const password = process.env.EVE_ONBOARDING_AGENT_PASSWORD;
  return password
    ? {
        basic: { password, username: EVE_AGENT_SERVICE_USERNAME },
      }
    : undefined;
}
