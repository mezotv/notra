import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@notra/db/drizzle";
import {
  brandReferences,
  brandSettings,
  onboardingSuggestions,
  skills,
} from "@notra/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";
import { onboardingEvaluationStateSchema } from "../agent/lib/schemas/onboarding-evaluation";
import { readUtf8FileIfExists } from "../agent/lib/utils/file-system";
import { diffTextLines, getTextDiffPrefix } from "../agent/lib/utils/text-diff";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "";
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value))
    : undefined;
}

function string(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const statePath = process.argv[2];
if (!statePath) {
  throw new Error("Pass the evaluation state.json path");
}
const state = onboardingEvaluationStateSchema.parse(
  JSON.parse(await readFile(statePath, "utf8"))
);
const startedAt = new Date(state.startedAt);

const companyPanels: string[] = [];
const companyTabs: string[] = [];
let totalReferences = 0;
let totalBlogReferences = 0;
let totalSkillEdits = 0;
let totalSuggestions = 0;

for (const [companyIndex, baseline] of state.companies.entries()) {
  const settings = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, baseline.organizationId),
      eq(brandSettings.isDefault, true)
    ),
  });
  const currentReferences = settings
    ? await db
        .select()
        .from(brandReferences)
        .where(eq(brandReferences.brandSettingsId, settings.id))
        .orderBy(asc(brandReferences.createdAt))
    : [];
  const baselineReferenceIds = new Set(
    baseline.references.map((reference) => reference.id)
  );
  const addedReferences = currentReferences.filter(
    (reference) => !baselineReferenceIds.has(reference.id)
  );
  const currentSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.organizationId, baseline.organizationId))
    .orderBy(asc(skills.name));
  const baselineSkills = new Map(
    baseline.skills.map((skill) => [skill.name, skill])
  );
  const editedSkills = currentSkills.filter(
    (skill) => baselineSkills.get(skill.name)?.content !== skill.content
  );
  const suggestions = await db
    .select()
    .from(onboardingSuggestions)
    .where(
      and(
        eq(onboardingSuggestions.organizationId, baseline.organizationId),
        gte(onboardingSuggestions.createdAt, startedAt)
      )
    )
    .orderBy(asc(onboardingSuggestions.createdAt));

  const sessionId = state.sessionIds[baseline.domain];
  const streamContents = sessionId
    ? await readUtf8FileIfExists(
        path.join(process.cwd(), "logs", "streams", `${sessionId}.ndjson`)
      )
    : undefined;
  const events = (streamContents ?? "")
    .split("\n")
    .filter(Boolean)
    .map((line) => record(JSON.parse(line)))
    .filter((event) => event !== undefined);
  const requestedActions = events.flatMap((event) => {
    if (event.type !== "actions.requested") {
      return [];
    }
    const data = record(event.data);
    return Array.isArray(data?.actions) ? data.actions : [];
  });
  const memoryCalls = requestedActions.filter(
    (action) => record(action)?.toolName === "save_memory"
  );
  const finalEvent = [...events]
    .reverse()
    .find((event) => event.type === "message.completed");
  const finalMessage =
    string(record(finalEvent?.data)?.message) ?? "No final response captured.";

  totalReferences += addedReferences.length;
  totalBlogReferences += addedReferences.filter(
    (reference) => reference.type === "blog_post"
  ).length;
  totalSkillEdits += editedSkills.length;
  totalSuggestions += suggestions.length;

  const referencesHtml = addedReferences
    .map((reference) => {
      const metadata = record(reference.metadata);
      const sourceUrl = string(metadata?.sourceUrl);
      return `<article class="card reference"><div class="card-head"><span class="badge">${escapeHtml(reference.type)}</span><span>${reference.applicableTo.join(", ")}</span></div><blockquote>${escapeHtml(reference.content)}</blockquote>${reference.note ? `<p>${escapeHtml(reference.note)}</p>` : ""}${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Open source ↗</a>` : ""}</article>`;
    })
    .join("");
  const skillsHtml = editedSkills
    .map((skill) => {
      const before = baselineSkills.get(skill.name)?.content ?? "";
      const diff = diffTextLines(before, skill.content);
      const additions = diff.filter((line) => line.kind === "added").length;
      const removals = diff.filter((line) => line.kind === "removed").length;
      const diffHtml = diff
        .map(
          (line) =>
            `<div class="diff-line ${line.kind}"><span>${line.oldLine ?? ""}</span><span>${line.newLine ?? ""}</span><code>${getTextDiffPrefix(line.kind)} ${escapeHtml(line.value)}</code></div>`
        )
        .join("");
      return `<article class="card"><div class="card-head"><strong>${escapeHtml(skill.name)}</strong><span><span class="diff-add">+${additions}</span> <span class="diff-remove">−${removals}</span></span></div><details open><summary>Line-by-line diff</summary><div class="diff-viewer"><div class="diff-header"><span>Old</span><span>New</span><span>Content</span></div>${diffHtml}</div></details></article>`;
    })
    .join("");
  const memoriesHtml = memoryCalls
    .map(
      (call) =>
        `<article class="card"><pre>${escapeHtml(pretty(record(call)?.input))}</pre></article>`
    )
    .join("");
  const suggestionsHtml = suggestions
    .map(
      (suggestion) =>
        `<article class="card"><div class="card-head"><strong>${escapeHtml(suggestion.title)}</strong><span class="badge">${escapeHtml(suggestion.type)}</span></div><p>${escapeHtml(suggestion.description ?? "")}</p><pre>${escapeHtml(pretty(suggestion.data))}</pre></article>`
    )
    .join("");

  companyTabs.push(
    `<button class="tab${companyIndex === 0 ? " active" : ""}" data-tab="company-${companyIndex}" role="tab">${escapeHtml(baseline.domain)}</button>`
  );
  companyPanels.push(`<section class="panel${companyIndex === 0 ? " active" : ""}" id="company-${companyIndex}" role="tabpanel">
    <div class="hero"><div><span class="eyebrow">${escapeHtml(baseline.organizationName)}</span><h2>${escapeHtml(baseline.domain)}</h2><code>${escapeHtml(sessionId ?? "missing session")}</code></div><div class="mini-grid"><div><strong>${addedReferences.length}</strong><span>references</span></div><div><strong>${editedSkills.length}</strong><span>skills edited</span></div><div><strong>${memoryCalls.length}</strong><span>memories</span></div><div><strong>${suggestions.length}</strong><span>suggestions</span></div></div></div>
    <div class="section"><h3>Agent outcome</h3><div class="card prose">${escapeHtml(finalMessage)}</div></div>
    <div class="section"><h3>References added</h3><div class="cards">${referencesHtml || '<div class="empty">No references added.</div>'}</div></div>
    <div class="section"><h3>Skills edited</h3><div class="cards">${skillsHtml || '<div class="empty">No skills changed.</div>'}</div></div>
    <div class="section"><h3>Memories saved</h3><div class="cards">${memoriesHtml || '<div class="empty">No memory calls captured.</div>'}</div></div>
    <div class="section"><h3>Automation suggestions</h3><div class="cards">${suggestionsHtml || '<div class="empty">No suggestions added.</div>'}</div></div>
    <div class="section"><h3>Brand profile after run</h3><div class="card"><pre>${escapeHtml(pretty(settings ? { companyName: settings.companyName, companyDescription: settings.companyDescription, toneProfile: settings.toneProfile, audience: settings.audience, websiteUrl: settings.websiteUrl } : null))}</pre></div></div>
  </section>`);
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Onboarding agent evaluation</title><style>
:root{color-scheme:dark;--bg:#090b10;--panel:#11151e;--card:#171c27;--line:#293142;--text:#f5f7fb;--muted:#98a2b3;--accent:#9b8cff;--success:#4adead;--danger:#fb7185}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#221d4d,transparent 34rem),var(--bg);color:var(--text);font:14px/1.6 ui-sans-serif,system-ui,sans-serif}main{width:min(1180px,calc(100% - 32px));margin:48px auto 100px}h1{font-size:clamp(34px,6vw,64px);line-height:1;letter-spacing:-.05em;margin:10px 0 18px}h2{font-size:34px;letter-spacing:-.035em;margin:4px 0}h3{font-size:20px;margin:0 0 12px}.eyebrow{color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.summary div,.mini-grid div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}.summary strong,.mini-grid strong{display:block;font-size:28px}.summary span,.mini-grid span{color:var(--muted);font-size:12px}.tabs{display:flex;gap:6px;position:sticky;top:8px;z-index:5;width:max-content;max-width:100%;overflow:auto;background:#090b10dd;border:1px solid var(--line);border-radius:14px;padding:6px;backdrop-filter:blur(14px)}.tab{border:0;background:transparent;color:var(--muted);padding:9px 14px;border-radius:9px;cursor:pointer;white-space:nowrap}.tab.active{background:var(--card);color:var(--text)}.panel{display:none}.panel.active{display:block}.hero{display:flex;justify-content:space-between;align-items:end;gap:20px;padding:34px 0 22px}.mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.mini-grid div{padding:12px;min-width:100px}.section{margin-top:28px}.cards{display:grid;gap:10px}.card,.empty{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:17px}.empty{color:var(--muted)}.card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.badge{background:#28233f;color:#c5bcff;border-radius:999px;padding:3px 8px;font-size:11px}.success,.diff-add{color:var(--success)}.diff-remove{color:var(--danger)}blockquote{margin:12px 0;padding-left:14px;border-left:3px solid var(--accent);font-size:16px;white-space:pre-wrap}a{color:#bdb4ff}.prose{white-space:pre-wrap}details{border-top:1px solid var(--line);margin:12px -17px -17px}summary{cursor:pointer;color:var(--muted);padding:11px 17px}pre{margin:0;max-height:32rem;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#0b0e14;border-radius:10px;padding:14px;color:#cdd5e2;font:12px/1.55 ui-monospace,SFMono-Regular,monospace}.diff-viewer{max-height:38rem;overflow:auto;background:#0b0e14;border-radius:0 0 15px 15px;font:12px/1.55 ui-monospace,SFMono-Regular,monospace}.diff-header,.diff-line{display:grid;grid-template-columns:44px 44px minmax(0,1fr)}.diff-header{position:sticky;top:0;z-index:1;background:#202636;color:var(--muted);border-bottom:1px solid var(--line)}.diff-header span,.diff-line>span{padding:2px 8px;text-align:right;border-right:1px solid var(--line);user-select:none}.diff-header span:last-child{text-align:left}.diff-line code{display:block;padding:2px 10px;white-space:pre-wrap;overflow-wrap:anywhere;color:#cdd5e2}.diff-line.added{background:#0d2a22}.diff-line.added code{color:#a7f3d0}.diff-line.removed{background:#30151c}.diff-line.removed code{color:#fecdd3}.diff-line.unchanged{color:#687386}code{color:var(--muted)}@media(max-width:800px){.summary,.mini-grid{grid-template-columns:repeat(2,1fr)}.hero{display:block}.mini-grid{margin-top:20px}}@media(max-width:500px){.summary{grid-template-columns:1fr 1fr}main{margin-top:24px}}
</style></head><body><main><span class="eyebrow">Evidence-backed run report</span><h1>Onboarding agent<br>evaluation</h1><p>Three organization-scoped runs compared against database snapshots captured immediately before execution.</p><div class="summary"><div><strong>${totalReferences}</strong><span>references added</span></div><div><strong>${totalBlogReferences}</strong><span>blog references</span></div><div><strong>${totalSkillEdits}</strong><span>skills edited</span></div><div><strong>${totalSuggestions}</strong><span>suggestions</span></div></div><nav class="tabs" role="tablist">${companyTabs.join("")}</nav>${companyPanels.join("")}</main><script>const tabs=[...document.querySelectorAll('.tab')];tabs.forEach(tab=>tab.addEventListener('click',()=>{tabs.forEach(item=>item.classList.remove('active'));document.querySelectorAll('.panel').forEach(panel=>panel.classList.remove('active'));tab.classList.add('active');document.getElementById(tab.dataset.tab).classList.add('active')}));</script></body></html>`;

const outputPath = path.join(path.dirname(statePath), "overview.html");
await writeFile(outputPath, html);
console.log(outputPath);
