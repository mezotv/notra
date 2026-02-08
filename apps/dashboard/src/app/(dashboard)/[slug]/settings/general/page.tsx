"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { TitleCard } from "@/components/title-card";
import { authClient } from "@/lib/auth/client";
import { setLastVisitedOrganization } from "@/utils/cookies";
import { QUERY_KEYS } from "@/utils/query-keys";
import { organizationSlugSchema } from "@/utils/schemas/organization";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function GeneralSettingsPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const organization =
    activeOrganization?.slug === slug
      ? activeOrganization
      : getOrganization(slug);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm({
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!organization?.id) return;

      setIsUpdating(true);
      try {
        const result = await authClient.organization.update({
          organizationId: organization.id,
          data: {
            name: value.name,
            slug: value.slug,
          },
        });

        if (result.error) {
          toast.error(result.error.message ?? "Failed to update organization");
          return;
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.AUTH.organizations,
          }),
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.AUTH.activeOrganization,
          }),
        ]);

        await Promise.all([
          queryClient.refetchQueries({
            queryKey: QUERY_KEYS.AUTH.organizations,
            type: "active",
          }),
          queryClient.refetchQueries({
            queryKey: QUERY_KEYS.AUTH.activeOrganization,
            type: "active",
          }),
        ]);

        const updatedSlug = result.data?.slug ?? value.slug;

        await setLastVisitedOrganization(updatedSlug);

        if (updatedSlug !== slug) {
          router.replace(`/${updatedSlug}/settings/general`);
        }

        toast.success("Organization updated successfully");
      } catch {
        toast.error("Failed to update organization");
      } finally {
        setIsUpdating(false);
      }
    },
  });

  useEffect(() => {
    if (!organization) return;

    form.reset({
      name: organization.name,
      slug: organization.slug,
    });
  }, [organization?.id, organization?.name, organization?.slug]);

  if (!organization) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">General</h1>
          <p className="text-muted-foreground">
            Manage your organization settings
          </p>
        </div>

        <TitleCard heading="Organization Details">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Organization Name</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="My Organization"
                    value={field.state.value}
                  />
                  <p className="text-muted-foreground text-xs">
                    This is the name of your organization as it appears across
                    the platform
                  </p>
                </div>
              )}
            </form.Field>

            <form.Field
              name="slug"
              validators={{
                onChange: ({ value }) =>
                  organizationSlugSchema.safeParse(value).error?.issues[0]
                    ?.message,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Organization Slug</Label>
                  <Input
                    aria-invalid={field.state.meta.errors.length > 0}
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="my-organization"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0]}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    Used in URLs: https://app.usenotra.com/
                    {field.state.value || "your-slug"}
                  </p>
                </div>
              )}
            </form.Field>

            <Button disabled={isUpdating} type="submit">
              {isUpdating ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </TitleCard>

        <TitleCard heading="Danger Zone">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Delete Organization</p>
                <p className="text-muted-foreground text-xs">
                  Permanently delete this organization and all its data
                </p>
              </div>
              <Button disabled size="sm" variant="destructive">
                Delete Organization
              </Button>
            </div>
          </div>
        </TitleCard>
      </div>
    </PageContainer>
  );
}
