import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  enforceContactMessageRateLimit,
  getContactRateLimitHeaders,
} from "@/lib/contact/ratelimit";
import { sendContactMessageEmail } from "@/lib/contact/send-message-email";
import { contactMessageSchema } from "@/schemas/contact";
import { jsonError } from "@/utils/revalidate-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const parsed = contactMessageSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid contact message", 400);
  }

  return Effect.runPromise(
    Effect.gen(function* () {
      const rateLimit = yield* enforceContactMessageRateLimit(request);
      yield* sendContactMessageEmail(parsed.data);

      return NextResponse.json(
        { success: true },
        { headers: getContactRateLimitHeaders(rateLimit) }
      );
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error._tag === "ContactMessageRateLimitExceeded") {
            return NextResponse.json(
              { error: "Rate limit exceeded" },
              { headers: getContactRateLimitHeaders(error, true), status: 429 }
            );
          }

          console.error("Failed to send contact message email", error);
          return jsonError("Failed to send message", 500);
        },
        onSuccess: (response) => response,
      })
    )
  );
}
