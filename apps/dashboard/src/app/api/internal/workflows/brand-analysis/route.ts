import { verifyInternalWorkflowRequest } from "@/lib/workflows/internal-auth";
import { startBrandAnalysisRun } from "@/lib/workflows/start";
import { brandAnalysisPayloadSchema } from "@/workflows/brand-analysis";

export async function POST(request: Request) {
  const authorized = await verifyInternalWorkflowRequest(request);
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parsed = brandAnalysisPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { runId } = await startBrandAnalysisRun(parsed.data);
  return Response.json({ runId }, { status: 202 });
}
