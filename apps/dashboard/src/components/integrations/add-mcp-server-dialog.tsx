"use client";

import {
  Alert01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  CpuIcon,
  MinusSignIcon,
  PlusSignIcon,
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
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
  buildMcpUrl,
  getMcpFaviconUrl,
  getMcpFormErrorMessage,
} from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type AddMcpServerFormValues,
  addMcpServerFormFieldsSchema,
  addMcpServerFormSchema,
  type CreateMcpServerRequest,
  createMcpServerRequestSchema,
  MAX_MCP_HEADERS,
  mcpHeaderNameSchema,
  mcpHeaderValueSchema,
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

  function submitCreate(value: AddMcpServerFormValues) {
    const payload = createMcpServerRequestSchema.safeParse({
      organizationId,
      name: value.name,
      url: buildMcpUrl(value.url),
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
      headers: [{ name: "", value: "" }],
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
        headers: buildMcpHeaders(value),
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
              validators={{
                onBlur: addMcpServerFormFieldsSchema.shape.name,
                onChange: addMcpServerFormFieldsSchema.shape.name,
                onSubmit: addMcpServerFormFieldsSchema.shape.name,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="mcp-name">
                    Name <span className="-ml-1 text-destructive">*</span>
                  </FieldLabel>
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
              validators={{
                onBlur: addMcpServerFormFieldsSchema.shape.url,
                onChange: addMcpServerFormFieldsSchema.shape.url,
                onSubmit: addMcpServerFormFieldsSchema.shape.url,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="mcp-url">
                    Server URL <span className="-ml-1 text-destructive">*</span>
                  </FieldLabel>
                  <div
                    className={`flex w-full flex-row items-center rounded-md border transition-colors focus-within:border-ring focus-within:ring-ring/50 ${field.state.meta.errors.length > 0 ? "border-destructive" : "border-border"}`}
                  >
                    <label
                      className="border-border border-r px-2.5 py-1.5 text-muted-foreground text-sm transition-colors"
                      htmlFor="mcp-url"
                    >
                      https://
                    </label>
                    <input
                      autoComplete="off"
                      className="flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      id="mcp-url"
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        invalidateTestResult();
                      }}
                      placeholder="mcp.example.com/mcp"
                      value={field.state.value}
                    />
                  </div>
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
              <div className="flex items-center gap-2">
                <CollapsibleTrigger className="flex flex-1 items-center gap-2 font-medium text-sm">
                  <HugeiconsIcon
                    className={`size-4 transition-transform ${authOpen ? "" : "-rotate-90"}`}
                    icon={ArrowDown01Icon}
                  />
                  Headers
                  <form.Subscribe
                    selector={(state) => state.values.headers.length}
                  >
                    {(count) => (
                      <span className="font-normal text-muted-foreground text-xs">
                        ({count}/{MAX_MCP_HEADERS})
                      </span>
                    )}
                  </form.Subscribe>
                </CollapsibleTrigger>
                <form.Field mode="array" name="headers">
                  {(headersField) => (
                    <Button
                      aria-label="Add header"
                      disabled={
                        headersField.state.value.length >= MAX_MCP_HEADERS
                      }
                      onClick={() => {
                        headersField.pushValue({ name: "", value: "" });
                        setHeaderRowIds((ids) => [...ids, crypto.randomUUID()]);
                        setAuthOpen(true);
                      }}
                      size="icon-sm"
                      type="button"
                      variant="outline"
                    >
                      <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
                    </Button>
                  )}
                </form.Field>
              </div>
              <CollapsibleContent>
                <form.Field mode="array" name="headers">
                  {(headersField) => (
                    <div className="space-y-2 pt-2">
                      {headersField.state.value.map((_, index) => (
                        <div
                          className="flex items-start gap-2"
                          key={headerRowIds[index]}
                        >
                          <form.Field
                            name={`headers[${index}].name`}
                            validators={{ onChange: mcpHeaderNameSchema }}
                          >
                            {(field) => (
                              <Field className="flex-1">
                                <Input
                                  autoComplete="off"
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
                                    {getMcpFormErrorMessage(
                                      field.state.meta.errors[0]
                                    )}
                                  </p>
                                ) : null}
                              </Field>
                            )}
                          </form.Field>
                          <form.Field
                            name={`headers[${index}].value`}
                            validators={{ onChange: mcpHeaderValueSchema }}
                          >
                            {(field) => (
                              <Field className="flex-[1.3]">
                                <Input
                                  autoComplete="off"
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
                                    {getMcpFormErrorMessage(
                                      field.state.meta.errors[0]
                                    )}
                                  </p>
                                ) : null}
                              </Field>
                            )}
                          </form.Field>
                          <Button
                            aria-label="Remove header"
                            onClick={() => {
                              headersField.removeValue(index);
                              setHeaderRowIds((ids) =>
                                ids.filter((_id, idx) => idx !== index)
                              );
                              invalidateTestResult();
                            }}
                            size="icon-sm"
                            type="button"
                            variant="outline"
                          >
                            <HugeiconsIcon
                              className="size-4"
                              icon={MinusSignIcon}
                            />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </form.Field>
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
              onClick={async (event) => {
                event.preventDefault();
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
