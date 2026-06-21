import { Effect } from "effect";
import { NextResponse } from "next/server";
import { sendOssApplicationEmail } from "@/lib/oss-program/send-application-email";
import { ossProgramApplicationSchema } from "@/schemas/oss-program";
import { jsonError } from "@/utils/revalidate-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parsed = ossProgramApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid application", 400);
  }

  const { name, email, projectName, repositoryUrl, description, assetNeeds } =
    parsed.data;

  return Effect.runPromise(
    sendOssApplicationEmail({
      name,
      email,
      projectName,
      repositoryUrl,
      description,
      assetNeeds,
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          console.error("Failed to send OSS application email", error);
          return jsonError("Failed to submit application", 500);
        },
        onSuccess: () => NextResponse.json({ success: true }),
      })
    )
  );
}
