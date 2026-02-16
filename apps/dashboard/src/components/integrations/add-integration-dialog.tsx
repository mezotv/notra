"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@notra/ui/components/ui/alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import {
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { parseGitHubUrl } from "@/lib/utils/github";
import {
  type AddGitHubIntegrationFormValues,
  addGitHubIntegrationFormSchema,
} from "@/schemas/integrations";
import type {
  AddIntegrationDialogProps,
  GitHubIntegration,
  GitHubRepoInfo,
} from "@/types/integrations";
import { QUERY_KEYS } from "@/utils/query-keys";
import { WebhookSetupDialog } from "./wehook-setup-dialog";

type ProbeStatus = "idle" | "loading" | "success" | "error" | "not_found";

interface ProbeResult {
  status: "public" | "private" | "not_found" | "unauthorized";
  defaultBranch?: string;
  description?: string;
}

export function AddIntegrationDialog({
  organizationId: propOrganizationId,
  organizationSlug: propOrganizationSlug,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: AddIntegrationDialogProps) {
  const router = useRouter();
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = propOrganizationId ?? activeOrganization?.id;
  const organizationSlug = propOrganizationSlug ?? activeOrganization?.slug;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const [createdIntegration, setCreatedIntegration] =
    useState<GitHubIntegration | null>(null);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);

  const [probeStatus, setProbeStatus] = useState<ProbeStatus>("idle");
  const [tokenOpen, setTokenOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const probeRepo = useCallback(
    async (owner: string, repo: string, token?: string) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setProbeStatus("loading");

      try {
        const response = await fetch("/api/github/probe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo, token: token || undefined }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return null;
        }

        const payload: unknown = await response.json();

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ) {
            setProbeStatus("not_found");
            setTokenOpen(true);
            return null;
          }
          setProbeStatus("error");
          return null;
        }

        const data = payload as ProbeResult;

        if (data.status === "not_found" || data.status === "unauthorized") {
          setProbeStatus("not_found");
          setTokenOpen(true);
          return data;
        }

        setProbeStatus("success");

        if (data.status === "private") {
          setTokenOpen(true);
        }

        return data;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return null;
        }
        setProbeStatus("error");
        return null;
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (values: AddGitHubIntegrationFormValues) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const parsed = parseGitHubUrl(values.repoUrl);
      if (!parsed) {
        throw new Error("Invalid GitHub repository URL");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/integrations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: parsed.owner,
            repo: parsed.repo,
            branch: values.branch?.trim() || null,
            token: values.token?.trim() || null,
            type: "github" as const,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create integration");
      }

      return data;
    },
    onSuccess: (integration: GitHubIntegration) => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.INTEGRATIONS.all(organizationId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
        });
      }
      toast.success("GitHub integration added successfully");
      setOpen(false);
      form.reset();
      setProbeStatus("idle");
      setTokenOpen(false);
      onSuccess?.();

      setCreatedIntegration(integration);
      setShowWebhookDialog(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      repoUrl: "",
      branch: "",
      token: "",
    },
    onSubmit: ({ value }) => {
      const validationResult = addGitHubIntegrationFormSchema.safeParse(value);
      if (!validationResult.success) {
        return;
      }
      mutation.mutate(validationResult.data);
    },
  });

  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);

  if (!organizationId) {
    return null;
  }

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <AlertDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

  const handleWebhookDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (organizationSlug && createdIntegration?.id) {
        router.push(
          `/${organizationSlug}/integrations/github/${createdIntegration.id}`
        );
      }
      setShowWebhookDialog(false);
      setCreatedIntegration(null);
    }
  };

  const firstRepository = createdIntegration?.repositories?.[0];

  return (
    <>
      <AlertDialog onOpenChange={setOpen} open={open}>
        {triggerElement}
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              Add GitHub Integration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Connect a GitHub repository to enable AI-powered outputs like
              changelogs, blog posts, and tweets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <form.Field
                name="repoUrl"
                validators={{
                  onChange: addGitHubIntegrationFormSchema.shape.repoUrl,
                  onChangeAsyncDebounceMs: 300,
                  onChangeAsync: ({ value }) => {
                    if (!value.trim()) {
                      abortControllerRef.current?.abort();
                      abortControllerRef.current = null;
                      setRepoInfo(null);
                      setProbeStatus("idle");
                      form.setFieldValue("branch", "");
                      return;
                    }
                    const parsed = parseGitHubUrl(value);
                    if (parsed) {
                      setRepoInfo(parsed);
                      const currentToken = form.getFieldValue("token");
                      probeRepo(
                        parsed.owner,
                        parsed.repo,
                        currentToken || undefined
                      )
                        .then((result) => {
                          const latestParsed = parseGitHubUrl(
                            form.getFieldValue("repoUrl")
                          );
                          const isSameRepo =
                            latestParsed?.owner === parsed.owner &&
                            latestParsed?.repo === parsed.repo;

                          if (isSameRepo && result?.defaultBranch) {
                            form.setFieldValue("branch", result.defaultBranch);
                          }
                        })
                        .catch(() => {
                          return null;
                        });
                    } else {
                      abortControllerRef.current?.abort();
                      abortControllerRef.current = null;
                      setRepoInfo(null);
                      setProbeStatus("idle");
                      form.setFieldValue("branch", "");
                    }
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel>GitHub Repository</FieldLabel>
                    <Input
                      disabled={mutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://github.com/facebook/react or facebook/react"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <p className="mt-1 text-destructive text-sm">
                        {typeof field.state.meta.errors[0] === "string"
                          ? field.state.meta.errors[0]
                          : ((
                              field.state.meta.errors[0] as { message?: string }
                            )?.message ?? "Invalid value")}
                      </p>
                    ) : null}
                    {repoInfo ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className="font-mono text-xs"
                          variant="secondary"
                        >
                          {repoInfo.owner}/{repoInfo.repo}
                        </Badge>
                        <a
                          className="text-primary text-xs hover:underline"
                          href={repoInfo.fullUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View on GitHub
                        </a>
                      </div>
                    ) : null}
                  </Field>
                )}
              </form.Field>

              <form.Field name="branch">
                {(field) => (
                  <Field>
                    <FieldLabel>Default Branch</FieldLabel>
                    <Input
                      disabled={mutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={
                        probeStatus === "loading" ? "Detecting..." : "main"
                      }
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>

              <Collapsible onOpenChange={setTokenOpen} open={tokenOpen}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 font-medium text-sm">
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${tokenOpen ? "" : "-rotate-90"}`}
                  />
                  Personal Access Token
                  <span className="font-normal text-muted-foreground text-xs">
                    (optional)
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2">
                    <form.Field name="token">
                      {(field) => (
                        <Field>
                          {probeStatus === "not_found" ? (
                            <p className="mb-2 text-amber-600 text-xs dark:text-amber-400">
                              This repository appears to be private or not
                              found. A token is required to access it.
                            </p>
                          ) : (
                            <p className="mb-2 text-muted-foreground text-xs">
                              Only required for private repositories. Public
                              repos work without a token.
                            </p>
                          )}
                          <Input
                            disabled={mutation.isPending}
                            onBlur={(e) => {
                              field.handleBlur();
                              const token = e.target.value.trim();
                              if (
                                token &&
                                repoInfo &&
                                probeStatus === "not_found"
                              ) {
                                probeRepo(repoInfo.owner, repoInfo.repo, token)
                                  .then((result) => {
                                    if (result?.defaultBranch) {
                                      form.setFieldValue(
                                        "branch",
                                        result.defaultBranch
                                      );
                                    }
                                  })
                                  .catch(() => {
                                    return null;
                                  });
                              }
                            }}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="ghp_... (leave empty for public repos)"
                            value={field.state.value}
                          />
                          <p className="mt-1 text-muted-foreground text-xs">
                            <a
                              className="text-primary hover:underline"
                              href="https://github.com/settings/tokens/new?scopes=repo&description=Notra%20Integration"
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              Generate a token on GitHub
                            </a>{" "}
                            with <code className="text-xs">repo</code> scope
                          </p>
                        </Field>
                      )}
                    </form.Field>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <form.Subscribe selector={(state) => [state.canSubmit]}>
                {([canSubmit]) => (
                  <AlertDialogAction
                    disabled={!canSubmit || mutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      form.handleSubmit();
                    }}
                    type="button"
                  >
                    {mutation.isPending ? "Adding..." : "Add Integration"}
                  </AlertDialogAction>
                )}
              </form.Subscribe>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      {firstRepository && organizationId ? (
        <WebhookSetupDialog
          onOpenChange={handleWebhookDialogClose}
          open={showWebhookDialog}
          organizationId={organizationId}
          owner={firstRepository.owner}
          repo={firstRepository.repo}
          repositoryId={firstRepository.id}
        />
      ) : null}
    </>
  );
}
