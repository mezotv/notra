import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStreamLogDir, getStreamReportDir } from "../constants/stream-log";
import type {
  StreamAction,
  StreamEvent,
  StreamReport,
} from "../types/stream-report";

const TERMINAL_EVENT_TYPES = new Set([
  "session.completed",
  "session.failed",
  "session.waiting",
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pretty(value: unknown): string {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2) ?? "";
}

function collectReport(sessionId: string, events: StreamEvent[]): StreamReport {
  const actions = new Map<string, StreamAction>();
  const reasoning = new Map<string, string>();
  const usage = { cacheReadTokens: 0, inputTokens: 0, outputTokens: 0 };
  let agentName = "unknown agent";
  let modelId = "unknown model";
  let receivedMessage: string | undefined;
  let finalMessage: string | undefined;

  for (const event of events) {
    const data = event.data ?? {};
    if (event.type === "session.started") {
      const runtime = asRecord(data.runtime);
      agentName = asString(runtime?.agentName) ?? agentName;
      modelId = asString(runtime?.modelId) ?? modelId;
    } else if (event.type === "message.received") {
      receivedMessage = asString(data.message) ?? receivedMessage;
    } else if (event.type === "message.completed") {
      finalMessage = asString(data.message) ?? finalMessage;
    } else if (event.type === "reasoning.completed") {
      const key = `${String(data.turnId)}:${String(data.stepIndex)}`;
      reasoning.set(key, asString(data.reasoning) ?? "");
    } else if (event.type === "step.completed") {
      const stepUsage = asRecord(data.usage);
      usage.inputTokens += Number(stepUsage?.inputTokens ?? 0);
      usage.outputTokens += Number(stepUsage?.outputTokens ?? 0);
      usage.cacheReadTokens += Number(stepUsage?.cacheReadTokens ?? 0);
    } else if (event.type === "actions.requested") {
      const requested = Array.isArray(data.actions) ? data.actions : [];
      for (const value of requested) {
        const action = asRecord(value);
        const callId = asString(action?.callId);
        if (!action || !callId) {
          continue;
        }
        actions.set(callId, {
          callId,
          input: action.input,
          kind: asString(action.kind) ?? "action",
          name:
            asString(action.toolName) ??
            asString(action.subagentName) ??
            asString(action.name) ??
            "unknown",
          status: "running",
        });
      }
    } else if (event.type === "action.result") {
      const result = asRecord(data.result);
      const callId = asString(result?.callId);
      if (!callId) {
        continue;
      }
      const existing = actions.get(callId);
      actions.set(callId, {
        callId,
        input: existing?.input,
        kind: asString(result?.kind) ?? existing?.kind ?? "action",
        name:
          asString(result?.toolName) ??
          asString(result?.subagentName) ??
          existing?.name ??
          "unknown",
        output: result?.output,
        status: asString(data.status) ?? "completed",
      });
    }
  }

  return {
    agentName,
    events,
    finalMessage,
    modelId,
    reasoning: [...reasoning.values()].filter(Boolean),
    receivedMessage,
    sessionId,
    toolCalls: [...actions.values()],
    usage,
  };
}

const JSON_DISPLAY_LIMIT = 200_000;
const KILOBYTE = 1024;

function formatSize(chars: number): string {
  if (chars < KILOBYTE) {
    return `${chars} B`;
  }
  if (chars < KILOBYTE * KILOBYTE) {
    return `${(chars / KILOBYTE).toFixed(1)} kB`;
  }
  return `${(chars / (KILOBYTE * KILOBYTE)).toFixed(2)} MB`;
}

function clampText(text: string): string {
  if (text.length <= JSON_DISPLAY_LIMIT) {
    return text;
  }
  return `${text.slice(0, JSON_DISPLAY_LIMIT)}\n\n[truncated: showing first ${formatSize(JSON_DISPLAY_LIMIT)} of ${formatSize(text.length)}]`;
}

function normalizeStatus(status: string): "completed" | "failed" | "running" {
  if (status === "completed" || status === "failed") {
    return status;
  }
  return "running";
}

function renderPayloadBlock(label: string, value: unknown): string {
  const text = pretty(value);
  const sizeLabel =
    text.length > JSON_DISPLAY_LIMIT
      ? `${formatSize(text.length)} · truncated`
      : formatSize(text.length);
  return `<details class="block"><summary><span class="block-label">${escapeHtml(label)}</span><span class="size">${sizeLabel}</span></summary><div class="block-body"><button class="copy" type="button" aria-label="Copy ${escapeHtml(label)}">Copy</button><pre tabindex="0">${escapeHtml(clampText(text))}</pre></div></details>`;
}

function renderToolCard(call: StreamAction, index: number): string {
  const statusClass = normalizeStatus(call.status);
  return `<article class="tool-card">
    <header><span class="index" aria-hidden="true">${index + 1}</span><div class="tool-title"><strong>${escapeHtml(call.name)}</strong><small>${escapeHtml(call.kind)}</small></div><span class="badge ${statusClass}"><span class="dot" aria-hidden="true"></span>${escapeHtml(call.status)}</span></header>
    ${renderPayloadBlock("Input", call.input)}
    ${call.output === undefined ? "" : renderPayloadBlock("Result", call.output)}
    <footer>${escapeHtml(call.callId)}</footer>
  </article>`;
}

function renderTab(id: string, label: string, count: number): string {
  return `<button aria-controls="panel-${id}" aria-selected="false" id="tab-${id}" role="tab" tabindex="-1" type="button">${label}<span class="tab-count">${count}</span></button>`;
}

const REPORT_STYLES = `
:root{color-scheme:light dark;--bg:#f5f6f8;--panel:#ffffff;--soft:#eef0f4;--line:#e2e5eb;--text:#191c22;--muted:#5e6675;--accent:#6d5ce6;--good:#0f9d6e;--bad:#cf3f58;--warn:#9a6a14;--code-bg:#f8f9fb;--code-text:#333a47}
@media(prefers-color-scheme:dark){:root{--bg:#0c0e13;--panel:#12151c;--soft:#1a1e28;--line:#272c38;--text:#eceef2;--muted:#8d95a5;--accent:#8b7cff;--good:#3ecf9a;--bad:#ff7288;--warn:#e0a94e;--code-bg:#0a0c11;--code-text:#c6cddb}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:0.875rem/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
main{width:min(72rem,100% - 2rem);margin-inline:auto;padding-block:2.5rem 6rem}
.eyebrow{margin:0;color:var(--muted);font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase}
h1{margin:0.375rem 0 1rem;font-size:clamp(1.75rem,4vw,2.75rem);letter-spacing:-0.03em;overflow-wrap:anywhere}
h2{margin:0 0 0.75rem;font-size:1rem}
.meta{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.75rem}
.pill{display:inline-flex;align-items:center;gap:0.375rem;border:1px solid var(--line);border-radius:999px;padding:0.25rem 0.75rem;background:var(--panel);color:var(--muted);font:0.75rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
.dot{width:0.5rem;height:0.5rem;border-radius:50%;background:currentColor;flex:none}
.pill.done,.badge.completed{color:var(--good)}
.pill.live,.badge.running{color:var(--warn)}
.badge.failed{color:var(--bad)}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem}
.metric{background:var(--panel);border:1px solid var(--line);border-radius:0.75rem;padding:1rem}
.metric small{color:var(--muted);font-size:0.75rem}
.metric strong{display:block;margin-top:0.25rem;font-size:1.5rem;letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
.metric .sub{display:block;margin-top:0.25rem;color:var(--muted);font-size:0.6875rem;font-variant-numeric:tabular-nums}
.tabs{position:sticky;top:0.5rem;z-index:3;display:flex;gap:0.25rem;margin:2rem 0 1rem;padding:0.25rem;max-width:100%;width:max-content;overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:0.75rem}
[role=tab]{display:inline-flex;align-items:center;gap:0.5rem;border:0;background:transparent;padding:0.5rem 0.875rem;border-radius:0.5rem;color:var(--muted);font:inherit;cursor:pointer;white-space:nowrap}
[role=tab][aria-selected=true]{background:var(--soft);color:var(--text)}
.tab-count{border:1px solid var(--line);border-radius:999px;padding:0 0.5rem;font-size:0.6875rem;font-variant-numeric:tabular-nums}
[role=tab]:focus-visible,summary:focus-visible,.copy:focus-visible,pre:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:0.75rem;padding:1.25rem 1.5rem;margin-bottom:0.875rem}
.panel.prompt{border-left:3px solid var(--accent)}
.panel.answer{border-left:3px solid var(--good)}
.message{white-space:pre-wrap;overflow-wrap:anywhere}
.empty{color:var(--muted)}
.tool-card,.item{background:var(--panel);border:1px solid var(--line);border-radius:0.75rem;margin-bottom:0.75rem;overflow:hidden}
.tool-card>header{display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;flex-wrap:wrap}
.index{display:grid;place-items:center;min-width:1.75rem;height:1.75rem;border-radius:0.5rem;background:var(--soft);color:var(--muted);font-size:0.75rem;font-variant-numeric:tabular-nums;flex:none}
.tool-title{display:flex;flex-direction:column;min-width:0}
.tool-title strong{overflow-wrap:anywhere}
.tool-title small{color:var(--muted);font-size:0.75rem}
.badge{display:inline-flex;align-items:center;gap:0.375rem;margin-left:auto;border:1px solid var(--line);border-radius:999px;padding:0.125rem 0.625rem;font-size:0.75rem}
.block{border-top:1px solid var(--line)}
.block summary,.item summary{display:flex;align-items:center;gap:0.75rem;padding:0.625rem 1rem;cursor:pointer;color:var(--muted);font-size:0.8125rem}
.block summary:hover,.item summary:hover{color:var(--text)}
.size{margin-left:auto;font-size:0.6875rem;font-variant-numeric:tabular-nums;white-space:nowrap}
.type{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
.block-body{position:relative}
.copy{position:absolute;top:0.5rem;right:0.75rem;border:1px solid var(--line);background:var(--panel);color:var(--muted);border-radius:0.375rem;padding:0.25rem 0.625rem;font:inherit;font-size:0.6875rem;cursor:pointer}
.copy:hover{color:var(--text)}
pre{margin:0;padding:1rem;max-height:26rem;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--code-bg);color:var(--code-text);font:0.75rem/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;border-top:1px solid var(--line)}
.tool-card>footer{padding:0.5rem 1rem;border-top:1px solid var(--line);color:var(--muted);font:0.6875rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
@media(max-width:48rem){main{padding-block:1.5rem 4rem}.metrics{grid-template-columns:repeat(2,1fr)}.tabs{width:100%}}
@media(prefers-reduced-motion:no-preference){[role=tab],.copy{transition:background-color 120ms ease,color 120ms ease}}
`;

const REPORT_SCRIPT = `
const tabs=Array.from(document.querySelectorAll('[role="tab"]'));
const panels=tabs.map(function(tab){return document.getElementById(tab.getAttribute('aria-controls'))});
function selectTab(next,focus){tabs.forEach(function(tab,i){const active=i===next;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(panels[i]){panels[i].hidden=!active}});if(focus){tabs[next].focus()}}
tabs.forEach(function(tab,i){tab.addEventListener('click',function(){selectTab(i,false)});tab.addEventListener('keydown',function(event){let next=null;if(event.key==='ArrowRight'){next=(i+1)%tabs.length}else if(event.key==='ArrowLeft'){next=(i-1+tabs.length)%tabs.length}else if(event.key==='Home'){next=0}else if(event.key==='End'){next=tabs.length-1}if(next!==null){event.preventDefault();selectTab(next,true)}})});
selectTab(0,false);
document.querySelectorAll('.copy').forEach(function(button){button.addEventListener('click',function(){const pre=button.parentElement.querySelector('pre');if(!pre){return}navigator.clipboard.writeText(pre.textContent).then(function(){button.textContent='Copied';setTimeout(function(){button.textContent='Copy'},1500)})})});
`;

function renderReport(report: StreamReport): string {
  const finished = report.events.some((event) =>
    TERMINAL_EVENT_TYPES.has(event.type)
  );
  const failedCalls = report.toolCalls.filter(
    (call) => call.status === "failed"
  ).length;
  const totalTokens = report.usage.inputTokens + report.usage.outputTokens;
  const toolCards = report.toolCalls.map(renderToolCard).join("");
  const reasoningItems = report.reasoning
    .map(
      (value, index) =>
        `<details class="item"><summary><span class="index" aria-hidden="true">${index + 1}</span><span>Reasoning step ${index + 1}</span><span class="size">${formatSize(value.length)}</span></summary><pre tabindex="0">${escapeHtml(clampText(value))}</pre></details>`
    )
    .join("");
  const rawEvents = report.events
    .map((event, index) => {
      const text = pretty(event.data);
      return `<details class="item"><summary><span class="index" aria-hidden="true">${index + 1}</span><span class="type">${escapeHtml(event.type)}</span><span class="size">${formatSize(text.length)}</span></summary><div class="block-body"><button class="copy" type="button" aria-label="Copy event ${index + 1}">Copy</button><pre tabindex="0">${escapeHtml(clampText(text))}</pre></div></details>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.agentName)} · ${escapeHtml(report.sessionId)}</title><style>${REPORT_STYLES}</style></head><body><main>
<header><p class="eyebrow">Onboarding agent trace</p><h1>${escapeHtml(report.agentName)}</h1><div class="meta"><span class="pill">${escapeHtml(report.sessionId)}</span><span class="pill">${escapeHtml(report.modelId)}</span><span class="pill ${finished ? "done" : "live"}"><span class="dot" aria-hidden="true"></span>${finished ? "Finished" : "In progress"}</span></div></header>
<div class="metrics"><div class="metric"><small>Events</small><strong>${report.events.length.toLocaleString()}</strong></div><div class="metric"><small>Tool calls</small><strong>${report.toolCalls.length.toLocaleString()}</strong></div><div class="metric"><small>Failed calls</small><strong>${failedCalls.toLocaleString()}</strong></div><div class="metric"><small>Tokens</small><strong>${totalTokens.toLocaleString()}</strong><span class="sub">in ${report.usage.inputTokens.toLocaleString()} · out ${report.usage.outputTokens.toLocaleString()} · cache ${report.usage.cacheReadTokens.toLocaleString()}</span></div></div>
<nav aria-label="Report sections" class="tabs" role="tablist">${renderTab("conversation", "Conversation", 2)}${renderTab("tools", "Tools", report.toolCalls.length)}${renderTab("reasoning", "Reasoning", report.reasoning.length)}${renderTab("raw", "Raw", report.events.length)}</nav>
<section aria-labelledby="tab-conversation" id="panel-conversation" role="tabpanel"><article class="panel prompt"><h2>Request</h2><div class="message">${escapeHtml(report.receivedMessage ?? "No request captured")}</div></article><article class="panel answer"><h2>Final response</h2><div class="message">${escapeHtml(report.finalMessage ?? "No final response captured")}</div></article></section>
<section aria-labelledby="tab-tools" hidden id="panel-tools" role="tabpanel">${toolCards || '<div class="panel empty">No tool calls captured.</div>'}</section>
<section aria-labelledby="tab-reasoning" hidden id="panel-reasoning" role="tabpanel">${reasoningItems || '<div class="panel empty">No completed reasoning captured.</div>'}</section>
<section aria-labelledby="tab-raw" hidden id="panel-raw" role="tabpanel">${rawEvents || '<div class="panel empty">No events captured.</div>'}</section>
</main><script>${REPORT_SCRIPT}</script></body></html>`;
}

export function isTerminalStreamEvent(event: unknown): boolean {
  const type = asString(asRecord(event)?.type);
  return type ? TERMINAL_EVENT_TYPES.has(type) : false;
}

export async function writeStreamReport(sessionId: string): Promise<string> {
  const logPath = path.join(getStreamLogDir(), `${sessionId}.ndjson`);
  const contents = await readFile(logPath, "utf8");
  const events = contents
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StreamEvent);
  const report = collectReport(sessionId, events);
  const streamReportDir = getStreamReportDir();
  await mkdir(streamReportDir, { recursive: true });
  const reportPath = path.join(streamReportDir, `${sessionId}.html`);
  await writeFile(reportPath, renderReport(report));
  return reportPath;
}
