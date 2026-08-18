"use client";

import { ArrowLeft02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { Textarea } from "@notra/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { DiffView } from "@/components/content/diff-view";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { SKILL_EDITOR_VIEWS } from "@/constants/skills";
import { dashboardOrpc } from "@/lib/orpc/query";
import { updateSkillSchema } from "@/schemas/skills";
import type { SkillDetailPageClientProps } from "@/types/skills/page";

export default function PageClient({ slug, name }: SkillDetailPageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(SKILL_EDITOR_VIEWS).withDefault("edit")
  );

  const [original, setOriginal] = useState<{
    name: string;
    description: string;
    content: string;
  } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const saveToastIdRef = useRef<string | number | null>(null);
  const handleSaveRef = useRef<(() => void) | null>(null);
  const handleDiscardRef = useRef<(() => void) | null>(null);

  const { data: skill, isPending } = useQuery({
    ...dashboardOrpc.skills.getByName.queryOptions({
      input: { organizationId: organizationId ?? "", name },
    }),
    enabled: !!organizationId,
  });

  if (skill && !original) {
    setOriginal({
      name: skill.name,
      description: skill.description,
      content: skill.content,
    });
    setNameInput(skill.name);
    setDescription(skill.description);
    setContent(skill.content);
  }

  const hasChanges =
    !!original &&
    (nameInput !== original.name ||
      description !== original.description ||
      content !== original.content);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.skills.list.queryKey({
        input: { organizationId: organizationId ?? "" },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.skills.getByName.queryKey({
        input: { organizationId: organizationId ?? "", name },
      }),
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const willRename = nameInput !== name;
      const parsed = updateSkillSchema.safeParse({
        name: willRename ? nameInput : undefined,
        description,
        content,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }
      return dashboardOrpc.skills.update.call({
        organizationId,
        name,
        payload: parsed.data,
      });
    },
    onSuccess: (data) => {
      setOriginal({ name: data.name, description, content });
      setNameInput(data.name);
      invalidate();
      toast.success("Skill saved");
      if (data.name !== name) {
        router.replace(`/${slug}/skills/${data.name}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      return dashboardOrpc.skills.delete.call({ organizationId, name });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Skill deleted");
      router.push(`/${slug}/skills`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    handleSaveRef.current = () => {
      if (!hasChanges || saveMutation.isPending || deleteMutation.isPending) {
        return;
      }
      saveMutation.mutate();
    };
    handleDiscardRef.current = () => {
      if (!original) {
        return;
      }
      setNameInput(original.name);
      setDescription(original.description);
      setContent(original.content);
    };
  }, [hasChanges, saveMutation, deleteMutation, original]);

  useEffect(() => {
    if (hasChanges && !saveToastIdRef.current) {
      saveToastIdRef.current = toast.custom(
        () => (
          <div className="rounded-[14px] border border-border bg-background p-0.5 shadow-sm">
            <div className="flex items-center gap-3 rounded-lg bg-background px-4 py-3">
              <span className="text-muted-foreground text-sm">
                Unsaved changes
              </span>
              <Button
                onClick={() => handleDiscardRef.current?.()}
                size="sm"
                variant="ghost"
              >
                Discard
              </Button>
              <Button onClick={() => handleSaveRef.current?.()} size="sm">
                Save
              </Button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "bottom-right" }
      );
    } else if (!hasChanges && saveToastIdRef.current) {
      toast.dismiss(saveToastIdRef.current);
      saveToastIdRef.current = null;
    }
  }, [hasChanges]);

  useEffect(() => {
    return () => {
      if (saveToastIdRef.current) {
        toast.dismiss(saveToastIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-8 px-4 lg:px-6">
        <div className="space-y-4">
          <Link
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
            href={`/${slug}/skills`}
          >
            <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
            Skills
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="truncate font-bold font-mono text-2xl tracking-tight">
                {name}
              </h1>
              {skill?.isSystem ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Badge
                          className="whitespace-nowrap"
                          variant="secondary"
                        >
                          System
                        </Badge>
                      }
                    />
                    <TooltipContent>
                      System skills cannot be renamed or deleted.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
            {skill && !skill.isSystem ? (
              <Button
                className="w-fit gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={saveMutation.isPending || deleteMutation.isPending}
                onClick={() => setDeleteOpen(true)}
                variant="outline"
              >
                <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        {organizationId && isPending ? (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-5">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          </div>
        ) : null}

        {!(organizationId && isPending) && skill ? (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-5">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  className="max-w-md font-mono"
                  disabled={skill.isSystem || saveMutation.isPending}
                  onChange={(e) => setNameInput(e.target.value)}
                  readOnly={skill.isSystem}
                  value={nameInput}
                />
                {skill.isSystem ? (
                  <FieldDescription>
                    System skills keep a fixed name.
                  </FieldDescription>
                ) : (
                  <FieldDescription>
                    Lowercase letters, digits, and hyphens. Renaming may affect
                    references to this skill by name.
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel>
                  Description
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  className="max-h-32 min-h-20 resize-none overflow-y-auto leading-relaxed"
                  disabled={saveMutation.isPending}
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                />
              </Field>
            </div>

            <Field className="gap-3">
              <Tabs
                className="gap-3"
                onValueChange={(v) =>
                  setView(v as (typeof SKILL_EDITOR_VIEWS)[number])
                }
                value={view}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FieldLabel>
                    Content
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <TabsList variant="line">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="edit">
                  <Textarea
                    className="max-h-[min(70vh,40rem)] min-h-48 resize-none overflow-y-auto font-mono text-sm leading-relaxed"
                    disabled={saveMutation.isPending}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                    value={content}
                  />
                </TabsContent>
                <TabsContent value="diff">
                  <div className="min-h-48 overflow-auto rounded-lg border border-border/80 bg-muted/20">
                    <DiffView
                      currentMarkdown={content}
                      originalMarkdown={original?.content ?? ""}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </Field>
          </div>
        ) : null}
      </div>

      <ResponsiveAlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete skill?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently delete the skill "{name}". Schedules that
              reference it will still run, but without its guidance their output
              may be lower quality.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete skill"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
