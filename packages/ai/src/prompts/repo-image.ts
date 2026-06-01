import {
  ALLOWED_FONTS,
  REPO_IMAGE_OUTPUT_HTML_PATH,
} from "@notra/ai/constants/repo-image";
import type { RepoImageSourceContext } from "@notra/ai/types/repo-image";

function describeSource(source: RepoImageSourceContext): string {
  if (source.mode === "prompt") {
    return [
      "<source-type>prompt</source-type>",
      `<user-prompt>${source.prompt}</user-prompt>`,
      `<guidance>If the prompt names a feature, page, route, or component (e.g. "chat", "billing", "editor"), find that feature in the repo and copy its visual style. Otherwise use the landing page.</guidance>`,
    ].join("\n");
  }
  if (source.mode === "pr") {
    return [
      "<source-type>pull-request</source-type>",
      `<pr-number>${source.prNumber}</pr-number>`,
      `<pr-title>${source.title}</pr-title>`,
      `<pr-body>${source.body.slice(0, 240)}</pr-body>`,
      `<top-files>${source.topFiles.slice(0, 6).join(", ")}</top-files>`,
      `<guidance>Open the changed files. Use those components' visual style.</guidance>`,
    ].join("\n");
  }
  return [
    "<source-type>commit</source-type>",
    `<commit-sha>${source.shortSha}</commit-sha>`,
    `<commit-message>${source.message.slice(0, 240)}</commit-message>`,
    `<top-files>${source.topFiles.slice(0, 6).join(", ")}</top-files>`,
    `<guidance>Open the changed files. Use those components' visual style.</guidance>`,
  ].join("\n");
}

export function buildExtractionPrompt(params: {
  owner: string;
  repo: string;
  branch: string;
  source: RepoImageSourceContext;
}) {
  const { owner, repo, branch, source } = params;

  return `<role>
You are a senior brand designer translating real product UI into a single, polished 1200x630 marketing image. You design from the repo's actual components and tokens, not from memory or generic SaaS templates. The output must look like a real screenshot of a panel from this app.
</role>

<task-context>
The repository ${owner}/${repo}@${branch} is cloned at /workspace/home/${repo}. Read whatever you need from there, then write a single static HTML file that the satori-html + Satori pipeline can render to a PNG. Quality is judged at Fortune 500 social-media standards.
</task-context>

<deliverable>
Your task ends ONLY after this exact file exists:

  ${REPO_IMAGE_OUTPUT_HTML_PATH}

Use the Write tool to create it. After the file exists, stop. No other output is needed.
</deliverable>

<subject>
${describeSource(source)}
</subject>

<research>
Gather source material before designing. Skipping this step produces generic output.

1. Component discovery: Spawn a subagent to find the real routes, components, and design-system files that match the subject. Ask it for design tokens, brand assets, screenshots or examples if present, and the exact file paths it used. Do not design from memory while the subagent runs. After it returns, personally inspect the most relevant files before writing HTML.

2. Design tokens: Read /workspace/home/${repo}/app/globals.css OR /workspace/home/${repo}/src/app/globals.css OR /workspace/home/${repo}/styles/globals.css. Pull the full theme palette: --background, --foreground, --primary, --secondary, --muted, --accent, --border, --card, --popover, destructive/success colors if present, and --radius. Convert oklch/hsl to hex and match these globals.css colors exactly. Do not approximate or invent nearby colors.

3. Brand assets: Run \`find /workspace/home/${repo} -maxdepth 5 \\( -iname "*logo*" -o -iname "*brand*" -o -ipath "*branding*" \\) -type f 2>/dev/null | head -10\`. If a logo SVG/PNG fits the design, base64-encode it and inline it as <img src="data:..."> in the HTML.

4. Feature files: Run \`grep -ril "<keyword>" /workspace/home/${repo}/app /workspace/home/${repo}/src --include="*.tsx" --include="*.jsx" --include="*.vue" 2>/dev/null | head -10\`. Open 2 to 4 of the top hits and study layout, headings, primary CTA, surface colors, component structure, spacing, borders, and radius values.

5. Component translation: When the feature is built in JSX, TSX, or Vue, manually translate the real component markup into static HTML. Match components as they are actually composed in the app, not their isolated primitive definitions. Inspect the route or parent that uses them, then preserve the real visual hierarchy, labels, spacing, colors, surfaces, button variants, input/table/card states, and radius values as closely as possible. Convert class-based styles and design tokens into inline styles. You may scale components up to make the 1200x630 image stronger, but scaling must preserve proportions and spacing. Do not invent a generic marketing layout when a real component exists.
</research>

<html-contract>
The HTML is rendered by satori-html + Satori, not a browser. Browser previews can look correct while the final PNG is wrong. These rules are the renderer's actual constraints, not stylistic preferences.

<rule priority="critical" name="multi-child-display">
Any element (div, body, h1, span, p, etc.) with MORE THAN ONE child node MUST set display in its inline style. Use display:flex (most common; pair with flex-direction:column or row) or display:contents (passthrough). Violating this rule throws at render time.

<example type="good">
<div style="display:flex;flex-direction:column;gap:24px"><h1>A</h1><p>B</p></div>
</example>

<example type="bad" reason="multiple children, no display">
<div style="padding:80px"><h1>A</h1><p>B</p></div>
</example>

<example type="bad" reason="br creates multiple children and is unreliable in Satori">
<h1 style="font-size:72px">Line one<br>Line two</h1>
</example>

<example type="bad" reason="body is also subject to this rule">
<body style="margin:0"><div>...</div><img /></body>
</example>

<example type="good" reason="single child is fine without display">
<div><h1>Only child</h1></div>
</example>
</rule>

<rule priority="critical" name="layout-math">
Satori renders and clips exactly 1200x630 and uses content-box sizing: width 580px plus padding 80px equals 740px total width. Before writing the file, do the math: fixed widths + horizontal padding + gaps + borders in each row must be <= 1200, and fixed heights + vertical padding + gaps + borders must be <= 630. Avoid flex:1 when siblings have fixed widths or large padding. Prefer explicit column widths that leave at least 48px safe margin around important text and buttons.

<example type="bad" reason="overlap, 1230 total">
left panel width 580 + padding 80+60 + right card 400 + padding 40+70 = 1230px
</example>

<example type="good" reason="1168 total, safe margin preserved">
left panel width 500 + padding 72+40 + right area width 500 + padding 32+24 = 1168px
</example>
</rule>

<rule name="document-structure">
- Single HTML document. Root: a <div> sized exactly 1200 x 630.
- Inline styles only (style="..."). No <style> tag, no classes, no Tailwind.
- Use semantic tags where they fit: <h1>, <h2>, <p>, <span>, <img>, <div>. They produce better Figma layer names via html.to.design.
- Replace multiline headlines built with <br> by stacking each line as its own <span> inside a display:flex;flex-direction:column container.
- Write literal characters in visible text. Use { ConsentBanner }, GDPR and CCPA, not entity-escaped braces or amp-encoded text.
</rule>

<rule priority="critical" name="svg-text-nodes">
The downstream image pipeline can fail with: "Error: <text> nodes are not currently supported, please convert them to <path>". Avoid authoring raw SVG that contains <text> elements. If an inline SVG is necessary, convert all text to path data first, or represent the label with normal HTML text outside the SVG.
</rule>

<rule name="satori-css">
Use only these properties: display, flex-direction, justify-content, align-items, width, height, padding, margin, gap, color, background-color, font-size, font-weight, line-height, letter-spacing, font-family, border-radius, border, position, top, left, right, bottom, opacity.

Use background-color (not the background shorthand). Avoid border-bottom, text-transform, overflow on nested elements, flex:1, transform, filter, box-shadow, animations.
</rule>

<rule name="typography">
- font-family must be one clean sans font from: ${ALLOWED_FONTS.join(", ")}. No display fonts, serif fonts, or code-looking fonts.
- For code snippets, prefer one span containing the full code string. If you must split tokens across spans, use explicit gap or margin between them. Many tiny or whitespace-only spans collapse unpredictably in Satori.
</rule>

<rule name="visible-content">
- No emojis anywhere in visible text or decorative elements.
- No em dashes. Use a comma, colon, period, or simple hyphen.
- No pill UI, chips, badges, tags, eyebrow labels, or rounded feature capsules. Do not use border-radius:999px. Avoid generic marketing rows like "GDPR and CCPA ready", "Type-safe API", or "Open source".
- No "PR #N" eyebrows, no "${owner}/${repo}" footers, no "Built with X" tags, no decorative dot grids.
- Use the exact globals.css color system and real components, labels, spacing, borders, and modest radii from the repo. The image should read like a real screenshot of this app, not a launch poster.
</rule>
</html-contract>

<quality-loop>
Before writing the final file, create a draft HTML somewhere temporary and preview or render it if the environment supports it. Be nitpicky at Fortune 500 standards.

Check for:
- Cropping, overflow, accidental clipping, and edge collisions.
- Misalignment by even a few pixels: uneven gutters, off-center groups, mismatched baselines, inconsistent card edges, awkward icon/text spacing.
- Text problems: widows, bad wrapping, cramped line-height, weak hierarchy, illegible contrast, generic copy, or copy that does not match the source product's voice.
- Visual fidelity: wrong globals.css colors, radius, border weight, spacing scale, font weight, button style, surface treatment, or component structure compared to how the repo uses these in the real app.
- Polish: empty-looking areas, clutter, visual imbalance, low-quality decorative elements, fake badges, generic SaaS tropes, anything that would look cheap in a launch post.

If any issue is present, fix the draft and re-check. Repeat until you would ship this as a polished social image for a Fortune 500 brand. Only then write the reviewed HTML to ${REPO_IMAGE_OUTPUT_HTML_PATH}.
</quality-loop>

<output-format>
The HTML follows this shape (this is structure only; replace the content with material from the repo):

\`\`\`html
<!doctype html>
<html>
<body style="margin:0;display:flex">
  <div style="width:1200px;height:630px;display:flex;flex-direction:column;background-color:#0b0b0c;color:#fafafa;font-family:Inter;padding:80px">
    <div style="display:flex;flex-direction:column;gap:4px">
      <span style="font-size:84px;font-weight:700;line-height:1.04;letter-spacing:-0.02em;color:#fafafa">Headline matching</span>
      <span style="font-size:84px;font-weight:700;line-height:1.04;letter-spacing:-0.02em;color:#fafafa">this product's tone</span>
    </div>
  </div>
</body>
</html>
\`\`\`
</output-format>

<the-ask>
1. Run the research steps to gather tokens, brand assets, and the real component to translate.
2. Design the 1200x630 image as inline-styled HTML following every rule in <html-contract>.
3. Run the <quality-loop> on a draft until it would pass at Fortune 500 standards.
4. Use the Write tool to create ${REPO_IMAGE_OUTPUT_HTML_PATH} with the final HTML. Stop after the file exists.
</the-ask>

<thinking-instructions>
Before writing HTML, decide which real component or page in this repo best matches the subject and which globals.css tokens you will use. Plan the layout math (widths + padding + gaps for each row and column) so you know the design will fit 1200x630 with safe margins. Only then draft the HTML and run the quality loop.
</thinking-instructions>`;
}

export function buildRevisionPrompt(params: { prompt: string }) {
  return `<role>
You are a senior brand designer editing an existing generated social image. You are working inside a restored sandbox snapshot that already contains the repository context and the current HTML deliverable.
</role>

<task>
Apply this user-requested change to the existing image:

${params.prompt}
</task>

<deliverable>
Your task ends ONLY after this exact file exists and contains the revised final image HTML:

  ${REPO_IMAGE_OUTPUT_HTML_PATH}

You MUST edit the file on disk. Use the Read tool or shell command to read ${REPO_IMAGE_OUTPUT_HTML_PATH}, then use the Edit tool, Write tool, or shell redirection to write the revised HTML back to ${REPO_IMAGE_OUTPUT_HTML_PATH}. Do not merely describe the edit. Do not ask the user to upload the image again. Do not create a new unrelated design unless this file is missing.
</deliverable>

<required-steps>
1. Read ${REPO_IMAGE_OUTPUT_HTML_PATH}.
2. Locate the exact HTML text, element, inline SVG, or asset markup related to the user request.
3. Modify that file in place.
4. Verify with a shell command that ${REPO_IMAGE_OUTPUT_HTML_PATH} exists after your edit.
5. Stop.
</required-steps>

<constraints>
- Preserve the existing image's layout, style, brand tokens, dimensions, and overall composition.
- Make the smallest visual change that satisfies the user request.
- Keep the root output exactly 1200 x 630.
- Inline styles only. No classes, no Tailwind, no <style> tag.
- Any element with more than one child node must set display:flex or display:contents.
- Avoid raw SVG <text> nodes.
- No emojis and no em dashes in visible text.
</constraints>

<quality-loop>
After editing, inspect the final HTML for broken layout, clipping, missing text, and accidental changes outside the requested edit. If the requested text appears in the existing design, replace it exactly. If the text is rendered through an image or SVG asset, recreate that part with normal HTML text or an SVG path-safe alternative so the requested wording is visible.
</quality-loop>`;
}
