"use client";

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
import { consoleOrpc } from "@/lib/orpc/query";
import {
  createMcpServerRequestSchema,
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

  async function saveChangedToolPhrases(serverId: string) {
    const changedTools = getChangedToolPhraseDrafts(
      phraseDrafts,
      phraseBaseline
    );
    if (changedTools.length > 0) {
      await consoleOrpc.integrations.mcp.updateToolPhrases.call({
        organizationId,
        serverId,
        tools: changedTools,
      });
    }
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
      await saveChangedToolPhrases(server.id);
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
      await saveChangedToolPhrases(server.id);
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
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitReviewMutation.isPending;
  const isBusy = isSaving || uploadingCount > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !validateApiKeyInput()) {
      return;
    }
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  function handleSubmitReview() {
    if (isBusy || !validateApiKeyInput()) {
      return;
    }
    submitReviewMutation.mutate();
  }

  return {
    apiKeyStyle,
    author,
    backHref,
    bannerUrl,
    bearerToken,
    brandColor,
    description,
    handleSubmit,
    handleSubmitReview,
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
    setUploadingCount,
    setUrl,
    setWebsiteUrl,
    submitReviewPending: submitReviewMutation.isPending,
    url,
    websiteUrl,
    authChoice,
  };
}
