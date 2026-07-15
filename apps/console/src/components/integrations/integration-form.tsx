"use client";

import {
  Alert02Icon,
  ArrowLeft02Icon,
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerHue,
  ColorPickerSelection,
} from "@notra/ui/components/kibo-ui/color-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "cnfast";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  BannerUploader,
  LogoVariantUploader,
} from "@/components/integrations/branding-uploader";
import { ToolsEditor } from "@/components/integrations/tools-editor";
import {
  AUTH_CHOICE_OPTIONS,
  LIVE_EDIT_WARNING,
} from "@/lib/integrations/constants";
import {
  authChoiceToAuthType,
  authTypeToAuthChoice,
  buildHeadersFromForm,
  getInitialApiKeyStyle,
  hasStoredBearerHeader,
  rgbaToHex,
} from "@/lib/integrations/form";
import { createHeaderRow } from "@/lib/integrations/headers";
import { consoleOrpc } from "@/lib/orpc/query";
import {
  BRAND_COLOR_REGEX,
  createMcpServerRequestSchema,
  MAX_MCP_HEADERS,
  updateMcpServerRequestSchema,
} from "@/schemas/integrations";
import type {
  ApiKeyStyle,
  AuthChoice,
  HeaderRow,
  McpIntegrationTool,
  McpServer,
  ToolPhraseDraft,
} from "@/types/integrations";

function buildInitialPhraseDrafts(tools: McpIntegrationTool[]) {
  const drafts: Record<string, ToolPhraseDraft> = {};
  for (const tool of tools) {
    drafts[tool.serverToolName] = {
      serverToolName: tool.serverToolName,
      actionPhrasePresent: tool.actionPhrasePresent ?? "",
      actionPhrasePast: tool.actionPhrasePast ?? "",
    };
  }
  return drafts;
}

function LiveWarningBanner() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-700 text-sm dark:text-amber-400">
      <HugeiconsIcon className="mt-0.5 size-4 shrink-0" icon={Alert02Icon} />
      <p>{LIVE_EDIT_WARNING}</p>
    </div>
  );
}

function RejectedBanner({ note }: { note: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
      <HugeiconsIcon className="mt-0.5 size-4 shrink-0" icon={Alert02Icon} />
      <p>
        This integration was rejected in review.
        {note ? ` Note from the reviewer: ${note}` : ""} Update it and submit
        again.
      </p>
    </div>
  );
}

export function IntegrationForm({
  organizationId,
  server,
  slug,
  tools,
}: {
  organizationId: string;
  server?: McpServer;
  slug: string;
  tools?: McpIntegrationTool[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(server);

  const [name, setName] = useState(server?.name ?? "");
  const [author, setAuthor] = useState(server?.author ?? "");
  const [description, setDescription] = useState(server?.description ?? "");
  const [url, setUrl] = useState(server?.url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(server?.websiteUrl ?? "");
  const [brandColor, setBrandColor] = useState(server?.brandColor ?? "");
  const [logoLightUrl, setLogoLightUrl] = useState(
    server?.logoLightUrl ?? null
  );
  const [logoDarkUrl, setLogoDarkUrl] = useState(server?.logoDarkUrl ?? null);
  const [bannerUrl, setBannerUrl] = useState(server?.bannerUrl ?? null);
  const [authChoice, setAuthChoice] = useState<AuthChoice>(
    server ? authTypeToAuthChoice(server.authType) : "none"
  );
  const [apiKeyStyle, setApiKeyStyle] = useState<ApiKeyStyle>(
    getInitialApiKeyStyle(server)
  );
  const [bearerToken, setBearerToken] = useState("");
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);
  const [phraseDrafts, setPhraseDrafts] = useState<
    Record<string, ToolPhraseDraft>
  >(buildInitialPhraseDrafts(tools ?? []));
  const [indexedTools, setIndexedTools] = useState<McpIntegrationTool[]>(
    tools ?? []
  );

  const backHref = `/${slug}/integrations`;

  function getSharedFields() {
    return {
      organizationId,
      name,
      author: author.trim() || null,
      description: description.trim() || null,
      url,
      authType: authChoiceToAuthType(authChoice),
      headers: buildHeadersFromForm({
        apiKeyStyle,
        authChoice,
        bearerToken,
        headerRows,
      }),
      websiteUrl: websiteUrl.trim() || null,
      brandColor: brandColor.trim() || null,
      logoLightUrl,
      logoDarkUrl,
      bannerUrl,
    };
  }

  function validateApiKeyInput() {
    if (authChoice !== "apikey") {
      return true;
    }
    if (apiKeyStyle === "bearer") {
      if (bearerToken.trim() || hasStoredBearerHeader(server)) {
        return true;
      }
      toast.error("Bearer token is required");
      return false;
    }
    const incomplete = headerRows.some(
      (row) => !(row.name.trim() && row.value.trim())
    );
    if (headerRows.length > 0 && !incomplete) {
      return true;
    }
    if (
      headerRows.length === 0 &&
      server?.hasHeaders &&
      !hasStoredBearerHeader(server)
    ) {
      return true;
    }
    toast.error("Complete every custom header");
    return false;
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const parsed = createMcpServerRequestSchema.safeParse(getSharedFields());
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the integration details"
        );
      }
      return consoleOrpc.integrations.mcp.create.call(parsed.data);
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Integration created as a draft");
      router.push(`/${slug}/integrations/${created.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!server) {
        throw new Error("Integration not loaded");
      }
      const parsed = updateMcpServerRequestSchema.safeParse({
        ...getSharedFields(),
        serverId: server.id,
      });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the integration details"
        );
      }
      const updated = await consoleOrpc.integrations.mcp.update.call(
        parsed.data
      );
      await consoleOrpc.integrations.mcp.updateToolPhrases.call({
        organizationId,
        serverId: server.id,
        tools: Object.values(phraseDrafts),
      });
      return updated;
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      if (server) {
        await queryClient.invalidateQueries({
          queryKey: consoleOrpc.integrations.mcp.get.queryKey({
            input: { organizationId, serverId: server.id },
          }),
        });
      }
      toast.success(
        updated.storeStatus === "pending_review" &&
          server?.storeStatus === "live"
          ? "Saved — sent back through review"
          : "Integration saved"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const scanMutation = useMutation({
    mutationFn: () => {
      if (!server) {
        throw new Error("Save the integration before scanning");
      }
      return consoleOrpc.integrations.mcp.scan.call({
        organizationId,
        serverId: server.id,
      });
    },
    onSuccess: (result) => {
      setIndexedTools(result.tools);
      setPhraseDrafts((current) => {
        const next = buildInitialPhraseDrafts(result.tools);
        for (const [toolName, draft] of Object.entries(current)) {
          if (next[toolName]) {
            next[toolName] = draft;
          }
        }
        return next;
      });
      toast.success(
        result.tools.length === 1
          ? "Found 1 tool"
          : `Found ${result.tools.length} tools`
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => {
      if (!server) {
        throw new Error("Integration not loaded");
      }
      return consoleOrpc.integrations.mcp.submitForReview.call({
        organizationId,
        serverId: server.id,
      });
    },
    onSuccess: async () => {
      if (server) {
        await queryClient.invalidateQueries({
          queryKey: consoleOrpc.integrations.mcp.get.queryKey({
            input: { organizationId, serverId: server.id },
          }),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Submitted for review");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateApiKeyInput()) {
      return;
    }
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="grid gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
          href={backHref}
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
          Back to My Integrations
        </Link>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {isEdit ? `Edit ${server?.name}` : "New integration"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {isEdit
              ? "Change anything you like — saving sends it back through review."
              : "Register an MCP server for the Notra integration store."}
          </p>
        </div>
        {server?.storeStatus === "live" ? <LiveWarningBanner /> : null}
        {server?.storeStatus === "rejected" ? (
          <RejectedBanner note={server.reviewNote} />
        ) : null}
      </div>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              What users see in the store listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="integration-name">Name</Label>
                <Input
                  disabled={isSaving}
                  id="integration-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Neon"
                  required
                  value={name}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="integration-author">Author</Label>
                <Input
                  disabled={isSaving}
                  id="integration-author"
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="Acme, Inc."
                  value={author}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="integration-website">
                Website{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                disabled={isSaving}
                id="integration-website"
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com"
                type="url"
                value={websiteUrl}
              />
              <p className="text-muted-foreground text-xs">
                Linked from the store listing.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="integration-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                disabled={isSaving}
                id="integration-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this server does and what it lets users manage from chat."
                value={description}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              The logo is front and center in the store. Upload a variant for
              each theme so it looks right everywhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <LogoVariantUploader
                  fallbackUrl={null}
                  onChange={setLogoLightUrl}
                  organizationId={organizationId}
                  theme="light"
                  value={logoLightUrl}
                />
                <LogoVariantUploader
                  fallbackUrl={logoLightUrl}
                  onChange={setLogoDarkUrl}
                  organizationId={organizationId}
                  theme="dark"
                  value={logoDarkUrl}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Square works best. Without a dark variant, the light logo is
                used in both themes.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="integration-brand-color">
                Brand color{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        aria-label="Pick brand color"
                        className={cn(
                          "size-8 shrink-0 cursor-pointer rounded-md border",
                          !BRAND_COLOR_REGEX.test(brandColor.trim()) &&
                            "bg-muted"
                        )}
                        disabled={isSaving}
                        style={
                          BRAND_COLOR_REGEX.test(brandColor.trim())
                            ? { backgroundColor: brandColor.trim() }
                            : undefined
                        }
                        type="button"
                      />
                    }
                  />
                  <PopoverContent align="start" className="w-64">
                    <ColorPicker
                      className="flex flex-col gap-3"
                      defaultValue={
                        BRAND_COLOR_REGEX.test(brandColor.trim())
                          ? brandColor.trim()
                          : "#7C5CFF"
                      }
                      onChange={(value) => {
                        if (Array.isArray(value)) {
                          setBrandColor(rgbaToHex(value));
                        }
                      }}
                    >
                      <ColorPickerSelection className="h-32 rounded-md" />
                      <div className="flex items-center gap-2">
                        <ColorPickerEyeDropper />
                        <ColorPickerHue className="flex-1" />
                      </div>
                    </ColorPicker>
                  </PopoverContent>
                </Popover>
                <Input
                  className="w-32 font-mono"
                  disabled={isSaving}
                  id="integration-brand-color"
                  maxLength={7}
                  onChange={(event) => setBrandColor(event.target.value)}
                  placeholder="#7C5CFF"
                  value={brandColor}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Used as the accent color on the store listing.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>
                Banner{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <BannerUploader
                onChange={setBannerUrl}
                organizationId={organizationId}
                value={bannerUrl}
              />
              <p className="text-muted-foreground text-xs">
                A wide header image for the store listing page.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server &amp; authentication</CardTitle>
            <CardDescription>
              Where the MCP server lives and how users connect to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="integration-url">MCP server URL</Label>
              <Input
                className="font-mono"
                disabled={isSaving}
                id="integration-url"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://mcp.example.com/mcp"
                required
                type="url"
                value={url}
              />
              <p className="text-muted-foreground text-xs">
                HTTPS Streamable HTTP endpoints only.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Authentication</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {AUTH_CHOICE_OPTIONS.map((option) => (
                  <button
                    aria-pressed={authChoice === option.value}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      authChoice === option.value
                        ? "border-primary ring-1 ring-primary"
                        : "hover:border-muted-foreground/40"
                    )}
                    disabled={isSaving}
                    key={option.value}
                    onClick={() => setAuthChoice(option.value)}
                    type="button"
                  >
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {authChoice === "apikey" ? (
              <div className="grid gap-4 rounded-lg border p-4">
                {server?.hasHeaders ? (
                  <p className="text-muted-foreground text-xs">
                    This integration already has stored credentials
                    {server.headerNames.length > 0
                      ? ` (${server.headerNames.join(", ")})`
                      : ""}
                    . Enter new values to replace them.
                  </p>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="integration-key-style">Key style</Label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    disabled={isSaving}
                    id="integration-key-style"
                    onChange={(event) => {
                      setApiKeyStyle(
                        event.target.value === "headers" ? "headers" : "bearer"
                      );
                      setBearerToken("");
                      setHeaderRows([]);
                    }}
                    value={apiKeyStyle}
                  >
                    <option value="bearer">Bearer token</option>
                    <option value="headers">Custom headers</option>
                  </select>
                </div>
                {apiKeyStyle === "bearer" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="integration-bearer">Bearer token</Label>
                    <Input
                      autoComplete="off"
                      disabled={isSaving}
                      id="integration-bearer"
                      onChange={(event) => setBearerToken(event.target.value)}
                      placeholder="Token"
                      type="password"
                      value={bearerToken}
                    />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label>Custom headers</Label>
                      <Button
                        disabled={
                          isSaving || headerRows.length >= MAX_MCP_HEADERS
                        }
                        onClick={() =>
                          setHeaderRows((rows) => [...rows, createHeaderRow()])
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
                        Add header
                      </Button>
                    </div>
                    {headerRows.map((row) => (
                      <div className="flex items-center gap-2" key={row.id}>
                        <Input
                          aria-label="Header name"
                          disabled={isSaving}
                          onChange={(event) =>
                            setHeaderRows((rows) =>
                              rows.map((item) =>
                                item.id === row.id
                                  ? { ...item, name: event.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Header name"
                          value={row.name}
                        />
                        <Input
                          aria-label="Header value"
                          disabled={isSaving}
                          onChange={(event) =>
                            setHeaderRows((rows) =>
                              rows.map((item) =>
                                item.id === row.id
                                  ? { ...item, value: event.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Value"
                          type="password"
                          value={row.value}
                        />
                        <Button
                          aria-label="Remove header"
                          disabled={isSaving}
                          onClick={() =>
                            setHeaderRows((rows) =>
                              rows.filter((item) => item.id !== row.id)
                            )
                          }
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <HugeiconsIcon
                            className="size-4"
                            icon={Delete02Icon}
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isEdit ? (
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                Scan the server, then give every tool an action phrase — it
                shows up in the chat while Notra runs the tool, like
                &quot;Searching your Linear issues&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ToolsEditor
                drafts={phraseDrafts}
                onDraftChange={(serverToolName, field, value) =>
                  setPhraseDrafts((current) => ({
                    ...current,
                    [serverToolName]: {
                      serverToolName,
                      actionPhrasePresent:
                        field === "actionPhrasePresent"
                          ? value
                          : (current[serverToolName]?.actionPhrasePresent ??
                            ""),
                      actionPhrasePast:
                        field === "actionPhrasePast"
                          ? value
                          : (current[serverToolName]?.actionPhrasePast ?? ""),
                    },
                  }))
                }
                onScan={() => scanMutation.mutate()}
                scanning={scanMutation.isPending}
                tools={indexedTools}
              />
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            className="corner-squircle rounded-[1rem] supports-[corner-shape:round]:rounded-[1.25rem]"
            disabled={isSaving}
            nativeButton={false}
            render={<Link href={backHref} />}
            variant="outline"
          >
            Cancel
          </Button>
          {isEdit &&
          (server?.storeStatus === "draft" ||
            server?.storeStatus === "rejected") ? (
            <Button
              disabled={isSaving || submitReviewMutation.isPending}
              onClick={() => submitReviewMutation.mutate()}
              type="button"
              variant="outline"
            >
              {submitReviewMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              Submit for review
            </Button>
          ) : null}
          <Button disabled={isSaving} type="submit">
            {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Create integration"}
          </Button>
        </div>
      </form>
    </main>
  );
}
