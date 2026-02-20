"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { OrganizationMembershipActionDialog } from "@/components/settings/organization-membership-action-dialog";
import { authClient } from "@/lib/auth/client";
import {
  getOrganizationMembershipActionLabel,
  type OrganizationMembershipAction,
} from "@/lib/organizations/membership-action";
import { uploadFile } from "@/lib/upload/client";
import { organizationSlugSchema } from "@/schemas/organization";
import { setLastVisitedOrganization } from "@/utils/cookies";
import { QUERY_KEYS } from "@/utils/query-keys";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function GeneralSettingsPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getOrganization, activeOrganization, organizations } =
    useOrganizationsContext();
  const organization =
    activeOrganization?.slug === slug
      ? activeOrganization
      : getOrganization(slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingOrganization, setIsRemovingOrganization] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    data: ownedOrganizations = [],
    isLoading: isLoadingOwnedOrganizations,
  } = useQuery({
    queryKey: ["owned-organizations"],
    queryFn: async () => {
      const response = await fetch("/api/user/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch owned organizations");
      }
      const data = await response.json();
      return (data.ownedOrganizations ?? []) as {
        id: string;
        memberCount: number;
      }[];
    },
  });

  const ownedOrganization = ownedOrganizations.find(
    (ownedOrg) => ownedOrg.id === organization?.id
  );
  const hasOtherMembers = (ownedOrganization?.memberCount ?? 0) > 1;
  const canDeleteOrganization =
    !!ownedOrganization && organizations.length > 1 && !!organization;

  async function handleOrganizationMembershipAction(
    action: OrganizationMembershipAction
  ) {
    if (!organization) {
      return;
    }

    setIsRemovingOrganization(true);

    try {
      const response = await fetch("/api/user/organizations/membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organization.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update organization membership");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTH.organizations,
      });
      await queryClient.invalidateQueries({
        queryKey: ["owned-organizations"],
      });

      const freshOrgs = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.AUTH.organizations,
        queryFn: async () => {
          const result = await authClient.organization.list();
          return result.data ?? [];
        },
      });

      const firstOrg = freshOrgs[0];
      if (!firstOrg) {
        toast.error("You must keep at least one organization");
        return;
      }

      await authClient.organization.setActive({
        organizationId: firstOrg.id,
      });
      await setLastVisitedOrganization(firstOrg.slug);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTH.activeOrganization,
      });

      toast.success(
        action === "delete"
          ? `Deleted ${organization.name}`
          : `Left ${organization.name}`
      );
      router.push(`/${firstOrg.slug}/settings/account`);
    } catch (error) {
      toast.error("Failed to update organization membership");
      console.error(error);
    } finally {
      setIsRemovingOrganization(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) {
      return;
    }
    e.target.value = "";

    setIsUploadingLogo(true);
    try {
      const { url } = await uploadFile({ file, type: "logo" });
      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: { logo: url },
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to update organization logo"
        );
        return;
      }

      toast.success("Organization logo updated");
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
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload organization logo"
      );
    } finally {
      setIsUploadingLogo(false);
    }
  }

  const form = useForm({
    defaultValues: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!organization?.id) {
        return;
      }

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
    if (!organization) {
      return;
    }

    form.reset({
      name: organization.name,
      slug: organization.slug,
    });
  }, [
    organization?.id,
    organization?.name,
    organization?.slug,
    form.reset,
    organization,
  ]);

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
            <div className="flex items-center gap-4">
              <input
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                className="hidden"
                disabled={isUploadingLogo}
                onChange={handleLogoChange}
                ref={logoInputRef}
                type="file"
              />
              <button
                aria-label="Upload organization logo"
                className="group relative cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                type="button"
              >
                <Avatar className="size-16 rounded-lg ring-2 ring-transparent transition-shadow after:rounded-lg group-hover:ring-muted-foreground/20 group-focus-visible:ring-ring">
                  <AvatarImage
                    alt={organization.name}
                    className="rounded-lg"
                    src={organization.logo ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg text-xl">
                    {organization.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                  {isUploadingLogo && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                      <Loader2Icon className="size-6 animate-spin" />
                    </span>
                  )}
                </Avatar>
              </button>
              <div className="space-y-1">
                <p className="font-medium text-sm">Organization logo</p>
                <p className="text-muted-foreground text-xs">
                  {isUploadingLogo
                    ? "Uploading..."
                    : "Click to upload a new logo"}
                </p>
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="organization-id">Organization ID</Label>
              <Input disabled id="organization-id" value={organization.id} />
            </div>

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
              {canDeleteOrganization ? (
                <OrganizationMembershipActionDialog
                  action="delete"
                  hasOtherMembers={hasOtherMembers}
                  onConfirm={() => handleOrganizationMembershipAction("delete")}
                  organizationName={organization.name}
                  trigger={
                    <Button
                      disabled={isRemovingOrganization}
                      size="sm"
                      variant="destructive"
                    >
                      {isRemovingOrganization ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        `${getOrganizationMembershipActionLabel("delete")} Organization`
                      )}
                    </Button>
                  }
                />
              ) : (
                <Button disabled size="sm" variant="destructive">
                  Delete Organization
                </Button>
              )}
            </div>
            {!isLoadingOwnedOrganizations && !ownedOrganization && (
              <p className="text-muted-foreground text-xs">
                Only organization owners can delete this organization.
              </p>
            )}
            {!isLoadingOwnedOrganizations &&
              ownedOrganization &&
              organizations.length <= 1 && (
                <p className="text-muted-foreground text-xs">
                  You need at least one organization. Create another before
                  deleting this one.
                </p>
              )}
          </div>
        </TitleCard>
      </div>
    </PageContainer>
  );
}
