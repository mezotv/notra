export interface ParsedSkillFrontmatter {
  name?: string;
  description?: string;
  body: string;
}

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
const BOM_REGEX = /^\uFEFF/;

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseSkillFrontmatter(
  input: string
): ParsedSkillFrontmatter | null {
  const trimmed = input.replace(BOM_REGEX, "").trimStart();
  if (!trimmed.startsWith("---")) {
    return null;
  }

  const match = trimmed.match(FRONTMATTER_REGEX);
  if (!match) {
    return null;
  }

  const [, block = "", body = ""] = match;
  const fields: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      continue;
    }
    const key = line.slice(0, colonIdx).trim();
    const value = stripQuotes(line.slice(colonIdx + 1).trim());
    if (key) {
      fields[key] = value;
    }
  }

  return {
    name: fields.name,
    description: fields.description,
    body: body.trim(),
  };
}
