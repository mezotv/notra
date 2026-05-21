"use client";

import {
  Copy01Icon,
  Download01Icon,
  GitBranchIcon,
  Image01Icon,
  MagicWand01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  GenerateRepoImageInput,
  GenerateRepoImageResult,
  RepoImageMode,
} from "@notra/ai/types/repo-image";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import { base64ToBlob, pngBase64ToDataUrl } from "@/lib/repo-image/utils";

const MODE_LABELS: Record<RepoImageMode, string> = {
  prompt: "Prompt",
  pr: "Pull Request",
  commit: "Commit",
};

const MODE_OPTIONS: RepoImageMode[] = ["prompt", "pr", "commit"];
const COMMIT_SHA_REGEX = /^[0-9a-f]{7,40}$/i;

function isRepoImageMode(value: string): value is RepoImageMode {
  return value in MODE_LABELS;
}

interface GitHubIntegrationOption {
  id: string;
  displayName: string;
  enabled: boolean;
  owner: string;
  repo: string;
  defaultBranch: string | null;
}

export default function RepoImagePage() {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const exportRef = useRef<HTMLDivElement>(null);

  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [branch, setBranch] = useState("");
  const [mode, setMode] = useState<RepoImageMode>("prompt");
  const [prompt, setPrompt] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [commitSha, setCommitSha] = useState("");

  const { data: integrationsData, isPending: integrationsPending } = useQuery({
    ...dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
    }),
    enabled: !!organizationId,
  });

  const githubIntegrations: GitHubIntegrationOption[] = useMemo(() => {
    const list = integrationsData?.integrations ?? [];
    return list
      .filter(
        (integration) => integration.type === "github" && integration.enabled
      )
      .flatMap((integration) => {
        const repository = integration.repositories[0];
        if (!repository || !repository.enabled) {
          return [];
        }
        return [
          {
            id: integration.id,
            displayName: integration.displayName,
            enabled: integration.enabled,
            owner: repository.owner,
            repo: repository.repo,
            defaultBranch: repository.defaultBranch,
          },
        ];
      });
  }, [integrationsData]);

  const selectedIntegration =
    githubIntegrations.find((item) => item.id === integrationId) ?? null;

  useEffect(() => {
    if (!selectedIntegration) {
      return;
    }
    setBranch(
      (current) => current || (selectedIntegration.defaultBranch ?? "")
    );
  }, [selectedIntegration]);

  const mutation = useMutation<GenerateRepoImageResult, Error, void>({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }
      if (!selectedIntegration) {
        throw new Error("Pick a GitHub integration");
      }
      if (!branch.trim()) {
        throw new Error("Branch is required");
      }

      const base = {
        organizationId,
        integrationId: selectedIntegration.id,
        branch: branch.trim(),
        mode,
      };

      let payload: GenerateRepoImageInput;
      if (mode === "prompt") {
        if (!prompt.trim()) {
          throw new Error("Prompt is required");
        }
        payload = { ...base, prompt: prompt.trim() };
      } else if (mode === "pr") {
        const num = Number.parseInt(prNumber.trim(), 10);
        if (!Number.isFinite(num) || num <= 0) {
          throw new Error("Enter a valid PR number");
        }
        payload = { ...base, prNumber: num };
      } else {
        const sha = commitSha.trim();
        if (!COMMIT_SHA_REGEX.test(sha)) {
          throw new Error("Enter a valid commit SHA (7–40 hex chars)");
        }
        payload = { ...base, commitSha: sha };
      }

      return dashboardOrpc.repoImage.generate.call(payload);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const result = mutation.data ?? null;
  const previewUrl = result ? pngBase64ToDataUrl(result.pngBase64) : null;
  const exportHtml = useMemo(() => {
    if (!result) {
      return null;
    }
    const doc = new DOMParser().parseFromString(result.html, "text/html");
    return doc.body.innerHTML || result.html;
  }, [result]);
  const exportName = selectedIntegration
    ? `${selectedIntegration.owner}/${selectedIntegration.repo} Repo Image`
    : "Repo Image";

  function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadPng() {
    if (!(result && selectedIntegration)) {
      return;
    }
    downloadFile(
      base64ToBlob(result.pngBase64, "image/png"),
      `${selectedIntegration.repo}-image.png`
    );
  }

  function handleDownloadSvg() {
    if (!(result && selectedIntegration)) {
      return;
    }
    downloadFile(
      new Blob([result.svg], { type: "image/svg+xml" }),
      `${selectedIntegration.repo}-image.svg`
    );
  }

  async function handleCopySvg() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.svg);
      toast.success("SVG copied");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Couldn't copy: ${error.message}`
          : "Couldn't copy SVG"
      );
    }
  }

  const copyFigmaMutation = useMutation({
    mutationFn: async () => {
      const el = exportRef.current;
      if (!el) {
        throw new Error("Design not ready");
      }
      const { buildFigmaPasteHtml } = await import("@notra/kiwi");
      const html = await buildFigmaPasteHtml(el, { name: exportName });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    },
    onSuccess: () => toast.success("Copied. Now paste into Figma (Cmd+V)"),
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Copy failed: ${message}`);
    },
  });

  const copyPaperMutation = useMutation({
    mutationFn: async () => {
      const el = exportRef.current;
      if (!el) {
        throw new Error("Design not ready");
      }
      const { copyAsPaper } = await import("@notra/kiwi/paper");
      await copyAsPaper(el, { name: exportName });
    },
    onSuccess: () => toast.success("Copied. Now paste into Paper (Cmd+V)"),
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Copy failed: ${message}`);
    },
  });

  const isGenerating = mutation.isPending;
  const isCopying = copyFigmaMutation.isPending || copyPaperMutation.isPending;
  const canGenerate =
    !!organizationId &&
    !!selectedIntegration &&
    branch.trim().length > 0 &&
    ((mode === "prompt" && prompt.trim().length > 0) ||
      (mode === "pr" && prNumber.trim().length > 0) ||
      (mode === "commit" && commitSha.trim().length > 0)) &&
    !isGenerating;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-3xl tracking-tight">Repo Image</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <p className="text-muted-foreground">
              Generate a brand-matched social image from one of your connected
              GitHub repositories.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
              <CardDescription>
                Pick the repository and what the image is about. The agent
                clones the repo and reads its design tokens before rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>GitHub integration</FieldLabel>
                <Select
                  disabled={isGenerating || integrationsPending}
                  onValueChange={(value) => {
                    setIntegrationId(value);
                    const next = githubIntegrations.find(
                      (item) => item.id === value
                    );
                    if (next?.defaultBranch) {
                      setBranch(next.defaultBranch);
                    } else {
                      setBranch("");
                    }
                  }}
                  value={integrationId ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        integrationsPending
                          ? "Loading…"
                          : githubIntegrations.length === 0
                            ? "No GitHub integrations yet"
                            : "Pick a repository"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {githubIntegrations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.owner}/{item.repo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon className="size-3.5" icon={GitBranchIcon} />
                    Branch
                  </span>
                </FieldLabel>
                <Input
                  disabled={isGenerating || !selectedIntegration}
                  onChange={(event) => setBranch(event.target.value)}
                  placeholder="main"
                  value={branch}
                />
              </Field>

              <Field>
                <FieldLabel>Subject</FieldLabel>
                <Tabs
                  onValueChange={(value) => {
                    if (isRepoImageMode(value)) {
                      setMode(value);
                    }
                  }}
                  value={mode}
                >
                  <TabsList>
                    {MODE_OPTIONS.map((item) => (
                      <TabsTrigger
                        disabled={isGenerating}
                        key={item}
                        value={item}
                      >
                        {MODE_LABELS[item]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {mode === "prompt" ? (
                  <Textarea
                    className="mt-2 min-h-[7.5rem]"
                    disabled={isGenerating}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Launch announcement for our new chat feature"
                    value={prompt}
                  />
                ) : null}

                {mode === "pr" ? (
                  <Input
                    className="mt-2"
                    disabled={isGenerating}
                    inputMode="numeric"
                    onChange={(event) =>
                      setPrNumber(event.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="123"
                    value={prNumber}
                  />
                ) : null}

                {mode === "commit" ? (
                  <Input
                    className="mt-2 font-mono"
                    disabled={isGenerating}
                    onChange={(event) => setCommitSha(event.target.value)}
                    placeholder="a1b2c3d"
                    value={commitSha}
                  />
                ) : null}
              </Field>

              <Button
                className="w-full"
                disabled={!canGenerate}
                onClick={() => mutation.mutate()}
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon className="size-4" icon={MagicWand01Icon} />
                    Generate image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {previewUrl
                  ? "1200×630. Copy it directly into Figma or Paper, or download SVG/PNG."
                  : "Your generated image will appear here."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                {isGenerating ? (
                  <Skeleton className="aspect-[1200/630] w-full" />
                ) : previewUrl ? (
                  // biome-ignore lint/performance/noImgElement: dynamic data-URL PNG, not a static asset
                  <img
                    alt="Generated repository preview"
                    className="aspect-[1200/630] w-full object-contain"
                    height={630}
                    src={previewUrl}
                    width={1200}
                  />
                ) : (
                  <div className="flex aspect-[1200/630] w-full items-center justify-center text-muted-foreground">
                    <HugeiconsIcon className="size-8" icon={Image01Icon} />
                  </div>
                )}
              </div>

              {result ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    disabled={isCopying}
                    onClick={() => copyFigmaMutation.mutate()}
                  >
                    {copyFigmaMutation.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon className="size-4" icon={Copy01Icon} />
                    )}
                    Copy as Figma
                  </Button>
                  <Button
                    className="hover:opacity-90"
                    disabled={isCopying}
                    onClick={() => copyPaperMutation.mutate()}
                    style={{ backgroundColor: "#81ACEC", color: "#ffffff" }}
                  >
                    {copyPaperMutation.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon className="size-4" icon={Copy01Icon} />
                    )}
                    Copy to Paper
                  </Button>
                  <Button onClick={handleCopySvg} variant="outline">
                    <HugeiconsIcon className="size-4" icon={Copy01Icon} />
                    Copy SVG
                  </Button>
                  <Button onClick={handleDownloadSvg} variant="outline">
                    <HugeiconsIcon className="size-4" icon={Download01Icon} />
                    SVG
                  </Button>
                  <Button onClick={handleDownloadPng} variant="outline">
                    <HugeiconsIcon className="size-4" icon={Download01Icon} />
                    PNG
                  </Button>
                </div>
              ) : null}
              {exportHtml ? (
                <div
                  aria-hidden="true"
                  className="-left-[10000px] pointer-events-none fixed top-0 opacity-0"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: generated repo image HTML is rendered off-screen as the clipboard export source
                  dangerouslySetInnerHTML={{ __html: exportHtml }}
                  ref={exportRef}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
