"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";

type GatewayChoice = "" | "vercel" | "openrouter";

interface LabForm {
  modelId: string;
  prompt: string;
  organizationId: string;
  plan: "free" | "paid";
  gateway: GatewayChoice;
  mode: "off" | "canary" | "on";
  forceGateway: GatewayChoice;
  defaultGateway: "vercel" | "openrouter";
  paidGateway: "vercel" | "openrouter";
  freeGateway: "vercel" | "openrouter";
  allowNonZdr: boolean;
  crossGatewayFallback: boolean;
  disableVercel: boolean;
  disableOpenRouter: boolean;
  checkCredits: boolean;
  scenario: "text" | "stream" | "tools" | "structured";
}

interface LabResponse {
  ok: boolean;
  durationMs: number;
  firstTokenMs?: number;
  decision?: Record<string, unknown>;
  text?: string;
  output?: unknown;
  toolCalls?: string[];
  steps?: Array<{ route?: Record<string, unknown>; usage?: unknown }>;
  requestBody?: unknown;
  logs: Array<{
    level: "info" | "warn" | "error";
    event: string;
    fields?: Record<string, unknown>;
  }>;
  error?: {
    name: string;
    message: string;
    code?: string;
    statusCode?: number;
    gateway?: string;
  };
}

const DEFAULT_FORM: LabForm = {
  modelId: "deepseek/deepseek-v4-flash",
  prompt: "Reply with the single word: pong",
  organizationId: "org_lab",
  plan: "free",
  gateway: "",
  mode: "on",
  forceGateway: "",
  defaultGateway: "openrouter",
  paidGateway: "vercel",
  freeGateway: "openrouter",
  allowNonZdr: true,
  crossGatewayFallback: true,
  disableVercel: false,
  disableOpenRouter: false,
  checkCredits: true,
  scenario: "text",
};

const PRESETS: Array<{ label: string; patch: Partial<LabForm> }> = [
  { label: "Free org → OpenRouter", patch: { plan: "free", gateway: "" } },
  { label: "Paid org → Vercel", patch: { plan: "paid", gateway: "" } },
  { label: "No org → default", patch: { organizationId: "" } },
  { label: "Pin Vercel", patch: { gateway: "vercel" } },
  { label: "Force OpenRouter", patch: { forceGateway: "openrouter" } },
  { label: "Mode off (legacy)", patch: { mode: "off" } },
  {
    label: "OpenRouter key missing → fallback",
    patch: { plan: "free", disableOpenRouter: true },
  },
  {
    label: "Vercel key missing → fallback",
    patch: { plan: "paid", disableVercel: true },
  },
  { label: "ZDR strict (prod)", patch: { allowNonZdr: false } },
  { label: "No fallback", patch: { crossGatewayFallback: false } },
  { label: "Unsupported model", patch: { modelId: "vercel/nope/model-x" } },
  {
    label: "Streaming",
    patch: { scenario: "stream", prompt: "Count from 1 to 15, one per line." },
  },
  {
    label: "Tools",
    patch: {
      scenario: "tools",
      prompt: "What is 21 * 2? Use the multiply tool, then answer briefly.",
    },
  },
  {
    label: "Structured",
    patch: {
      scenario: "structured",
      prompt: "What is the capital of France? Give an answer and a confidence.",
    },
  },
];

const LEVEL_VARIANT: Record<
  LabResponse["logs"][number]["level"],
  "secondary" | "outline" | "destructive"
> = {
  info: "secondary",
  warn: "outline",
  error: "destructive",
};

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function GatewaySelect({
  id,
  label,
  value,
  onChange,
  allowEmpty,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {allowEmpty ? <option value="">(none)</option> : null}
        <option value="vercel">vercel</option>
        <option value="openrouter">openrouter</option>
      </select>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm" htmlFor={id}>
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

export default function RouterLabClient() {
  const [form, setForm] = useState<LabForm>(DEFAULT_FORM);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<LabResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{ label: string; response: LabResponse }>
  >([]);

  const update = <K extends keyof LabForm>(key: K, value: LabForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const run = async (override?: Partial<LabForm>, label = "custom") => {
    const payload = { ...form, ...override };
    if (override) {
      setForm(payload);
    }
    setRunning(true);
    try {
      const result = await fetch("/api/router-lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          organizationId: payload.organizationId || undefined,
          gateway: payload.gateway || undefined,
          forceGateway: payload.forceGateway || undefined,
        }),
      });
      const json = (await result.json()) as LabResponse;
      setResponse(json);
      setHistory((current) =>
        [{ label, response: json }, ...current].slice(0, 20)
      );
    } catch (error) {
      setResponse({
        ok: false,
        durationMs: 0,
        logs: [],
        error: {
          name: "FetchError",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      setRunning(false);
    }
  };

  const route = response?.steps?.at(-1)?.route;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Model Router Lab</h1>
        <p className="text-muted-foreground text-sm">
          Runs real requests through the router with the keys from your{" "}
          <code>.env</code>. Plan lookup is faked (no Autumn call). Dev only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
          <CardDescription>
            Each preset patches the form below and runs immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              disabled={running}
              key={preset.label}
              onClick={() => run(preset.patch, preset.label)}
              size="sm"
              variant="outline"
            >
              {preset.label}
            </Button>
          ))}
          <Button
            disabled={running}
            onClick={() => {
              setForm(DEFAULT_FORM);
              setResponse(null);
            }}
            size="sm"
            variant="ghost"
          >
            Reset form
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scenario</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="modelId">Model</Label>
                <Input
                  id="modelId"
                  onChange={(event) => update("modelId", event.target.value)}
                  value={form.modelId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="organizationId">Organization id</Label>
                <Input
                  id="organizationId"
                  onChange={(event) =>
                    update("organizationId", event.target.value)
                  }
                  placeholder="(empty = background job)"
                  value={form.organizationId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="plan">Plan (fake resolver)</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  id="plan"
                  onChange={(event) =>
                    update("plan", event.target.value as LabForm["plan"])
                  }
                  value={form.plan}
                >
                  <option value="free">free</option>
                  <option value="paid">paid</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="scenario">Call type</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  id="scenario"
                  onChange={(event) =>
                    update(
                      "scenario",
                      event.target.value as LabForm["scenario"]
                    )
                  }
                  value={form.scenario}
                >
                  <option value="text">generateText</option>
                  <option value="stream">streamText</option>
                  <option value="tools">tool calling</option>
                  <option value="structured">structured output</option>
                </select>
              </div>
              <GatewaySelect
                allowEmpty
                id="gateway"
                label="Pin gateway"
                onChange={(value) => update("gateway", value as GatewayChoice)}
                value={form.gateway}
              />
              <GatewaySelect
                allowEmpty
                id="forceGateway"
                label="Force gateway (ops)"
                onChange={(value) =>
                  update("forceGateway", value as GatewayChoice)
                }
                value={form.forceGateway}
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="mode">Mode</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  id="mode"
                  onChange={(event) =>
                    update("mode", event.target.value as LabForm["mode"])
                  }
                  value={form.mode}
                >
                  <option value="off">off</option>
                  <option value="canary">canary</option>
                  <option value="on">on</option>
                </select>
              </div>
              <GatewaySelect
                id="defaultGateway"
                label="Default (no org)"
                onChange={(value) =>
                  update("defaultGateway", value as "vercel" | "openrouter")
                }
                value={form.defaultGateway}
              />
              <GatewaySelect
                id="paidGateway"
                label="Paid gateway"
                onChange={(value) =>
                  update("paidGateway", value as "vercel" | "openrouter")
                }
                value={form.paidGateway}
              />
              <GatewaySelect
                id="freeGateway"
                label="Free gateway"
                onChange={(value) =>
                  update("freeGateway", value as "vercel" | "openrouter")
                }
                value={form.freeGateway}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                checked={form.allowNonZdr}
                id="allowNonZdr"
                label="allowNonZdr (dev bypass)"
                onChange={(value) => update("allowNonZdr", value)}
              />
              <Toggle
                checked={form.crossGatewayFallback}
                id="crossGatewayFallback"
                label="cross-gateway fallback"
                onChange={(value) => update("crossGatewayFallback", value)}
              />
              <Toggle
                checked={form.disableVercel}
                id="disableVercel"
                label="simulate missing Vercel key"
                onChange={(value) => update("disableVercel", value)}
              />
              <Toggle
                checked={form.disableOpenRouter}
                id="disableOpenRouter"
                label="simulate missing OpenRouter key"
                onChange={(value) => update("disableOpenRouter", value)}
              />
              <Toggle
                checked={form.checkCredits}
                id="checkCredits"
                label="run credit check first"
                onChange={(value) => update("checkCredits", value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                onChange={(event) => update("prompt", event.target.value)}
                rows={3}
                value={form.prompt}
              />
            </div>
            <Button disabled={running} onClick={() => run()}>
              {running ? "Running…" : "Run"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Result
              {response ? (
                <Badge variant={response.ok ? "secondary" : "destructive"}>
                  {response.ok ? "ok" : "error"} · {response.durationMs} ms
                  {response.firstTokenMs !== undefined
                    ? ` · TTFT ${response.firstTokenMs} ms`
                    : ""}
                </Badge>
              ) : null}
              {route ? (
                <Badge>
                  {String(route.gateway)}
                  {route.upstreamProvider
                    ? ` · ${String(route.upstreamProvider)}`
                    : ""}
                  {route.fallbackFrom
                    ? ` · fallback from ${String(route.fallbackFrom)} (${String(route.fallbackReason)})`
                    : ""}
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {response?.error ? (
              <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-destructive">
                {response.error.name}
                {response.error.statusCode
                  ? ` (${response.error.statusCode})`
                  : ""}
                : {response.error.message}
              </pre>
            ) : null}
            {response?.text ? (
              <div>
                <div className="mb-1 font-medium">Text</div>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3">
                  {response.text}
                </pre>
              </div>
            ) : null}
            {response?.output !== undefined ? (
              <div>
                <div className="mb-1 font-medium">Structured output</div>
                <pre className="rounded-md bg-muted p-3">
                  {stringify(response.output)}
                </pre>
              </div>
            ) : null}
            {response?.toolCalls?.length ? (
              <div>
                <span className="font-medium">Tool calls:</span>{" "}
                {response.toolCalls.join(", ")}
              </div>
            ) : null}
            {response?.decision ? (
              <details open>
                <summary className="cursor-pointer font-medium">
                  Route decision
                </summary>
                <pre className="mt-1 rounded-md bg-muted p-3">
                  {stringify(response.decision)}
                </pre>
              </details>
            ) : null}
            {response?.steps?.length ? (
              <details>
                <summary className="cursor-pointer font-medium">
                  Steps (route metadata + usage)
                </summary>
                <pre className="mt-1 rounded-md bg-muted p-3">
                  {stringify(response.steps)}
                </pre>
              </details>
            ) : null}
            {response?.requestBody ? (
              <details>
                <summary className="cursor-pointer font-medium">
                  Request body sent to gateway (privacy flags)
                </summary>
                <pre className="mt-1 rounded-md bg-muted p-3">
                  {stringify(response.requestBody)}
                </pre>
              </details>
            ) : null}
            {response?.logs.length ? (
              <details open>
                <summary className="cursor-pointer font-medium">
                  Router logs ({response.logs.length})
                </summary>
                <div className="mt-1 flex flex-col gap-1">
                  {response.logs.map((entry, index) => (
                    <div
                      className="rounded-md bg-muted p-2"
                      key={`${entry.event}-${index}`}
                    >
                      <Badge variant={LEVEL_VARIANT[entry.level]}>
                        {entry.level}
                      </Badge>{" "}
                      <span className="font-mono">{entry.event}</span>
                      {entry.fields ? (
                        <pre className="mt-1 whitespace-pre-wrap text-xs">
                          {stringify(entry.fields)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {!response && (
              <p className="text-muted-foreground">
                Pick a preset or press Run.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1">Run</th>
                  <th>Status</th>
                  <th>Gateway</th>
                  <th>Upstream</th>
                  <th>Fallback</th>
                  <th>Duration</th>
                  <th>Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => {
                  const last = entry.response.steps?.at(-1)?.route;
                  const cost = entry.response.steps?.reduce((sum, step) => {
                    const value = step.route?.costUsd;
                    return typeof value === "number" ? sum + value : sum;
                  }, 0);
                  return (
                    <tr className="border-t" key={`${entry.label}-${index}`}>
                      <td className="py-1">{entry.label}</td>
                      <td>
                        {entry.response.ok ? "ok" : entry.response.error?.name}
                      </td>
                      <td>{last ? String(last.gateway) : "—"}</td>
                      <td>
                        {last?.upstreamProvider
                          ? String(last.upstreamProvider)
                          : "—"}
                      </td>
                      <td>
                        {last?.fallbackFrom
                          ? `${String(last.fallbackFrom)} (${String(last.fallbackReason)})`
                          : "—"}
                      </td>
                      <td>{entry.response.durationMs} ms</td>
                      <td>{cost ? cost.toFixed(6) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
