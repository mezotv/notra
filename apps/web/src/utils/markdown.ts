const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/;

export function markdownResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "accept",
    },
  });
}

export function markdownSection(title: string, lines: string[]) {
  return [`## ${title}`, "", ...lines, ""].join("\n");
}

export function stripFrontmatter(source: string) {
  return source.replace(FRONTMATTER_REGEX, "").trim();
}

export function decodeHtmlEntities(source: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return source
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10))
    )
    .replace(/&#x([\da-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&([a-zA-Z]+);/g, (match, name) => namedEntities[name] ?? match);
}
