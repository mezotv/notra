"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
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
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import { parseSkillFrontmatter } from "@/lib/skills/parse-frontmatter";
import { createSkillSchema } from "@/schemas/skills";

interface PageClientProps {
  slug: string;
}

export default function PageClient({ slug }: PageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    content: "",
  });

  const { data: skills = [], isPending } = useQuery({
    ...dashboardOrpc.skills.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
    }),
    enabled: !!organizationId,
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
    onSuccess: (data) => {
      setDialogOpen(false);
      setForm({ name: "", description: "", content: "" });
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.skills.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("Skill created");
      router.push(`/${slug}/skills/${data.name}`);
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
          <Button onClick={() => setDialogOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            New Skill
          </Button>
        </div>

        {organizationId && isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cards
              <Card className="gap-3 p-4" key={i}>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-1 h-3 w-24" />
              </Card>
            ))}
          </div>
        ) : skills.length === 0 ? (
          <p className="text-muted-foreground">No skills yet.</p>
        ) : (
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
        <ResponsiveDialogContent className="sm:max-w-[32rem]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Create skill</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              A skill is a reusable prompt your agents load at runtime.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 py-2">
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
