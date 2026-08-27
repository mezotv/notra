import { getVercelOidcToken } from "@vercel/oidc";

import { internalWorkflowStartResponseSchema } from "../schemas/internal-workflow";

interface InternalWorkflowEnv {
  WORKFLOW_BASE_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getInternalWorkflowUrl(env: InternalWorkflowEnv, path: string) {
  if (!env.WORKFLOW_BASE_URL) {
    return null;
  }

  return `${trimTrailingSlash(env.WORKFLOW_BASE_URL)}${path}`;
}

export async function startDashboardWorkflow(
  url: string,
  payload: unknown
): Promise<string> {
  const secret = process.env.INTERNAL_WORKFLOW_SECRET?.trim();
  const token = secret || (await getVercelOidcToken().catch(() => null));
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Workflow start failed with status ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const data: unknown = await response.json();
  const parsed = internalWorkflowStartResponseSchema.parse(data);
  return parsed.runId;
}
