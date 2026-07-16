"use client";

import { openMcpOAuthPopup } from "@notra/utils/oauth-popup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  authChoiceToAuthType,
  authTypeToAuthChoice,
  buildHeadersFromForm,
  buildInitialPhraseDrafts,
  findDuplicateHeaderName,
  getChangedToolPhraseDrafts,
  getInitialApiKeyStyle,
  hasStoredBearerHeader,
} from "@/lib/integrations/form";
import { createManualTool, isManualTool } from "@/lib/integrations/tool-io";
import { consoleOrpc } from "@/lib/orpc/query";
import {
  createMcpServerRequestSchema,
  testMcpServerRequestSchema,
  updateMcpServerRequestSchema,
} from "@/schemas/integrations";
import type {
  ApiKeyStyle,
  AuthChoice,
  HeaderRow,
  McpIntegrationTool,
  McpServer,
  ToolPhraseDraft,
  ToolPhraseImportEntry,
  UpdateMcpToolPhrasesRequest,
} from "@/types/integrations";

export function useIntegrationForm({
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
  const [uploadingCount, setUploadingCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [authChoice, setAuthChoice] = useState<AuthChoice>(
    server ? authTypeToAuthChoice(server.authType) : "none"
  );
  const [apiKeyStyle, setApiKeyStyle] = useState<ApiKeyStyle>(() =>
    getInitialApiKeyStyle(server)
  );
  const [bearerToken, setBearerToken] = useState("");
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);
  const [phraseDrafts, setPhraseDrafts] = useState<
    Record<string, ToolPhraseDraft>
  >(() => buildInitialPhraseDrafts(tools ?? []));
  const [phraseBaseline, setPhraseBaseline] = useState<
    Record<string, ToolPhraseDraft>
  >(() => buildInitialPhraseDrafts(tools ?? []));
  const [draftTools, setDraftTools] = useState<McpIntegrationTool[]>([]);
  const [manualTools, setManualTools] = useState<McpIntegrationTool[]>(() =>
    (tools ?? []).filter(isManualTool)
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
      const duplicateName = findDuplicateHeaderName(headerRows);
      if (duplicateName) {
        toast.error(`Header "${duplicateName}" is listed more than once`);
        return false;
      }
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

  async function saveToolPhrases(serverId: string) {
    const changedTools = getChangedToolPhraseDrafts(
      phraseDrafts,
      phraseBaseline
    );
    const updatesByName = new Map<
      string,
      UpdateMcpToolPhrasesRequest["tools"][number]
    >(changedTools.map((tool) => [tool.serverToolName, tool]));
    for (const tool of manualTools) {
      const draft = phraseDrafts[tool.serverToolName];
      updatesByName.set(tool.serverToolName, {
        serverToolName: tool.serverToolName,
        actionPhrasePresent: draft?.actionPhrasePresent.trim() || null,
        actionPhrasePast: draft?.actionPhrasePast.trim() || null,
      });
    }
    await consoleOrpc.integrations.mcp.updateToolPhrases.call({
      organizationId,
      serverId,
      tools: Array.from(updatesByName.values()),
      manualToolNames: manualTools.map((tool) => tool.serverToolName),
    });
  }

  const scanDraftMutation = useMutation({
    mutationFn: () => {
      const parsed = testMcpServerRequestSchema.safeParse({
        organizationId,
        url,
        headers: buildHeadersFromForm({
          apiKeyStyle,
          authChoice,
          bearerToken,
          headerRows,
        }),
      });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Enter a valid server URL first"
        );
      }
      return consoleOrpc.integrations.mcp.scanDraft.call(parsed.data);
    },
    onSuccess: (result) => {
      setDraftTools(result.tools);
      const nextBaseline = buildInitialPhraseDrafts(result.tools);
      setPhraseDrafts((current) => {
        const next = { ...nextBaseline };
        for (const [toolName, draft] of Object.entries(current)) {
          if (next[toolName]) {
            next[toolName] = draft;
          }
        }
        return next;
      });
      setPhraseBaseline(nextBaseline);
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

  const connectOAuthDraftMutation = useMutation({
    mutationFn: async (oauthPopup: ReturnType<typeof openMcpOAuthPopup>) => {
      const parsed = createMcpServerRequestSchema.safeParse(getSharedFields());
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the integration details"
        );
      }

      let created: Awaited<
        ReturnType<typeof consoleOrpc.integrations.mcp.create.call>
      >;
      try {
        created = await consoleOrpc.integrations.mcp.create.call(parsed.data);
      } catch (error) {
        const existing = await findExistingIntegrationByName(
          parsed.data.name,
          error
        );
        if (!existing) {
          throw error;
        }
        toast.info(
          `You already have an integration named "${parsed.data.name}". Opening it.`
        );
        oauthPopup.close();
        router.push(`/${slug}/integrations/${existing.id}`);
        return existing;
      }
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });

      const editPath = `/${slug}/integrations/${created.id}`;
      try {
        const begun = await consoleOrpc.integrations.mcp.beginOAuth.call({
          organizationId,
          serverId: created.id,
          callbackPath: editPath,
        });
        oauthPopup.navigate(begun.authorizationUrl);
      } catch (error) {
        oauthPopup.close();
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not start the OAuth sign-in"
        );
        router.push(editPath);
      }
      return created;
    },
    onError: (error, oauthPopup) => {
      oauthPopup.close();
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = createMcpServerRequestSchema.safeParse(getSharedFields());
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the integration details"
        );
      }
      const created = await consoleOrpc.integrations.mcp.create.call(
        parsed.data
      );
      await saveToolPhrases(created.id).catch(() => {
        toast.error(
          "The integration was created, but the action phrases did not save. Add them again on the edit page."
        );
      });
      return created;
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
      await saveToolPhrases(server.id);
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
          ? "Saved. It goes live again once it clears review."
          : "Integration saved"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitReviewMutation = useMutation({
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
      await consoleOrpc.integrations.mcp.update.call(parsed.data);
      await saveToolPhrases(server.id);
      return await consoleOrpc.integrations.mcp.submitForReview.call({
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
      router.push(`${backHref}?submitted=true`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitReviewMutation.isPending;
  const isBusy =
    isSaving ||
    uploadingCount > 0 ||
    scanning ||
    scanDraftMutation.isPending ||
    connectOAuthDraftMutation.isPending;

  const canSubmitForReview =
    server?.storeStatus === "draft" || server?.storeStatus === "rejected";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !validateApiKeyInput()) {
      return;
    }
    if (canSubmitForReview) {
      submitReviewMutation.mutate();
      return;
    }
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  function handleSaveDraft() {
    if (isBusy || !validateApiKeyInput()) {
      return;
    }
    updateMutation.mutate();
  }

  const addManualTool = (serverToolName: string) => {
    const name = serverToolName.trim();
    if (!name) {
      return;
    }
    setManualTools((current) =>
      current.some((tool) => tool.serverToolName === name)
        ? current
        : [...current, createManualTool(name)]
    );
    setPhraseDrafts((current) =>
      current[name]
        ? current
        : {
            ...current,
            [name]: {
              serverToolName: name,
              actionPhrasePresent: "",
              actionPhrasePast: "",
            },
          }
    );
  };

  const removeManualTool = (serverToolName: string) => {
    setManualTools((current) =>
      current.filter((tool) => tool.serverToolName !== serverToolName)
    );
    setPhraseDrafts((current) => {
      const next = { ...current };
      delete next[serverToolName];
      return next;
    });
  };

  const importToolPhrases = (entries: ToolPhraseImportEntry[]) => {
    setPhraseDrafts((current) => {
      const next = { ...current };
      for (const entry of entries) {
        next[entry.serverToolName] = {
          serverToolName: entry.serverToolName,
          actionPhrasePresent: entry.actionPhrasePresent ?? "",
          actionPhrasePast: entry.actionPhrasePast ?? "",
        };
      }
      return next;
    });
    setManualTools((current) => {
      const known = new Set([
        ...current.map((tool) => tool.serverToolName),
        ...draftTools.map((tool) => tool.serverToolName),
        ...(tools ?? []).map((tool) => tool.serverToolName),
      ]);
      const additions = entries.flatMap((entry) =>
        known.has(entry.serverToolName)
          ? []
          : [createManualTool(entry.serverToolName)]
      );
      return additions.length > 0 ? [...current, ...additions] : current;
    });
    toast.success(
      entries.length === 1
        ? "Imported 1 tool phrase"
        : `Imported ${entries.length} tool phrases`
    );
  };

  async function findExistingIntegrationByName(name: string, error: unknown) {
    const isConflict =
      typeof error === "object" &&
      error !== null &&
      (("code" in error && error.code === "CONFLICT") ||
        ("status" in error && error.status === 409));
    if (!isConflict) {
      return null;
    }
    const list = await consoleOrpc.integrations.list
      .call({ organizationId })
      .catch(() => null);
    return list?.mcpServers.find((mcpServer) => mcpServer.name === name);
  }

  const scanDraft = () => {
    if (authChoice === "oauth") {
      const parsed = createMcpServerRequestSchema.safeParse(getSharedFields());
      if (!parsed.success) {
        toast.error(
          parsed.error.issues[0]?.message ?? "Add a server name and URL first"
        );
        return;
      }
      connectOAuthDraftMutation.mutate(openMcpOAuthPopup());
      return;
    }
    if (!validateApiKeyInput()) {
      return;
    }
    scanDraftMutation.mutate();
  };

  return {
    apiKeyStyle,
    addManualTool,
    draftScanning:
      scanDraftMutation.isPending || connectOAuthDraftMutation.isPending,
    draftTools,
    importToolPhrases,
    manualTools,
    removeManualTool,
    scanDraft,
    author,
    backHref,
    bannerUrl,
    bearerToken,
    brandColor,
    canSubmitForReview,
    description,
    handleSaveDraft,
    handleSubmit,
    headerRows,
    isBusy,
    isSaving,
    logoDarkUrl,
    logoLightUrl,
    name,
    phraseDrafts,
    setApiKeyStyle,
    setAuthChoice,
    setAuthor,
    setBannerUrl,
    setBearerToken,
    setBrandColor,
    setDescription,
    setHeaderRows,
    setLogoDarkUrl,
    setLogoLightUrl,
    setName,
    setPhraseBaseline,
    setPhraseDrafts,
    setScanning,
    setUploadingCount,
    setUrl,
    setWebsiteUrl,
    saveDraftPending: updateMutation.isPending,
    submitReviewPending: submitReviewMutation.isPending,
    url,
    websiteUrl,
    authChoice,
  };
}
