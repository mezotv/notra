import { timingSafeEqual } from "node:crypto";
import {
  extractBearerToken,
  localDev,
  type VercelSubjectEnvironment,
  vercelSubject,
  verifyVercelOidc,
} from "eve/channels/auth";
import { ALLOWED_VERCEL_ENVIRONMENTS } from "@/constants/internal-auth";

function matchesInternalWorkflowSecret(token: string | null): boolean {
  const secret = process.env.INTERNAL_WORKFLOW_SECRET;
  if (!(secret && token)) {
    return false;
  }
  const expected = Buffer.from(secret);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length) {
    return false;
  }
  return timingSafeEqual(expected, provided);
}

function getApiEnvironment(): VercelSubjectEnvironment {
  const configured = process.env.API_VERCEL_ENVIRONMENT;
  const match = ALLOWED_VERCEL_ENVIRONMENTS.find(
    (value) => value === configured
  );
  return match ?? "production";
}

export async function verifyInternalWorkflowRequest(
  request: Request
): Promise<boolean> {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (matchesInternalWorkflowSecret(token)) {
    return true;
  }

  const teamSlug = process.env.DASHBOARD_VERCEL_TEAM_SLUG;
  const projectName = process.env.API_VERCEL_PROJECT_NAME;
  if (teamSlug && projectName) {
    const result = await verifyVercelOidc(token, {
      subjects: [
        vercelSubject({
          environment: getApiEnvironment(),
          projectName,
          teamSlug,
        }),
      ],
    });
    if (result.ok) {
      return true;
    }
  }

  const isVercelDeployment =
    process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development";
  if (isVercelDeployment) {
    return false;
  }

  const localAuth = await localDev()(request);
  return localAuth !== null;
}
