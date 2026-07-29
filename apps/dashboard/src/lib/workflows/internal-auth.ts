import {
  extractBearerToken,
  localDev,
  type VercelSubjectEnvironment,
  vercelSubject,
  verifyVercelOidc,
} from "eve/channels/auth";
import { ALLOWED_VERCEL_ENVIRONMENTS } from "@/constants/internal-auth";

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
  const teamSlug = process.env.DASHBOARD_VERCEL_TEAM_SLUG;
  const projectName = process.env.API_VERCEL_PROJECT_NAME;
  if (teamSlug && projectName) {
    const token = extractBearerToken(request.headers.get("authorization"));
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
