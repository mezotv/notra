import type { VercelSubjectEnvironment } from "eve/channels/auth";

export const ALLOWED_VERCEL_ENVIRONMENTS: readonly VercelSubjectEnvironment[] =
  ["production", "preview", "development"];
