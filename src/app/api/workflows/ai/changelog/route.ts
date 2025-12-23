import { NextResponse } from "next/server";
import { githubChangelogAgent } from "@/lib/agents/changelog";
import { generateChangelogBodySchema } from "@/utils/schemas/workflows";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = generateChangelogBodySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { prompt } = validationResult.data;

    const result = await githubChangelogAgent.stream({
      prompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error generating changelog:", error);
    return NextResponse.json(
      { error: "Failed to generate changelog" },
      { status: 500 }
    );
  }
}
