"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { authClient } from "@/lib/auth/client";
import { generateOrganizationAvatar } from "@/lib/utils";
import { onboardingWorkspaceSchema } from "@/schemas/onboarding/workspace";
import { setLastVisitedOrganization } from "@/utils/cookies";
import { triggerOnboardingBrandAnalysis } from "./actions";

const WEBSITE_PREFIX_REGEX = /^https?:\/\//i;
const slugSchema = z.string().slugify();

function slugify(value: string): string {
  return slugSchema.safeParse(value).data ?? "";
}

function normalizeWebsite(value: string): string {
  return WEBSITE_PREFIX_REGEX.test(value) ? value : `https://${value}`;
}

interface ExistingOrg {
  id: string;
  slug: string;
  name: string;
}

interface WorkspaceFormProps {
  existingOrg?: ExistingOrg;
}

export function WorkspaceForm({ existingOrg }: WorkspaceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isResuming = !!existingOrg;

  const form = useForm({
    defaultValues: {
      name: existingOrg?.name ?? "",
      slug: existingOrg?.slug ?? "",
      websiteUrl: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);

      try {
        const websiteUrl = normalizeWebsite(value.websiteUrl);
        const parsed = onboardingWorkspaceSchema.safeParse({
          name: value.name,
          slug: value.slug,
          websiteUrl,
        });

        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ?? "Please check your inputs";
          toast.error(message);
          setIsSubmitting(false);
          return;
        }

        let organizationId: string;
        let organizationSlug: string;

        if (existingOrg) {
          organizationId = existingOrg.id;
          organizationSlug = existingOrg.slug;
        } else {
          const { data, error } = await authClient.organization.create({
            name: parsed.data.name,
            slug: parsed.data.slug,
            logo: generateOrganizationAvatar(parsed.data.slug),
          });

          if (error || !data) {
            toast.error(error?.message ?? "Failed to create org");
            setIsSubmitting(false);
            return;
          }

          organizationId = data.id;
          organizationSlug = data.slug;

          await authClient.organization.setActive({
            organizationId: data.id,
          });
          await setLastVisitedOrganization(data.slug);
        }

        await triggerOnboardingBrandAnalysis({
          organizationId,
          websiteUrl: parsed.data.websiteUrl,
          name: parsed.data.name,
        });

        router.push("/onboarding/socials");
        router.refresh();
        // Keep button in submitting state during navigation
        return;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create org"
        );
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6">
        <OnboardingProgress current={1} />
      </div>

      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          {isResuming ? "Finish setting up your org" : "Tell us about your org"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isResuming
            ? "Your workspace is ready — enter your website so we can finish learning your brand voice."
            : "We'll use your website to learn your brand voice while you set up the rest."}
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              onboardingWorkspaceSchema.shape.name.safeParse(value).error
                ?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="name">
                Org name <span className="text-destructive">*</span>
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoFocus={!isResuming}
                disabled={isSubmitting || isResuming}
                id="name"
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  const currentSlug = form.getFieldValue("slug");
                  if (
                    !currentSlug ||
                    currentSlug === slugify(field.state.value)
                  ) {
                    form.setFieldValue("slug", slugify(e.target.value));
                  }
                }}
                placeholder="Acme Inc"
                type="text"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="slug"
          validators={{
            onChange: ({ value }) =>
              onboardingWorkspaceSchema.shape.slug.safeParse(value).error
                ?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="slug">
                Org URL <span className="text-destructive">*</span>
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={isSubmitting || isResuming}
                id="slug"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(slugify(e.target.value))}
                placeholder="acme-inc"
                type="text"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  app.usenotra.com/{field.state.value || "your-slug"}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="websiteUrl"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim() === "") {
                return "Website is required";
              }
              const candidate = normalizeWebsite(value);
              return onboardingWorkspaceSchema.shape.websiteUrl.safeParse(
                candidate
              ).error?.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="website">
                Website <span className="text-destructive">*</span>
              </Label>
              <div
                className={`flex w-full flex-row items-center rounded-md border transition-colors focus-within:border-ring focus-within:ring-ring/50 ${field.state.meta.errors.length > 0 ? "border-destructive" : "border-border"}`}
              >
                <label
                  className="border-border border-r px-2.5 py-1.5 text-muted-foreground text-sm"
                  htmlFor="website"
                >
                  https://
                </label>
                <input
                  autoFocus={isResuming}
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  id="website"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="acme.com"
                  type="text"
                  value={field.state.value.replace(WEBSITE_PREFIX_REGEX, "")}
                />
              </div>
              {field.state.meta.errors.length > 0 ? (
                <p className="text-destructive text-sm">
                  {field.state.meta.errors[0]}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </div>
  );
}
