"use client";

import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { authClient } from "@/lib/auth/client";
import { createOrganizationSchema } from "@/schemas/organization";

const slugSchema = z.string().slugify();

function slugify(value: string): string {
  return slugSchema.safeParse(value).data ?? "";
}

export function CreateWorkspace() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugEditedRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = createOrganizationSchema.safeParse({
      name: name.trim(),
      slug,
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Invalid workspace");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await authClient.organization.create(
        validation.data
      );
      if (error || !data) {
        toast.error(error?.message ?? "Failed to create workspace");
        setIsCreating(false);
        return;
      }

      const setActiveResult = await authClient.organization.setActive({
        organizationId: data.id,
      });
      if (setActiveResult.error) {
        toast.error(
          setActiveResult.error.message ?? "Failed to activate workspace"
        );
        setIsCreating(false);
        return;
      }
      router.push(`/${data.slug}/integrations`);
      router.refresh();
    } catch {
      toast.error("Failed to create workspace");
      setIsCreating(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            Add a company workspace to start managing integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Company name</Label>
              <Input
                disabled={isCreating}
                id="workspace-name"
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugEditedRef.current) {
                    setSlug(slugify(nextName));
                  }
                }}
                placeholder="Acme Inc"
                value={name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workspace-slug">Workspace slug</Label>
              <Input
                disabled={isCreating}
                id="workspace-slug"
                onChange={(event) => {
                  slugEditedRef.current = true;
                  setSlug(slugify(event.target.value));
                }}
                placeholder="acme-inc"
                value={slug}
              />
              <p className="text-muted-foreground text-xs">
                Your console URL will include /{slug || "your-slug"}.
              </p>
            </div>
            <Button disabled={isCreating} type="submit">
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
