import fs from "node:fs";
import path from "node:path";
import { getConversationalBlogPostPrompt } from "@notra/ai/prompts/blog_post/conversational";
import { getConversationalChangelogPrompt } from "@notra/ai/prompts/changelog/conversational";
import { getConversationalLinkedInPrompt } from "@notra/ai/prompts/linkedin/conversational";
import { getConversationalTwitterPrompt } from "@notra/ai/prompts/twitter/conversational";
import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import matter from "gray-matter";
import { nanoid } from "nanoid";

export interface SystemSkillDefinition {
  name: string;
  description: string;
  content: string;
}

function loadHumanizerContent(): string {
  const candidates = [
    path.join(
      process.cwd(),
      "packages",
      "ai",
      "src",
      "skills",
      "human-writer",
      "SKILL.md"
    ),
    path.join(
      process.cwd(),
      "..",
      "..",
      "packages",
      "ai",
      "src",
      "skills",
      "human-writer",
      "SKILL.md"
    ),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    throw new Error(
      `[skills seed] Humanizer SKILL.md not found. Checked: ${candidates.join(", ")}`
    );
  }

  const raw = fs.readFileSync(found, "utf-8");
  return matter(raw).content.trim();
}

export function buildSystemSkills(): SystemSkillDefinition[] {
  return [
    {
      name: "changelog",
      description:
        "Generate a comprehensive changelog from GitHub commits, pull requests, releases, and Linear issues for a given lookback window. Filters for high-signal changes and formats with Highlights + categorized More Updates.",
      content: getConversationalChangelogPrompt(),
    },
    {
      name: "blog-post",
      description:
        "Write a long-form blog post from GitHub and Linear data. Produces narrative prose with structure and voice, not a bullet-list changelog.",
      content: getConversationalBlogPostPrompt(),
    },
    {
      name: "twitter",
      description:
        "Compose a Twitter/X post from recent development activity. Short-form, attention-grabbing, with the brand's voice.",
      content: getConversationalTwitterPrompt(),
    },
    {
      name: "linkedin",
      description:
        "Compose a LinkedIn post from recent development activity. Professional tone, medium-form, optimized for the LinkedIn feed.",
      content: getConversationalLinkedInPrompt(),
    },
    {
      name: "humanizer",
      description:
        "Remove signs of AI-generated writing from text. Use as a sub-skill from other skills to humanize a near-final draft before publishing.",
      content: loadHumanizerContent(),
    },
  ];
}

export async function seedSystemSkills(organizationId: string): Promise<void> {
  const definitions = buildSystemSkills();

  const rows = definitions.map((def) => ({
    id: nanoid(),
    organizationId,
    name: def.name,
    description: def.description,
    content: def.content,
    isSystem: true,
  }));

  await db
    .insert(skills)
    .values(rows)
    .onConflictDoNothing({
      target: [skills.organizationId, skills.name],
    });
}
