import { type NextRequest, NextResponse } from "next/server";
import { createChatAgent } from "@/lib/ai/agents/chat";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { editContentSchema } from "@/utils/schemas/content";

interface RouteContext {
  params: Promise<{ organizationId: string; contentId: string }>;
}

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const validationResult = editContentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { instruction, currentMarkdown, selectedText } =
      validationResult.data;

    let updatedMarkdown = currentMarkdown;

    console.log("Creating chat agent for content edit...");
    console.log("AI_GATEWAY_API_KEY set:", !!process.env.AI_GATEWAY_API_KEY);

    const agent = createChatAgent({
      organizationId,
      currentMarkdown,
      selectedText: selectedText ?? undefined,
      onMarkdownUpdate: (markdown) => {
        console.log("Markdown updated by agent");
        updatedMarkdown = markdown;
      },
    });

    console.log("Starting agent generation...");
    await agent.generate({ prompt: instruction });
    console.log("Agent generation complete");

    return NextResponse.json({
      markdown: updatedMarkdown,
    });
  } catch (error) {
    console.error("Error editing content:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to edit content" },
      { status: 500 }
    );
  }
}
