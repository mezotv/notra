import {
  type AuthFn,
  extractBearerToken,
  localDev,
  vercelOidc,
  vercelSubject,
  verifyHttpBasic,
  verifyVercelOidc,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import {
  ORGANIZATION_ID_HEADER,
  SERVICE_AUTH_USERNAME,
} from "../lib/constants/auth";
import type { VerifiedSessionAuth } from "../lib/types/auth";

function withOrganizationAttribute(
  sessionAuth: VerifiedSessionAuth,
  request: Request
): VerifiedSessionAuth {
  const organizationId = request.headers.get(ORGANIZATION_ID_HEADER);
  if (!organizationId) {
    return sessionAuth;
  }
  return {
    ...sessionAuth,
    attributes: { ...sessionAuth.attributes, organizationId },
  };
}

function dashboardOidcAuth(): AuthFn<Request> {
  return async (request) => {
    const teamSlug = process.env.DASHBOARD_VERCEL_TEAM_SLUG;
    const projectName = process.env.DASHBOARD_VERCEL_PROJECT_NAME;
    if (!(teamSlug && projectName)) {
      return null;
    }

    const token = extractBearerToken(request.headers.get("authorization"));
    const result = await verifyVercelOidc(token, {
      subjects: [vercelSubject({ environment: "*", projectName, teamSlug })],
    });
    if (!result.ok) {
      return null;
    }

    return withOrganizationAttribute(result.sessionAuth, request);
  };
}

function dashboardServiceAuth(): AuthFn<Request> {
  return (request) => {
    const password = process.env.EVE_ONBOARDING_AGENT_PASSWORD;
    if (!password) {
      return null;
    }

    const result = verifyHttpBasic(request.headers.get("authorization"), {
      password,
      username: SERVICE_AUTH_USERNAME,
    });
    if (!result.ok) {
      return null;
    }

    return withOrganizationAttribute(result.sessionAuth, request);
  };
}

export default eveChannel({
  auth: [dashboardOidcAuth(), dashboardServiceAuth(), vercelOidc(), localDev()],
});
