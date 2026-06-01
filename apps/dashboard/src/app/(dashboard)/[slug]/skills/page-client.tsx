"use client";

import { Link04Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@notra/ui/components/ui/input-group";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Separator } from "@notra/ui/components/ui/separator";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import { parseSkillFrontmatter } from "@/lib/skills/parse-frontmatter";
import { createSkillSchema } from "@/schemas/skills";
import { SkillsPageSkeleton } from "./skeleton";

interface PageClientProps {
  slug: string;
}

export default function PageClient({ slug }: PageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickstartUrl, setQuickstartUrl] = useState("");

  useHotkey("C", () => setDialogOpen(true), { enabled: !dialogOpen });

  const [form, setForm] = useState({
    name: "",
    description: "",
    content: "",
  });

  const quickstartError = (() => {
    if (!quickstartUrl.trim()) {
      return null;
    }
    try {
      const parsed = new URL(quickstartUrl.trim());
      if (parsed.host !== "skills.sh") {
        return "Only skills.sh links are supported.";
      }
      return null;
    } catch {
      return "Enter a valid skills.sh URL.";
    }
  })();

  const { data: skills = [], isPending } = useQuery({
    ...dashboardOrpc.skills.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
    }),
    enabled: !!organizationId,
  });

  const importMutation = useMutation({
    mutationFn: () =>
      dashboardOrpc.skills.importFromUrl.call({
        url: quickstartUrl.trim(),
      }),
    onSuccess: (data) => {
      setForm((f) => ({
        name: f.name || data.name,
        description: f.description || data.description,
        content: f.content || data.content,
      }));
      toast.success("Skill imported from skills.sh");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const parsed = createSkillSchema.safeParse({
        name: form.name,
        description: form.description,
        content: form.content,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }
      return dashboardOrpc.skills.create.call({
        organizationId,
        payload: parsed.data,
      });
    },
    onSuccess: () => {
      setDialogOpen(false);
      setForm({ name: "", description: "", content: "" });
      setQuickstartUrl("");
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.skills.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("Skill created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePasteFrontmatter = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const pasted = e.clipboardData.getData("text/plain");
    const parsed = parseSkillFrontmatter(pasted);
    if (!parsed) {
      return;
    }

    e.preventDefault();
    setForm((f) => ({
      name: f.name || (parsed.name ?? ""),
      description: f.description || (parsed.description ?? ""),
      content: f.content || parsed.body,
    }));
  };

  const isLoadingSkills = !!organizationId && isPending;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Skills</h1>
            <p className="text-muted-foreground">
              Reusable instructions your agents load when generating content.
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Create Skill
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>

        {isLoadingSkills && <SkillsPageSkeleton />}
        {!isLoadingSkills && skills.length === 0 && (
          <p className="text-muted-foreground">No skills yet.</p>
        )}
        {!isLoadingSkills && skills.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <Link
                className="group block"
                href={`/${slug}/skills/${skill.name}`}
                key={skill.id}
              >
                <Card className="h-full gap-3 transition-all group-hover:ring-foreground/20">
                  <CardHeader>
                    <CardTitle className="font-mono text-base">
                      {skill.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {skill.description}
                    </CardDescription>
                    <p className="pt-1 text-muted-foreground text-xs">
                      Updated {new Date(skill.updatedAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ResponsiveDialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <ResponsiveDialogContent className="flex max-h-[85svh] flex-col overflow-hidden sm:max-w-[32rem]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Create skill</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              A skill is a reusable prompt your agents load at runtime.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="-mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-2">
            <Field>
              <FieldLabel>Quickstart</FieldLabel>
              <InputGroup className="h-9">
                <InputGroupAddon>
                  <HugeiconsIcon
                    className="size-4 text-muted-foreground"
                    icon={Link04Icon}
                  />
                </InputGroupAddon>
                <InputGroupInput
                  aria-invalid={quickstartError ? true : undefined}
                  disabled={
                    createMutation.isPending || importMutation.isPending
                  }
                  onChange={(e) => setQuickstartUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !quickstartError &&
                      quickstartUrl.trim() &&
                      !importMutation.isPending
                    ) {
                      e.preventDefault();
                      importMutation.mutate();
                    }
                  }}
                  placeholder="https://skills.sh/..."
                  value={quickstartUrl}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    disabled={
                      !quickstartUrl.trim() ||
                      !!quickstartError ||
                      importMutation.isPending ||
                      createMutation.isPending
                    }
                    onClick={() => importMutation.mutate()}
                    variant="default"
                  >
                    {importMutation.isPending ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : null}
                    {importMutation.isPending ? "Importing" : "Import"}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <p
                className={
                  quickstartError
                    ? "text-destructive text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {quickstartError ?? "Paste a skills.sh link to import a skill."}
              </p>
            </Field>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                or create manually
              </span>
              <Separator className="flex-1" />
            </div>
            <Field>
              <FieldLabel>
                Name<span className="-ml-1 text-destructive">*</span>
              </FieldLabel>
              <Input
                disabled={createMutation.isPending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onPaste={handlePasteFrontmatter}
                placeholder="my-skill"
                value={form.name}
              />
              <p className="text-muted-foreground text-xs">
                Lowercase letters, digits, and hyphens. Or paste a full skill
                (frontmatter + body) here to auto-fill all fields.
              </p>
            </Field>
            <Field>
              <FieldLabel>
                Description<span className="-ml-1 text-destructive">*</span>
              </FieldLabel>
              <Textarea
                className="max-h-[5rem] min-h-[4rem] overflow-y-auto"
                disabled={createMutation.isPending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                onPaste={handlePasteFrontmatter}
                placeholder="What this skill does and when to use it."
                value={form.description}
              />
            </Field>
            <Field>
              <FieldLabel>
                Content<span className="-ml-1 text-destructive">*</span>
              </FieldLabel>
              <Textarea
                className="max-h-[14rem] min-h-[10rem] overflow-y-auto font-mono text-sm"
                disabled={createMutation.isPending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                onPaste={handlePasteFrontmatter}
                placeholder="# My skill\n\nYou are..."
                value={form.content}
              />
            </Field>
          </div>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={createMutation.isPending}
              render={<Button variant="outline">Cancel</Button>}
            />
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating…" : "Create skill"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </PageContainer>
  );
}
