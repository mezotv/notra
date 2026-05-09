import type { RepoImageSourceContext } from "@/types/repo-image";

export const REPO_IMAGE_OUTPUT_HTML_PATH = "/workspace/home/output.html";

const ALLOWED_FONTS = ["Inter", "Geist"] as const;

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

  return `Design a 1200x630 marketing image for ${owner}/${repo}@${branch} and write it as ONE HTML file.

THE ONLY DELIVERABLE - your task ends ONLY after this file exists:

  ${REPO_IMAGE_OUTPUT_HTML_PATH}

The repo is cloned at /workspace/home/${repo}. Read whatever you need from there. Then Write the HTML to the path above. Don't run any scripts, don't install packages, don't render anything yourself - just write the HTML. The host renders it via Satori on its server.

═════════════════════ STUDY ═════════════════════

1. Tokens: Read /workspace/home/${repo}/app/globals.css OR /workspace/home/${repo}/src/app/globals.css OR /workspace/home/${repo}/styles/globals.css. Pull --background, --foreground, --primary, --accent, --radius. Convert oklch/hsl to hex.
2. Brand assets: \`find /workspace/home/${repo} -maxdepth 5 \\( -iname "*logo*" -o -iname "*brand*" -o -ipath "*branding*" \\) -type f 2>/dev/null | head -10\`. If you find a logo SVG/PNG you want to embed, base64-encode it and inline as an <img src="data:..."> in the HTML.
3. Feature: ${describeSource(source)}
   To find feature files: \`grep -ril "<keyword>" /workspace/home/${repo}/app /workspace/home/${repo}/src --include="*.tsx" --include="*.jsx" --include="*.vue" 2>/dev/null | head -10\`. Open 2 to 4 of the top hits and study layout, headings, primary CTA, surface colors, component structure, spacing, borders, and radius values.
4. Components: If the feature is built in JSX, TSX, Vue, or similar component files, manually translate the real component markup into static HTML. Preserve the actual visual hierarchy, labels, spacing, colors, and surfaces as closely as possible. Convert class-based styles and design tokens into inline styles. Do not invent a generic marketing layout when a real component exists.

═════════════════════ HTML CONTRACT ═════════════════════

RULE #1 - THIS WILL BREAK THE RENDERER IF VIOLATED:
   ANY element (div, body, h1, span, p, etc.) that has MORE THAN ONE child node MUST set display in its inline style. Use display:flex (most common, pair with flex-direction:column or row) or display:contents (passthrough). No exceptions.
   GOOD: <div style="display:flex;flex-direction:column;gap:24px"><h1>A</h1><p>B</p></div>
   BAD: <div style="padding:80px"><h1>A</h1><p>B</p></div>           <- will throw
   BAD: <h1 style="font-size:72px">Line one<br>Line two</h1>            <- <br> creates multiple children and is unreliable in Satori
   BAD: <body style="margin:0"><div>...</div><img /></body>            <- body is also subject to this rule
   A single child is fine without display: <div><h1>Only child</h1></div>

RULE #2 - DESIGN FOR SATORI, NOT CHROME:
   The HTML is rendered by satori-html + Satori, not a browser. Browser preview can look correct while the final PNG is wrong.
   Satori renders and clips exactly 1200x630 and uses content-box sizing: width 580px plus padding 80px means 740px total width.
   Before writing the file, do the layout math: fixed widths + horizontal padding + gaps + borders in each row must be <= 1200, and fixed heights + vertical padding + gaps + borders must be <= 630.
   Avoid flex:1 when siblings have fixed widths or large padding. Prefer explicit column widths that leave at least 48px safe margin around important text/buttons.
   BAD: left panel width 580 + padding 80+60 plus right card 400 + padding 40+70 = 1230px, causing overlap/cropping.
   GOOD: left panel width 500 + padding 72+40 plus right area width 500 + padding 32+24 = 1168px.

- Single HTML document. Root: a <div> sized exactly 1200 x 630.
- Inline styles only (style="..."). No <style> tag, no classes, no Tailwind.
- Semantic tags where they fit: <h1>, <h2>, <p>, <span>, <img>, <div>. Better Figma layer names via html.to.design.
- Satori-safe CSS only: display, flex-direction, justify-content, align-items, width, height, padding, margin, gap, color, background-color, font-size, font-weight, line-height, letter-spacing, font-family, border-radius, border, position, top, left, right, bottom, opacity.
- Avoid CSS shorthand and unsupported properties: use background-color, not background; avoid border-bottom, text-transform, overflow on nested elements, flex:1, transform, filter, box-shadow, animations.
- Do not use <br> for multiline headlines. Make each line its own <span> inside a display:flex;flex-direction:column container.
- Do not use HTML entities in visible text. Write literal characters or words instead. Use { ConsentBanner }, GDPR and CCPA, not entity-escaped braces or GDPR entity-amp CCPA.
- Do not create code snippets from many tiny spans or whitespace-only spans; Satori spacing can collapse. Prefer one span containing the full code string, or use explicit gap/margin between token spans.
- No emojis anywhere in visible text or decorative elements.
- No em dashes in visible text. Use a comma, colon, period, or simple hyphen instead.
- No pill-shaped UI, chips, badges, tags, eyebrow labels, or rounded feature capsules. Do not use border-radius:999px. Avoid rows like "GDPR and CCPA ready", "Type-safe API", "Open source", or other generic marketing pills.
- No unusual display fonts, serif fonts, or code-looking fonts. font-family must be one clean sans font from: ${ALLOWED_FONTS.join(", ")}.
- Use real colors, components, labels, spacing, borders, and modest radii from the repo as closely as possible. Treat JSX, TSX, and Vue files as source UI and manually translate their rendered structure into static HTML with inline styles. NO badges, NO "PR #N" eyebrows, NO "${owner}/${repo}" footers, NO "Built with X" tags, NO decorative dot grids. Make it look like a real screenshot of a panel from THIS app.

═════════════════════ FORMAT ═════════════════════

\`\`\`html
<!doctype html>
<html>
<body style="margin:0;display:flex">
  <div style="width:1200px;height:630px;display:flex;flex-direction:column;background-color:#0b0b0c;color:#fafafa;font-family:Inter;padding:80px">
    <div style="display:flex;flex-direction:column;gap:4px">
      <span style="font-size:84px;font-weight:700;line-height:1.04;letter-spacing:-0.02em;color:#fafafa">Headline matching</span>
      <span style="font-size:84px;font-weight:700;line-height:1.04;letter-spacing:-0.02em;color:#fafafa">this product's tone</span>
    </div>
    <!-- ... -->
  </div>
</body>
</html>
\`\`\`

Use the Write tool to create ${REPO_IMAGE_OUTPUT_HTML_PATH}. After writing, you're done - stop.`;
}
