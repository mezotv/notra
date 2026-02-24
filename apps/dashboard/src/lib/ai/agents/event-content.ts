import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { generateText } from "ai";
import { marked } from "marked";
import { customAlphabet } from "nanoid";
import { gateway } from "@/lib/ai/gateway";
import type { ToneProfile } from "@/schemas/brand";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

interface EventContentOptions {
  organizationId: string;
  triggerId: string;
  triggerName: string;
  eventType: string;
  eventAction: string;
  eventData: Record<string, unknown>;
  repositoryOwner: string;
  repositoryName: string;
  outputType: string;
  tone: ToneProfile;
  brand: {
    companyName?: string;
    companyDescription?: string;
    audience?: string;
    customInstructions?: string | null;
  };
  sourceMetadata: Record<string, unknown>;
}

interface EventContentResult {
  postId: string;
  title: string;
}

const toneDescriptions: Record<ToneProfile, string> = {
  Conversational:
    "friendly, approachable, and easy to read. Use contractions and a warm tone.",
  Professional:
    "polished and business-appropriate while remaining engaging and clear.",
  Casual: "relaxed, fun, and informal. Feel free to use emojis sparingly.",
  Formal:
    "structured, precise, and authoritative. Avoid contractions and colloquialisms.",
};

function buildEventPrompt(options: EventContentOptions): string {
  const {
    eventType,
    eventAction,
    eventData,
    repositoryOwner,
    repositoryName,
    outputType,
    tone,
    brand,
  } = options;

  const toneDesc = toneDescriptions[tone] ?? toneDescriptions.Conversational;

  const contentTypeInstructions: Record<string, string> = {
    changelog: `Generate a changelog entry that summarizes this event.
- Use a clear, descriptive title
- Include relevant details from the event
- Format with markdown
- Keep it concise but informative`,
    linkedin_post: `Generate a LinkedIn post announcement for this event.
- Start with a compelling hook
- Keep it under 1300 characters
- Include 2-3 relevant hashtags at the end
- Make it engaging for a professional audience`,
  };

  const typeInstructions =
    contentTypeInstructions[outputType] ?? contentTypeInstructions.changelog;

  let brandContext = "";
  if (brand.companyName) {
    brandContext += `Company: ${brand.companyName}\n`;
  }
  if (brand.companyDescription) {
    brandContext += `About: ${brand.companyDescription}\n`;
  }
  if (brand.audience) {
    brandContext += `Target Audience: ${brand.audience}\n`;
  }
  if (brand.customInstructions) {
    brandContext += `Custom Instructions: ${brand.customInstructions}\n`;
  }

  return `You are a content writer creating ${outputType.replace("_", " ")} content.

Repository: ${repositoryOwner}/${repositoryName}
Event Type: ${eventType}
Event Action: ${eventAction}

Event Data:
${JSON.stringify(eventData, null, 2)}

${brandContext ? `Brand Context:\n${brandContext}\n` : ""}

Writing Style: ${toneDesc}

${typeInstructions}

Generate the content now. Output ONLY the content itself, no explanations or meta-commentary.`;
}

export async function generateEventContent(
  options: EventContentOptions
): Promise<EventContentResult> {
  const { organizationId, outputType, sourceMetadata } = options;

  const model = withSupermemory(
    gateway("anthropic/claude-haiku-4.5"),
    organizationId
  );

  const prompt = buildEventPrompt(options);

  const { text } = await generateText({
    model,
    prompt,
    maxTokens: 2000,
  });

  if (!text || text.trim().length === 0) {
    throw new Error("AI generated empty content");
  }

  // Extract title from content (first line or first heading)
  const lines = text.trim().split("\n");
  let title = lines[0]?.replace(/^#+\s*/, "").trim() ?? "Untitled";
  if (title.length > 100) {
    title = `${title.slice(0, 97)}...`;
  }

  const contentType = outputType === "linkedin_post" ? "linkedin_post" : "post";
  const id = nanoid();
  const content = await marked.parse(text.trim());

  await db.insert(posts).values({
    id,
    organizationId,
    title,
    content,
    markdown: text.trim(),
    contentType,
    sourceMetadata,
  });

  return {
    postId: id,
    title,
  };
}
