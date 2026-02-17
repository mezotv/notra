"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@notra/ui/components/ui/alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
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
  useReducer,
  useRef,
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

interface AddIntegrationState {
  internalOpen: boolean;
  createdIntegration: GitHubIntegration | null;
  showWebhookDialog: boolean;
  initializedBranchRepos: Set<string>;
  probeStatus: ProbeStatus;
  tokenOpen: boolean;
  repoInfo: GitHubRepoInfo | null;
}

function getRepoKey(owner: string, repo: string) {
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
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
  const [state, setState] = useReducer(
    (prev: AddIntegrationState, next: Partial<AddIntegrationState>) => ({
      ...prev,
      ...next,
    }),
    {
      internalOpen: false,
      createdIntegration: null,
      showWebhookDialog: false,
      initializedBranchRepos: new Set(),
      probeStatus: "idle",
      tokenOpen: false,
      repoInfo: null,
    }
  );
  const {
    internalOpen,
    createdIntegration,
    showWebhookDialog,
    initializedBranchRepos,
    probeStatus,
    tokenOpen,
    repoInfo,
  } = state;

  const open = controlledOpen ?? internalOpen;
  const setOpen =
    controlledOnOpenChange ??
    ((nextOpen: boolean) => setState({ internalOpen: nextOpen }));
  const queryClient = useQueryClient();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setState({ initializedBranchRepos: new Set() });
      }
    },
    [setOpen]
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const probeRepo = useCallback(
    async (owner: string, repo: string, token?: string) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({ probeStatus: "loading" });

      return fetch("/api/github/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, token: token || undefined }),
        signal: controller.signal,
      })
        .then(async (response) => {
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
              setState({ probeStatus: "not_found", tokenOpen: true });
              return null;
            }
            setState({ probeStatus: "error" });
            return null;
          }

          const data = payload as ProbeResult;

          if (data.status === "not_found" || data.status === "unauthorized") {
            setState({ probeStatus: "not_found", tokenOpen: true });
            return data;
          }

          setState({ probeStatus: "success" });

          if (data.status === "private") {
            setState({ tokenOpen: true });
          }

          return data;
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return null;
          }
          setState({ probeStatus: "error" });
          return null;
        });
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
      setState({
        probeStatus: "idle",
        tokenOpen: false,
        createdIntegration: integration,
        showWebhookDialog: true,
      });
      onSuccess?.();
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
      setState({ showWebhookDialog: false, createdIntegration: null });
    }
  };

  const firstRepository = createdIntegration?.repositories?.[0];

  return (
    <>
      <AlertDialog onOpenChange={handleOpenChange} open={open}>
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
          <form onSubmit={form.handleSubmit}>
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
                      setState({ repoInfo: null, probeStatus: "idle" });
                      form.setFieldValue("branch", "");
                      return;
                    }
                    const parsed = parseGitHubUrl(value);
                    if (parsed) {
                      setState({ repoInfo: parsed });
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
                          const repoKey = getRepoKey(parsed.owner, parsed.repo);

                          if (
                            isSameRepo &&
                            result?.defaultBranch &&
                            !initializedBranchRepos.has(repoKey)
                          ) {
                            form.setFieldValue("branch", result.defaultBranch);
                            const next = new Set(initializedBranchRepos);
                            next.add(repoKey);
                            setState({ initializedBranchRepos: next });
                          }
                        })
                        .catch(() => {
                          return null;
                        });
                    } else {
                      abortControllerRef.current?.abort();
                      abortControllerRef.current = null;
                      setState({ repoInfo: null, probeStatus: "idle" });
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

              <Collapsible
                onOpenChange={(nextOpen) => setState({ tokenOpen: nextOpen })}
                open={tokenOpen}
              >
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
                                    const repoKey = getRepoKey(
                                      repoInfo.owner,
                                      repoInfo.repo
                                    );
                                    if (
                                      result?.defaultBranch &&
                                      !initializedBranchRepos.has(repoKey)
                                    ) {
                                      form.setFieldValue(
                                        "branch",
                                        result.defaultBranch
                                      );
                                      const next = new Set(
                                        initializedBranchRepos
                                      );
                                      next.add(repoKey);
                                      setState({ initializedBranchRepos: next });
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
                  <Button
                    disabled={!canSubmit || mutation.isPending}
                    type="submit"
                  >
                    {mutation.isPending ? "Adding..." : "Add Integration"}
                  </Button>
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
