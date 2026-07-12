"use client";

import { CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { isValidElement, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { McpAuthenticationFields } from "@/components/integrations/mcp-authentication-fields";
import { McpConnectionTestStatus } from "@/components/integrations/mcp-connection-test-status";
import { McpDialogFooter } from "@/components/integrations/mcp-dialog-footer";
import { McpServerDetailsFields } from "@/components/integrations/mcp-server-details-fields";
import { useMcpServerForm } from "@/lib/hooks/use-mcp-server-form";
import {
  buildMcpHeaders,
  buildMcpUrl,
  getMcpFaviconUrl,
} from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type AddMcpServerFormValues,
  beginMcpOAuthRequestSchema,
  type CreateMcpServerRequest,
  createMcpServerRequestSchema,
  testMcpServerRequestSchema,
} from "@/schemas/integrations";
import type {
  AddMcpServerDialogProps,
  BeginMcpOAuthRequest,
  McpDialogStatus,
  McpTestStatus,
} from "@/types/integrations/mcp";

export function AddMcpServerDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  organizationId,
  onSuccess,
  trigger,
}: AddMcpServerDialogProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [headerRowIds, setHeaderRowIds] = useState<string[]>(() => [
    crypto.randomUUID(),
  ]);
  const [testStatus, setTestStatus] = useState<McpTestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const openRef = useRef(open);
  const testRequestIdRef = useRef(0);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const form = useMcpServerForm(submitCreate);

  const resetForm = () => {
    testRequestIdRef.current += 1;
    form.reset();
    setHeaderRowIds([crypto.randomUUID()]);
    setTestStatus("idle");
    setTestMessage("");
  };

  const invalidateTestResult = () => {
    testRequestIdRef.current += 1;
    setTestStatus("idle");
    setTestMessage("");
  };

  const testMutation = useMutation({
    mutationFn: async ({
      requestId,
      value,
    }: {
      requestId: number;
      value: AddMcpServerFormValues;
    }) => {
      const payload = testMcpServerRequestSchema.safeParse({
        organizationId,
        url: buildMcpUrl(value.url),
        headers: value.authType === "headers" ? buildMcpHeaders(value) : {},
      });

      if (!payload.success) {
        throw new Error(
          payload.error.issues[0]?.message ?? "Check the MCP server details"
        );
      }

      const result = await dashboardOrpc.integrations.mcp.test.call(
        payload.data
      );
      return { requestId, result };
    },
    onMutate: () => {
      setTestStatus("testing");
      setTestMessage("");
    },
    onSuccess: ({ requestId, result }) => {
      if (!openRef.current || requestId !== testRequestIdRef.current) {
        return;
      }
      setTestStatus(result.success ? "success" : "error");
      setTestMessage(result.message);
    },
    onError: (error, variables) => {
      if (
        !openRef.current ||
        variables.requestId !== testRequestIdRef.current
      ) {
        return;
      }
      setTestStatus("error");
      setTestMessage(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateMcpServerRequest) =>
      dashboardOrpc.integrations.mcp.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.mcp.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("MCP server added");
      onSuccess?.();
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const beginOAuthMutation = useMutation({
    mutationFn: async (input: BeginMcpOAuthRequest) =>
      dashboardOrpc.integrations.mcp.beginOAuth.call(input),
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function submitCreate(value: AddMcpServerFormValues) {
    if (value.authType === "oauth") {
      const oauthPayload = beginMcpOAuthRequestSchema.safeParse({
        organizationId,
        name: value.name,
        url: buildMcpUrl(value.url),
        description: value.description.trim() || null,
        callbackPath: window.location.pathname,
      });
      if (!oauthPayload.success) {
        toast.error(
          oauthPayload.error.issues[0]?.message ??
            "Check the MCP server details"
        );
        return;
      }
      beginOAuthMutation.mutate(oauthPayload.data);
      return;
    }

    const payload = createMcpServerRequestSchema.safeParse({
      authType: value.authType,
      organizationId,
      name: value.name,
      url: buildMcpUrl(value.url),
      description: value.description.trim() || null,
      headers: value.authType === "headers" ? buildMcpHeaders(value) : {},
    });

    if (!payload.success) {
      toast.error(
        payload.error.issues[0]?.message ?? "Check the MCP server details"
      );
      return;
    }

    createMutation.mutate(payload.data);
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    form.handleSubmit();
  }

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

  let dialogStatus: McpDialogStatus = "idle";
  if (testMutation.isPending) {
    dialogStatus = "testing";
  }
  if (beginOAuthMutation.isPending) {
    dialogStatus = "redirecting";
  }
  if (createMutation.isPending) {
    dialogStatus = "creating";
  }

  return (
    <ResponsiveDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        setOpen(nextOpen);
      }}
      open={open}
    >
      {triggerElement}
      <ResponsiveDialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-[32.5rem] [&>*]:min-w-0">
        <ResponsiveDialogHeader>
          <div className="flex items-start gap-3">
            <form.Subscribe selector={(state) => state.values.url}>
              {(url) => (
                <Avatar className="size-9 shrink-0 rounded-lg bg-muted after:hidden">
                  <AvatarImage
                    className="rounded-lg"
                    src={getMcpFaviconUrl(buildMcpUrl(url))}
                  />
                  <AvatarFallback className="rounded-lg bg-transparent text-foreground">
                    <HugeiconsIcon className="size-5" icon={CpuIcon} />
                  </AvatarFallback>
                </Avatar>
              )}
            </form.Subscribe>
            <div>
              <ResponsiveDialogTitle className="text-xl">
                Add MCP Server
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Connect a custom Model Context Protocol server to extend Notra
                with your own tools and context.
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4 py-4">
            <McpServerDetailsFields
              form={form}
              invalidateTestResult={invalidateTestResult}
            />

            <McpAuthenticationFields
              form={form}
              headerRowIds={headerRowIds}
              invalidateTestResult={invalidateTestResult}
              setHeaderRowIds={setHeaderRowIds}
            />

            <McpConnectionTestStatus
              message={testMessage}
              status={testStatus}
            />
          </div>

          <ResponsiveDialogFooter>
            <form.Subscribe
              selector={(state) => ({
                authType: state.values.authType,
                canSubmit: state.canSubmit,
              })}
            >
              {({ authType, canSubmit }) => (
                <McpDialogFooter
                  authType={authType}
                  canSubmit={canSubmit}
                  onCancel={resetForm}
                  onTest={async () => {
                    const urlErrors = await form.validateField("url", "change");
                    if (urlErrors.length > 0) {
                      return;
                    }
                    const requestId = testRequestIdRef.current + 1;
                    testRequestIdRef.current = requestId;
                    testMutation.mutate({
                      requestId,
                      value: { ...form.state.values },
                    });
                  }}
                  status={dialogStatus}
                />
              )}
            </form.Subscribe>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
