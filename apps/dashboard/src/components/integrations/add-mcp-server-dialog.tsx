"use client";

import {
  Alert01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  CpuIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import type React from "react";
import { isValidElement, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  buildMcpHeaders,
  getMcpFormErrorMessage,
} from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type AddMcpServerFormValues,
  addMcpServerFormFieldsSchema,
  addMcpServerFormSchema,
  type CreateMcpServerRequest,
  createMcpServerRequestSchema,
  testMcpServerRequestSchema,
} from "@/schemas/integrations";
import type {
  AddMcpServerDialogProps,
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
  const [authOpen, setAuthOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<McpTestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const openRef = useRef(open);
  const testRequestIdRef = useRef(0);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  function submitCreate(value: AddMcpServerFormValues) {
    const payload = createMcpServerRequestSchema.safeParse({
      organizationId,
      name: value.name,
      url: value.url,
      description: value.description.trim() || null,
      headers: buildMcpHeaders(value),
    });

    if (!payload.success) {
      toast.error(
        payload.error.issues[0]?.message ?? "Check the MCP server details"
      );
      return;
    }

    createMutation.mutate(payload.data);
  }

  const form = useForm({
    defaultValues: {
      name: "",
      url: "",
      description: "",
      headerName: "",
      headerValue: "",
    },
    validators: {
      onSubmit: addMcpServerFormSchema,
    },
    onSubmit: ({ value }) => {
      submitCreate(value);
    },
  });

  const resetForm = () => {
    testRequestIdRef.current += 1;
    form.reset();
    setAuthOpen(false);
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
      const formValue = addMcpServerFormSchema.safeParse(value);
      if (!formValue.success) {
        throw new Error(
          formValue.error.issues[0]?.message ?? "Check the MCP server details"
        );
      }

      const payload = testMcpServerRequestSchema.safeParse({
        organizationId,
        url: formValue.data.url,
        headers: buildMcpHeaders(formValue.data),
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

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

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
      <ResponsiveDialogContent className="sm:max-w-[32.5rem]">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
              <HugeiconsIcon className="size-5" icon={CpuIcon} />
            </span>
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4 py-4">
            <form.Field
              name="name"
              validators={{ onChange: addMcpServerFormFieldsSchema.shape.name }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="mcp-name">Name</FieldLabel>
                  <Input
                    autoComplete="off"
                    id="mcp-name"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="My Custom Server"
                    value={field.state.value}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="text-destructive text-sm">
                      {getMcpFormErrorMessage(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <form.Field
              name="url"
              validators={{ onChange: addMcpServerFormFieldsSchema.shape.url }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="mcp-url">Server URL</FieldLabel>
                  <Input
                    autoComplete="off"
                    id="mcp-url"
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      invalidateTestResult();
                    }}
                    placeholder="https://example.com/mcp"
                    value={field.state.value}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="text-destructive text-sm">
                      {getMcpFormErrorMessage(field.state.meta.errors[0])}
                    </p>
                  ) : (
                    <FieldDescription>
                      The HTTPS endpoint where your MCP server is reachable.
                    </FieldDescription>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field
              name="description"
              validators={{
                onChange: addMcpServerFormFieldsSchema.shape.description,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="mcp-description">
                    Use case description
                    <span className="font-normal text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Textarea
                    id="mcp-description"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="What tools or context should Notra use this server for?"
                    rows={3}
                    value={field.state.value}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="text-destructive text-sm">
                      {getMcpFormErrorMessage(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </Field>
              )}
            </form.Field>

            <Collapsible onOpenChange={setAuthOpen} open={authOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 font-medium text-sm">
                <HugeiconsIcon
                  className={`size-4 transition-transform ${authOpen ? "" : "-rotate-90"}`}
                  icon={ArrowDown01Icon}
                />
                Headers
                <span className="font-normal text-muted-foreground text-xs">
                  (optional)
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                  <form.Field
                    name="headerName"
                    validators={{
                      onChange: addMcpServerFormFieldsSchema.shape.headerName,
                    }}
                  >
                    {(field) => (
                      <Field>
                        <Input
                          autoComplete="off"
                          id="mcp-header-name"
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(event.target.value);
                            invalidateTestResult();
                          }}
                          placeholder="Authorization"
                          value={field.state.value}
                        />
                        {field.state.meta.errors[0] ? (
                          <p className="text-destructive text-sm">
                            {getMcpFormErrorMessage(field.state.meta.errors[0])}
                          </p>
                        ) : null}
                      </Field>
                    )}
                  </form.Field>
                  <form.Field
                    name="headerValue"
                    validators={{
                      onChange: addMcpServerFormFieldsSchema.shape.headerValue,
                    }}
                  >
                    {(field) => (
                      <Field>
                        <Input
                          autoComplete="off"
                          id="mcp-header-value"
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(event.target.value);
                            invalidateTestResult();
                          }}
                          placeholder="Bearer token"
                          type="password"
                          value={field.state.value}
                        />
                        {field.state.meta.errors[0] ? (
                          <p className="text-destructive text-sm">
                            {getMcpFormErrorMessage(field.state.meta.errors[0])}
                          </p>
                        ) : null}
                      </Field>
                    )}
                  </form.Field>
                </div>
                <FieldDescription className="mt-2">
                  Stored encrypted and sent when Notra calls your server.
                </FieldDescription>
              </CollapsibleContent>
            </Collapsible>

            {testStatus !== "idle" && (
              <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm">
                {testStatus === "testing" && (
                  <>
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Testing connection...
                    </span>
                  </>
                )}
                {testStatus === "success" && (
                  <>
                    <HugeiconsIcon
                      className="size-4 text-emerald-600 dark:text-emerald-400"
                      icon={CheckmarkCircle02Icon}
                    />
                    <span>{testMessage || "Connection successful"}</span>
                  </>
                )}
                {testStatus === "error" && (
                  <>
                    <HugeiconsIcon
                      className="size-4 text-destructive"
                      icon={Alert01Icon}
                    />
                    <span className="text-destructive">
                      {testMessage || "Could not reach the server"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              className="sm:mr-auto"
              disabled={testMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                const requestId = testRequestIdRef.current + 1;
                testRequestIdRef.current = requestId;
                testMutation.mutate({
                  requestId,
                  value: { ...form.state.values },
                });
              }}
              type="button"
              variant="outline"
            >
              {testMutation.isPending ? "Testing..." : "Test Connection"}
            </Button>
            <ResponsiveDialogClose
              disabled={createMutation.isPending}
              render={<Button variant="outline" />}
            >
              Cancel
            </ResponsiveDialogClose>
            <form.Subscribe selector={(state) => [state.canSubmit]}>
              {([canSubmit]) => (
                <Button
                  disabled={!canSubmit || createMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                  }}
                  type="button"
                >
                  {createMutation.isPending ? "Adding..." : "Add Server"}
                </Button>
              )}
            </form.Subscribe>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
