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
import { openMcpOAuthPopup } from "@notra/utils/oauth-popup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "cnfast";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
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
  MCP_CONNECTED_TOAST,
  MCP_OAUTH_ERROR_MESSAGES,
} from "@/lib/integrations/constants";
import {
  applyPhraseDraftChange,
  buildInitialPhraseDrafts,
  rgbaToHex,
} from "@/lib/integrations/form";
import { createHeaderRow } from "@/lib/integrations/headers";
import { isManualTool, mergeManualTools } from "@/lib/integrations/tool-io";
import { useIntegrationForm } from "@/lib/integrations/use-integration-form";
import { consoleOrpc } from "@/lib/orpc/query";
import { BRAND_COLOR_REGEX, MAX_MCP_HEADERS } from "@/schemas/integrations";
import type {
  ApiKeyStyle,
  AuthChoice,
  HeaderRow,
  McpIntegrationTool,
  McpServer,
  ToolPhraseDraft,
  ToolPhraseField,
  ToolPhraseImportEntry,
  ToolsEditorProps,
} from "@/types/integrations";

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
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <HugeiconsIcon
        className="mt-0.5 size-4 shrink-0 text-destructive"
        icon={Alert02Icon}
      />
      <p>
        <span className="font-medium text-destructive">
          Rejected in review:
        </span>{" "}
        {note ?? "Update the integration and submit it again."}
      </p>
    </div>
  );
}

function IntegrationFormHeader({
  backHref,
  server,
}: {
  backHref: string;
  server?: McpServer;
}) {
  return (
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
          {server ? <>Edit {server.name}</> : "New integration"}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {server
            ? "Changes to a live integration go back through review when you save."
            : "Register an MCP server for the Notra integration store."}
        </p>
      </div>
      {server?.storeStatus === "live" ? <LiveWarningBanner /> : null}
      {server?.storeStatus === "rejected" ? (
        <RejectedBanner note={server.reviewNote} />
      ) : null}
    </div>
  );
}

function IntegrationDetailsCard({
  author,
  description,
  isSaving,
  name,
  setAuthor,
  setDescription,
  setName,
  setWebsiteUrl,
  websiteUrl,
}: {
  author: string;
  description: string;
  isSaving: boolean;
  name: string;
  setAuthor: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setName: Dispatch<SetStateAction<string>>;
  setWebsiteUrl: Dispatch<SetStateAction<string>>;
  websiteUrl: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>What users see in the store listing.</CardDescription>
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
  );
}

function IntegrationBrandingCard({
  bannerUrl,
  brandColor,
  isSaving,
  logoDarkUrl,
  logoLightUrl,
  onUploadingChange,
  organizationId,
  setBannerUrl,
  setBrandColor,
  setLogoDarkUrl,
  setLogoLightUrl,
}: {
  bannerUrl: string | null;
  brandColor: string;
  isSaving: boolean;
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  onUploadingChange: (uploading: boolean) => void;
  organizationId: string;
  setBannerUrl: Dispatch<SetStateAction<string | null>>;
  setBrandColor: Dispatch<SetStateAction<string>>;
  setLogoDarkUrl: Dispatch<SetStateAction<string | null>>;
  setLogoLightUrl: Dispatch<SetStateAction<string | null>>;
}) {
  const normalizedBrandColor = brandColor.trim();
  const hasValidBrandColor = BRAND_COLOR_REGEX.test(normalizedBrandColor);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          The logo is front and center in the store. Upload a variant for each
          theme so it looks right everywhere.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label>Logo</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <LogoVariantUploader
              disabled={isSaving}
              fallbackUrl={null}
              onChange={setLogoLightUrl}
              onUploadingChange={onUploadingChange}
              organizationId={organizationId}
              theme="light"
              value={logoLightUrl}
            />
            <LogoVariantUploader
              disabled={isSaving}
              fallbackUrl={logoLightUrl}
              onChange={setLogoDarkUrl}
              onUploadingChange={onUploadingChange}
              organizationId={organizationId}
              theme="dark"
              value={logoDarkUrl}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Square works best. Without a dark variant, the light logo is used in
            both themes.
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
                      !hasValidBrandColor && "bg-muted"
                    )}
                    disabled={isSaving}
                    style={
                      hasValidBrandColor
                        ? { backgroundColor: normalizedBrandColor }
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
                    hasValidBrandColor ? normalizedBrandColor : "#7C5CFF"
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
            disabled={isSaving}
            onChange={setBannerUrl}
            onUploadingChange={onUploadingChange}
            organizationId={organizationId}
            value={bannerUrl}
          />
          <p className="text-muted-foreground text-xs">
            A wide header image for the store listing page. Recommended size:
            1500x500px (3:1 aspect ratio).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ServerAuthenticationCard({
  apiKeyStyle,
  authChoice,
  bearerToken,
  headerRows,
  isSaving,
  server,
  setApiKeyStyle,
  setAuthChoice,
  setBearerToken,
  setHeaderRows,
  setUrl,
  url,
}: {
  apiKeyStyle: ApiKeyStyle;
  authChoice: AuthChoice;
  bearerToken: string;
  headerRows: HeaderRow[];
  isSaving: boolean;
  server?: McpServer;
  setApiKeyStyle: Dispatch<SetStateAction<ApiKeyStyle>>;
  setAuthChoice: Dispatch<SetStateAction<AuthChoice>>;
  setBearerToken: Dispatch<SetStateAction<string>>;
  setHeaderRows: Dispatch<SetStateAction<HeaderRow[]>>;
  setUrl: Dispatch<SetStateAction<string>>;
  url: string;
}) {
  return (
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
                {server.headerNames.length > 0 ? (
                  <> ({server.headerNames.join(", ")})</>
                ) : null}
                . Enter new values to replace them.
              </p>
            ) : null}
            <div className="grid gap-2">
              <Label
                htmlFor="integration-key-style"
                id="integration-key-style-label"
              >
                Key style
              </Label>
              <select
                aria-labelledby="integration-key-style-label"
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
                    disabled={isSaving || headerRows.length >= MAX_MCP_HEADERS}
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
                      <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface IntegrationQueryData {
  integration: McpServer;
  tools: McpIntegrationTool[];
}

function IntegrationToolsCard({
  isSaving,
  manualTools,
  onAddTool,
  onImportTools,
  onRemoveTool,
  onScanningChange,
  organizationId,
  phraseDrafts,
  server,
  serverLogoDarkUrl,
  serverLogoLightUrl,
  setPhraseBaseline,
  setPhraseDrafts,
  tools,
}: {
  isSaving: boolean;
  manualTools: McpIntegrationTool[];
  onAddTool: (serverToolName: string) => void;
  onImportTools: (entries: ToolPhraseImportEntry[]) => void;
  onRemoveTool: (serverToolName: string) => void;
  onScanningChange: (scanning: boolean) => void;
  organizationId: string;
  phraseDrafts: Record<string, ToolPhraseDraft>;
  server: McpServer;
  serverLogoDarkUrl: string | null;
  serverLogoLightUrl: string | null;
  setPhraseBaseline: Dispatch<SetStateAction<Record<string, ToolPhraseDraft>>>;
  setPhraseDrafts: Dispatch<SetStateAction<Record<string, ToolPhraseDraft>>>;
  tools: McpIntegrationTool[];
}) {
  const queryClient = useQueryClient();
  const [indexedTools, setIndexedTools] = useState(() =>
    tools.filter((tool) => !isManualTool(tool))
  );
  const autoScanTriggeredRef = useRef(false);
  const oauthParamsHandledRef = useRef(false);
  const isOAuth = server.authType === "oauth";

  const beginOAuthMutation = useMutation({
    mutationFn: () =>
      consoleOrpc.integrations.mcp.beginOAuth.call({
        organizationId,
        serverId: server.id,
        callbackPath: window.location.pathname,
      }),
    onMutate: () => {
      onScanningChange(true);
    },
    onError: (error) => {
      onScanningChange(false);
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (oauthParamsHandledRef.current) {
      return;
    }
    oauthParamsHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("mcpConnected");
    const oauthError = params.get("error");
    if (!(connected || oauthError)) {
      return;
    }

    if (connected === "true") {
      toast.success(MCP_CONNECTED_TOAST);
    } else if (oauthError) {
      toast.error(
        MCP_OAUTH_ERROR_MESSAGES[oauthError] ??
          "Could not connect to the server."
      );
    }

    params.delete("mcpConnected");
    params.delete("error");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`
    );
  }, []);

  const scanMutation = useMutation({
    mutationFn: () =>
      consoleOrpc.integrations.mcp.scan.call({
        organizationId,
        serverId: server.id,
      }),
    onMutate: () => {
      onScanningChange(true);
    },
    onSettled: () => {
      onScanningChange(false);
    },
    onSuccess: async (result) => {
      setIndexedTools(result.tools.filter((tool) => !isManualTool(tool)));
      setPhraseBaseline(buildInitialPhraseDrafts(result.tools));
      setPhraseDrafts((current) => {
        const next = buildInitialPhraseDrafts(result.tools);
        for (const [toolName, draft] of Object.entries(current)) {
          if (next[toolName]) {
            next[toolName] = draft;
          }
        }
        return next;
      });
      queryClient.setQueryData<IntegrationQueryData>(
        consoleOrpc.integrations.mcp.get.queryKey({
          input: { organizationId, serverId: server.id },
        }),
        (current) =>
          current
            ? {
                ...current,
                integration: {
                  ...current.integration,
                  indexedToolCount: result.tools.length,
                },
                tools: result.tools,
              }
            : current
      );
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
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

  const { mutate: startScan } = scanMutation;

  useEffect(() => {
    if (autoScanTriggeredRef.current) {
      return;
    }
    autoScanTriggeredRef.current = true;

    if (
      server.authType !== "oauth" &&
      server.lastToolSyncAt === null &&
      indexedTools.length === 0
    ) {
      startScan();
    }
  }, [server.authType, server.lastToolSyncAt, indexedTools.length, startScan]);

  const handleScan = () => {
    if (isOAuth) {
      const oauthPopup = openMcpOAuthPopup();
      beginOAuthMutation.mutate(undefined, {
        onError: () => oauthPopup.close(),
        onSuccess: ({ authorizationUrl }) =>
          oauthPopup.navigate(authorizationUrl),
      });
      return;
    }
    scanMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
        <CardDescription>
          Give each tool an action phrase. Users see it in chat while Notra runs
          the tool, like &quot;Searching your Linear issues&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ToolsEditor
          drafts={phraseDrafts}
          oauth={isOAuth}
          onAddTool={onAddTool}
          onDraftChange={(serverToolName, field, value) =>
            setPhraseDrafts((current) =>
              applyPhraseDraftChange(current, serverToolName, field, value)
            )
          }
          onImportTools={onImportTools}
          onRemoveTool={onRemoveTool}
          onScan={handleScan}
          saving={isSaving}
          scanning={scanMutation.isPending || beginOAuthMutation.isPending}
          serverLogoDarkUrl={serverLogoDarkUrl}
          serverLogoLightUrl={serverLogoLightUrl}
          serverName={server.name}
          serverUrl={server.url}
          tools={mergeManualTools(indexedTools, manualTools)}
        />
      </CardContent>
    </Card>
  );
}

function DraftToolsCard(props: ToolsEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
        <CardDescription>
          Give each tool an action phrase. Users see it in chat while Notra runs
          the tool, like &quot;Searching your Linear issues&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ToolsEditor {...props} />
      </CardContent>
    </Card>
  );
}

function getPrimaryActionLabel({
  canSubmitForReview,
  server,
}: {
  canSubmitForReview: boolean;
  server?: McpServer;
}) {
  if (canSubmitForReview) {
    return "Submit for review";
  }
  return server ? "Save changes" : "Create integration";
}

function IntegrationFormActions({
  backHref,
  busy,
  canSubmitForReview,
  onSaveDraft,
  saveDraftPending,
  server,
  submitReviewPending,
}: {
  backHref: string;
  busy: boolean;
  canSubmitForReview: boolean;
  onSaveDraft: () => void;
  saveDraftPending: boolean;
  server?: McpServer;
  submitReviewPending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Button
        className="corner-squircle rounded-[1rem] supports-[corner-shape:round]:rounded-[1.25rem]"
        disabled={busy}
        nativeButton={false}
        render={<Link href={backHref} />}
        variant="outline"
      >
        Cancel
      </Button>
      {canSubmitForReview ? (
        <Button
          disabled={busy}
          onClick={onSaveDraft}
          type="button"
          variant="outline"
        >
          {saveDraftPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Save as draft
        </Button>
      ) : null}
      <Button disabled={busy} type="submit">
        {(canSubmitForReview ? submitReviewPending : busy) ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : null}
        {getPrimaryActionLabel({ canSubmitForReview, server })}
      </Button>
    </div>
  );
}

function IntegrationOwnershipConsent({
  checked,
  disabled,
  error,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  error: string | null;
  onCheckedChange: (checked: boolean) => void;
}) {
  const errorId = "integration-ownership-consent-error";
  const labelId = "integration-ownership-consent-label";

  return (
    <div className="grid gap-2 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          aria-labelledby={labelId}
          checked={checked}
          className="mt-0.5 size-4 shrink-0 accent-primary"
          disabled={disabled}
          id="integration-ownership-consent"
          onChange={(event) => onCheckedChange(event.target.checked)}
          type="checkbox"
        />
        <Label
          className="font-normal leading-relaxed"
          htmlFor="integration-ownership-consent"
          id={labelId}
        >
          I confirm that I own this MCP server or am authorized to represent it,
          and I allow Notra to use its name, logo, and banner in the integration
          store.
        </Label>
      </div>
      {error ? (
        <p className="ml-7 text-destructive text-xs" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
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
  const form = useIntegrationForm({ organizationId, server, slug, tools });

  const handleDraftChange = (
    serverToolName: string,
    field: ToolPhraseField,
    value: string
  ) =>
    form.setPhraseDrafts((current) =>
      applyPhraseDraftChange(current, serverToolName, field, value)
    );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <IntegrationFormHeader backHref={form.backHref} server={server} />

      <form className="grid gap-6" onSubmit={form.handleSubmit}>
        <IntegrationDetailsCard
          author={form.author}
          description={form.description}
          isSaving={form.isSaving}
          name={form.name}
          setAuthor={form.setAuthor}
          setDescription={form.setDescription}
          setName={form.setName}
          setWebsiteUrl={form.setWebsiteUrl}
          websiteUrl={form.websiteUrl}
        />
        <IntegrationBrandingCard
          bannerUrl={form.bannerUrl}
          brandColor={form.brandColor}
          isSaving={form.isSaving}
          logoDarkUrl={form.logoDarkUrl}
          logoLightUrl={form.logoLightUrl}
          onUploadingChange={(uploading) =>
            form.setUploadingCount((count) => count + (uploading ? 1 : -1))
          }
          organizationId={organizationId}
          setBannerUrl={form.setBannerUrl}
          setBrandColor={form.setBrandColor}
          setLogoDarkUrl={form.setLogoDarkUrl}
          setLogoLightUrl={form.setLogoLightUrl}
        />

        <ServerAuthenticationCard
          apiKeyStyle={form.apiKeyStyle}
          authChoice={form.authChoice}
          bearerToken={form.bearerToken}
          headerRows={form.headerRows}
          isSaving={form.isSaving}
          server={server}
          setApiKeyStyle={form.setApiKeyStyle}
          setAuthChoice={form.setAuthChoice}
          setBearerToken={form.setBearerToken}
          setHeaderRows={form.setHeaderRows}
          setUrl={form.setUrl}
          url={form.url}
        />

        {server ? (
          <IntegrationToolsCard
            isSaving={form.isSaving}
            manualTools={form.manualTools}
            onAddTool={form.addManualTool}
            onImportTools={form.importToolPhrases}
            onRemoveTool={form.removeManualTool}
            onScanningChange={form.setScanning}
            organizationId={organizationId}
            phraseDrafts={form.phraseDrafts}
            server={server}
            serverLogoDarkUrl={form.logoDarkUrl}
            serverLogoLightUrl={form.logoLightUrl}
            setPhraseBaseline={form.setPhraseBaseline}
            setPhraseDrafts={form.setPhraseDrafts}
            tools={tools ?? []}
          />
        ) : (
          <DraftToolsCard
            drafts={form.phraseDrafts}
            oauth={form.authChoice === "oauth"}
            onAddTool={form.addManualTool}
            onDraftChange={handleDraftChange}
            onImportTools={form.importToolPhrases}
            onRemoveTool={form.removeManualTool}
            onScan={form.scanDraft}
            saving={form.isSaving}
            scanning={form.draftScanning}
            serverLogoDarkUrl={form.logoDarkUrl}
            serverLogoLightUrl={form.logoLightUrl}
            serverName={form.name}
            serverUrl={form.url}
            tools={mergeManualTools(form.draftTools, form.manualTools)}
          />
        )}

        <IntegrationOwnershipConsent
          checked={form.ownershipConsent}
          disabled={form.isBusy}
          error={form.ownershipConsentError}
          onCheckedChange={form.setOwnershipConsent}
        />

        <IntegrationFormActions
          backHref={form.backHref}
          busy={form.isBusy}
          canSubmitForReview={form.canSubmitForReview}
          onSaveDraft={form.handleSaveDraft}
          saveDraftPending={form.saveDraftPending}
          server={server}
          submitReviewPending={form.submitReviewPending}
        />
      </form>
    </main>
  );
}
