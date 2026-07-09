import {
  EVE_AGENT_ORGANIZATION_HEADER,
  EVE_AGENT_SERVICE_USERNAME,
} from "@notra/ai/constants/onboarding-agent";
import {
  type AuthFn,
  extractBearerToken,
  localDev,
  type VercelSubjectEnvironment,
  vercelOidc,
  vercelSubject,
  verifyHttpBasic,
  verifyVercelOidc,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import { ALLOWED_VERCEL_ENVIRONMENTS } from "../lib/constants/auth";
import type { VerifiedSessionAuth } from "../lib/types/auth";

function getDashboardEnvironment(): VercelSubjectEnvironment {
  const configured = process.env.DASHBOARD_VERCEL_ENVIRONMENT;
  const match = ALLOWED_VERCEL_ENVIRONMENTS.find(
    (value) => value === configured
  );
  return match ?? "production";
}

function withOrganizationAttribute(
  sessionAuth: VerifiedSessionAuth,
  request: Request
): VerifiedSessionAuth {
  const organizationId = request.headers.get(EVE_AGENT_ORGANIZATION_HEADER);
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
      subjects: [
        vercelSubject({
          environment: getDashboardEnvironment(),
          projectName,
          teamSlug,
        }),
      ],
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
      username: EVE_AGENT_SERVICE_USERNAME,
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
