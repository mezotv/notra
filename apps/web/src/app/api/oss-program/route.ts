import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  enforceOssApplicationRateLimit,
  getRateLimitHeaders,
} from "@/lib/oss-program/ratelimit";
import { sendOssApplicationEmail } from "@/lib/oss-program/send-application-email";
import { ossProgramApplicationSchema } from "@/schemas/oss-program";
import { jsonError } from "@/utils/revalidate-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
    Effect.gen(function* () {
      const rateLimit = yield* enforceOssApplicationRateLimit(request);
      yield* sendOssApplicationEmail({
        name,
        email,
        projectName,
        repositoryUrl,
        description,
        assetNeeds,
      });

      return NextResponse.json(
        { success: true },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error._tag === "OssApplicationRateLimitExceeded") {
            return NextResponse.json(
              { error: "Rate limit exceeded" },
              { headers: getRateLimitHeaders(error, true), status: 429 }
            );
          }

          console.error("Failed to send OSS application email", error);
          return jsonError("Failed to submit application", 500);
        },
        onSuccess: (response) => response,
      })
    )
  );
}
