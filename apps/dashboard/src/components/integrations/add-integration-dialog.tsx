"use client";

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
import { useAsyncDebouncer } from "@tanstack/react-pacer";
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
import { dashboardOrpc } from "@/lib/orpc/query";
import { parseGitHubUrl } from "@/lib/utils/github";
import {
  type AddGitHubIntegrationFormValues,
  addGitHubIntegrationFormSchema,
  githubPersonalAccessTokenSchema,
} from "@/schemas/integrations";
import type {
  AddIntegrationDialogProps,
  GitHubIntegration,
  GitHubRepoInfo,
} from "@/types/integrations";
import { WebhookSetupDialog } from "./wehook-setup-dialog";

type ProbeStatus = "idle" | "loading" | "success" | "error" | "not_found";

interface ProbeResult {
  status: "public" | "private" | "not_found" | "unauthorized";
  defaultBranch?: string;
  description?: string;
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const [createdIntegration, setCreatedIntegration] =
    useState<GitHubIntegration | null>(null);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const initializedBranchReposRef = useRef<Set<string>>(new Set());

  const [probeStatus, setProbeStatus] = useState<ProbeStatus>("idle");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const probeRepo = useCallback(
    async (owner: string, repo: string, token?: string) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setProbeStatus("loading");

      try {
        if (controller.signal.aborted) {
          return null;
        }

        const data = (await dashboardOrpc.github.probeRepository.call({
          owner,
          repo,
          token: token || undefined,
        })) as ProbeResult;

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

        if (
          error instanceof Error &&
          (error.message === "Repository not found" ||
            error.message === "Repository access denied")
        ) {
          setProbeStatus("not_found");
          setTokenOpen(true);
          return null;
        }

        setProbeStatus("error");
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      initializedBranchReposRef.current = new Set();
      setHasAttemptedSubmit(false);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (values: AddGitHubIntegrationFormValues) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const parsed = parseGitHubUrl(values.repoUrl);
      if (!parsed) {
        throw new Error("Invalid GitHub repository URL");
      }

      const integration = await dashboardOrpc.integrations.create.call({
        organizationId,
        owner: parsed.owner,
        repo: parsed.repo,
        branch: values.branch?.trim() || null,
        token: values.token?.trim() || null,
      });

      return integration;
    },
    onSuccess: (integration: GitHubIntegration) => {
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.integrations.key(),
        });
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.onboarding.get.queryKey({
            input: { organizationId },
          }),
        });
      }
      toast.success("GitHub integration added successfully");
      setOpen(false);
      form.reset();
      setProbeStatus("idle");
      setTokenOpen(false);
      setHasAttemptedSubmit(false);
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

  const resetProbeState = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setRepoInfo(null);
    setProbeStatus("idle");
    form.setFieldValue("branch", "");
  }, [form]);

  const initializeBranch = useCallback(
    (owner: string, repo: string, defaultBranch: string) => {
      const repoKey = getRepoKey(owner, repo);

      if (initializedBranchReposRef.current.has(repoKey)) {
        return;
      }

      initializedBranchReposRef.current.add(repoKey);
      form.setFieldValue("branch", defaultBranch);
    },
    [form]
  );

  const repoProbeDebouncer = useAsyncDebouncer(
    async ({
      owner,
      repo,
      token,
    }: {
      owner: string;
      repo: string;
      token?: string;
    }) => {
      const result = await probeRepo(owner, repo, token);
      const latestParsed = parseGitHubUrl(form.getFieldValue("repoUrl"));
      const latestToken = form.getFieldValue("token")?.trim() || undefined;
      const isSameRepo =
        latestParsed?.owner === owner && latestParsed?.repo === repo;

      if (!isSameRepo || latestToken !== token || !result?.defaultBranch) {
        return;
      }

      initializeBranch(owner, repo, result.defaultBranch);
    },
    {
      wait: 400,
    }
  );

  useEffect(() => {
    return () => {
      repoProbeDebouncer.cancel();
      abortControllerRef.current?.abort();
    };
  }, [repoProbeDebouncer]);

  if (!organizationId) {
    return null;
  }

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
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
      <ResponsiveDialog onOpenChange={setOpen} open={open}>
        {triggerElement}
        <ResponsiveDialogContent className="sm:max-w-[520px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-2xl">
              Add GitHub Integration
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Connect a GitHub repository to enable AI-powered outputs like
              changelogs, blog posts, and tweets.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHasAttemptedSubmit(true);
              form.handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <form.Field
                name="repoUrl"
                validators={{
                  onSubmit: addGitHubIntegrationFormSchema.shape.repoUrl,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel>GitHub Repository</FieldLabel>
                    <Input
                      disabled={mutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        const parsed = parseGitHubUrl(nextValue);

                        setHasAttemptedSubmit(false);
                        field.handleChange(nextValue);

                        if (!nextValue.trim()) {
                          repoProbeDebouncer.cancel();
                          resetProbeState();
                          return;
                        }

                        if (!parsed) {
                          repoProbeDebouncer.cancel();
                          resetProbeState();
                          return;
                        }

                        setRepoInfo(parsed);
                        repoProbeDebouncer.maybeExecute({
                          owner: parsed.owner,
                          repo: parsed.repo,
                          token:
                            form.getFieldValue("token")?.trim() || undefined,
                        });
                      }}
                      placeholder="https://github.com/facebook/react or facebook/react"
                      value={field.state.value}
                    />
                    {hasAttemptedSubmit &&
                    field.state.meta.errors.length > 0 ? (
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
                    <form.Field
                      name="token"
                      validators={{
                        onSubmit: ({ value }) => {
                          const trimmed = value.trim();

                          if (!trimmed) {
                            return undefined;
                          }

                          const validationResult =
                            githubPersonalAccessTokenSchema.safeParse(trimmed);

                          if (validationResult.success) {
                            return undefined;
                          }

                          return validationResult.error.issues[0]?.message;
                        },
                      }}
                    >
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
                                      initializeBranch(
                                        repoInfo.owner,
                                        repoInfo.repo,
                                        result.defaultBranch
                                      );
                                    }
                                  })
                                  .catch(() => {
                                    return null;
                                  });
                              }
                            }}
                            onChange={(e) => {
                              setHasAttemptedSubmit(false);
                              field.handleChange(e.target.value);
                            }}
                            placeholder="ghp_... (leave empty for public repos)"
                            value={field.state.value}
                          />
                          {hasAttemptedSubmit &&
                          field.state.meta.errors.length > 0 ? (
                            <p className="mt-1 text-destructive text-sm">
                              {typeof field.state.meta.errors[0] === "string"
                                ? field.state.meta.errors[0]
                                : ((
                                    field.state.meta.errors[0] as unknown as {
                                      message?: string;
                                    }
                                  )?.message ?? "Invalid value")}
                            </p>
                          ) : null}
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
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose
                disabled={mutation.isPending}
                render={<Button variant="outline" />}
              >
                Cancel
              </ResponsiveDialogClose>
              <form.Subscribe selector={(state) => [state.canSubmit]}>
                {([canSubmit]) => (
                  <Button
                    disabled={!canSubmit || mutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      setHasAttemptedSubmit(true);
                      form.handleSubmit();
                    }}
                    type="button"
                  >
                    {mutation.isPending ? "Adding..." : "Add Integration"}
                  </Button>
                )}
              </form.Subscribe>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
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
