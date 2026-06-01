import matter from "gray-matter";

export interface ParsedSkillFrontmatter {
  name?: string;
  description?: string;
  body: string;
}

const BOM_REGEX = /^\uFEFF/;
const PLAIN_YAML_DELIMITER_REGEX = /^---[ \t]*(?:\r?\n|$)/;

const FRONTMATTER_OPTIONS = {
  language: "yaml",
  engines: {
    javascript: () => {
      throw new Error("JavaScript frontmatter is not supported");
    },
  },
} satisfies matter.GrayMatterOption<string, never>;

export function parseSkillFrontmatter(
  input: string
): ParsedSkillFrontmatter | null {
  const trimmed = input.replace(BOM_REGEX, "").trimStart();
  if (!trimmed.startsWith("---")) {
    return null;
  }
  if (!PLAIN_YAML_DELIMITER_REGEX.test(trimmed)) {
    return null;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(trimmed, FRONTMATTER_OPTIONS);
  } catch {
    return null;
  }

  const data = parsed.data as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : undefined;
  const description =
    typeof data.description === "string"
      ? data.description.replace(/\s+/g, " ").trim()
      : undefined;

  return {
    name,
    description,
    body: parsed.content.trim(),
  };
}
