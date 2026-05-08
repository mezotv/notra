import type { RepoImageSourceContext } from "@/types/repo-image";

export const REPO_IMAGE_OUTPUT_HTML_PATH = "/workspace/home/output.html";

const ALLOWED_FONTS = [
  "Inter",
  "Geist",
  "Instrument Serif",
  "JetBrains Mono",
] as const;

function describeSource(source: RepoImageSourceContext): string {
  if (source.mode === "prompt") {
    return [
      `User prompt: "${source.prompt}"`,
      'If the prompt names a feature/page/route/component (e.g. "chat", "billing", "editor"), find that feature in the repo and copy ITS visual style. Otherwise use the landing page.',
    ].join("\n");
  }
  if (source.mode === "pr") {
    return [
      `PR #${source.prNumber}: "${source.title}"`,
      `Body: "${source.body.slice(0, 240)}"`,
      `Files (top): ${source.topFiles.slice(0, 6).join(", ")}`,
      "Open the changed files. Use those components' visual style.",
    ].join("\n");
  }
  return [
    `Commit ${source.shortSha}: "${source.message.slice(0, 240)}"`,
    `Files (top): ${source.topFiles.slice(0, 6).join(", ")}`,
    "Open the changed files. Use those components' visual style.",
  ].join("\n");
}

export function buildExtractionPrompt(params: {
  owner: string;
  repo: string;
  branch: string;
  source: RepoImageSourceContext;
}) {
  const { owner, repo, branch, source } = params;

  return `Design a 1200×630 marketing image for ${owner}/${repo}@${branch} and write it as ONE HTML file.

THE ONLY DELIVERABLE — your task ends ONLY after this file exists:

  ${REPO_IMAGE_OUTPUT_HTML_PATH}

The repo is cloned at /workspace/home/${repo}. Read whatever you need from there. Then Write the HTML to the path above. Don't run any scripts, don't install packages, don't render anything yourself — just write the HTML. The host renders it via Satori on its server.

═════════════════════ STUDY ═════════════════════

1. Tokens: Read /workspace/home/${repo}/app/globals.css OR /workspace/home/${repo}/src/app/globals.css OR /workspace/home/${repo}/styles/globals.css. Pull --background, --foreground, --primary, --accent, --radius. Convert oklch/hsl to hex.
2. Brand assets: \`find /workspace/home/${repo} -maxdepth 5 \\( -iname "*logo*" -o -iname "*brand*" -o -ipath "*branding*" \\) -type f 2>/dev/null | head -10\`. If you find a logo SVG/PNG you want to embed, base64-encode it and inline as an <img src="data:..."> in the HTML.
3. Feature: ${describeSource(source)}
   To find feature files: \`grep -ril "<keyword>" /workspace/home/${repo}/app /workspace/home/${repo}/src --include="*.tsx" 2>/dev/null | head -10\`. Open 2–4 of the top hits and study layout, headings, primary CTA, surface colors.

═════════════════════ HTML CONTRACT ═════════════════════

🛑 RULE #1 — THIS WILL BREAK THE RENDERER IF VIOLATED:
   ANY element (div, body, h1, span, p, etc.) that has MORE THAN ONE child node MUST set display in its inline style. Use \`display:flex\` (most common — pair with flex-direction:column or row) or \`display:contents\` (passthrough). No exceptions.
   ✅ <div style="display:flex;flex-direction:column;gap:24px"><h1>A</h1><p>B</p></div>
   ❌ <div style="padding:80px"><h1>A</h1><p>B</p></div>           ← will throw
   ❌ <body style="margin:0"><div>...</div><img /></body>            ← body is also subject to this rule
   A single child is fine without display: <div><h1>Only child</h1></div>

- Single HTML document. Root: a <div> sized exactly 1200 × 630.
- Inline styles only (style="..."). No <style> tag, no classes, no Tailwind.
- Semantic tags where they fit: <h1>, <h2>, <p>, <span>, <img>, <div>. (Better Figma layer names via html.to.design.)
- Satori-supported CSS only: width, height, padding, margin, gap, color, background-color, font-size, font-weight, line-height, letter-spacing, font-family, border-radius, border, position (absolute), top/left/right/bottom, opacity. NO transform, NO filter, NO box-shadow, NO animations.
- font-family must be one of: ${ALLOWED_FONTS.join(", ")}.
- Use real colors/fonts/radii from the repo. NO badges, NO "PR #N" eyebrows, NO "${owner}/${repo}" footers, NO "Built with X" tags, NO decorative dot grids. Make it look like a real screenshot of a panel from THIS app.

═════════════════════ FORMAT ═════════════════════

\`\`\`html
<!doctype html>
<html>
<body style="margin:0">
  <div style="width:1200px;height:630px;display:flex;flex-direction:column;background:#0b0b0c;color:#fafafa;font-family:Inter;padding:80px">
    <h1 style="font-size:84px;font-weight:700;line-height:1.04;letter-spacing:-0.02em">
      Headline matching this product's tone
    </h1>
    <!-- ... -->
  </div>
</body>
</html>
\`\`\`

Use the Write tool to create ${REPO_IMAGE_OUTPUT_HTML_PATH}. After writing, you're done — stop.`;
}
