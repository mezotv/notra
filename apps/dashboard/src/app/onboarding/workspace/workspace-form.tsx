"use client";

import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { Button } from "@/components/button";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { ONBOARDING_HEARD_ABOUT_NOTRA_OPTIONS } from "@/constants/onboarding";
import { submitWorkspaceForm } from "@/lib/onboarding/submit-workspace-form";
import {
  onboardingWorkspaceFormFieldsSchema,
  onboardingWorkspaceFormSchema,
} from "@/schemas/onboarding/workspace";
import type { WorkspaceFormProps } from "@/types/onboarding";
import {
  getHeardAboutNotraLabel,
  isHeardAboutNotraSource,
} from "@/utils/onboarding";

const WEBSITE_PREFIX_REGEX = /^https?:\/\//i;
const slugSchema = z.string().slugify();

function slugify(value: string): string {
  return slugSchema.safeParse(value).data ?? "";
}

function getValidationMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Please check this field";
}

export function WorkspaceForm({ existingOrg }: WorkspaceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isResuming = !!existingOrg;
  const existingSource = existingOrg?.heardAboutNotraSource;
  const initialSource = isHeardAboutNotraSource(existingSource)
    ? existingSource
    : "";
  const isAttributionLocked = Boolean(
    existingSource || existingOrg?.heardAboutNotraOther
  );

  const form = useForm({
    defaultValues: {
      heardAboutNotraOther: existingOrg?.heardAboutNotraOther ?? "",
      heardAboutNotraSource: initialSource,
      name: existingOrg?.name ?? "",
      slug: existingOrg?.slug ?? "",
      websiteUrl: "",
    },
    validators: {
      onSubmit: onboardingWorkspaceFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);

      try {
        await submitWorkspaceForm({ existingOrg, value });
        window.location.assign("/onboarding/pricing");
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
            ? "Your workspace is ready. Add a website if you want us to learn your brand voice automatically."
            : "Add a website and we'll learn your brand voice while you set up the rest. You can always add it later."}
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
            onChange: onboardingWorkspaceFormFieldsSchema.shape.name,
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
                  {getValidationMessage(field.state.meta.errors[0])}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="slug"
          validators={{
            onChange: onboardingWorkspaceFormFieldsSchema.shape.slug,
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
                  {getValidationMessage(field.state.meta.errors[0])}
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
          name="heardAboutNotraSource"
          validators={{
            onChange:
              onboardingWorkspaceFormFieldsSchema.shape.heardAboutNotraSource,
          }}
        >
          {(field) => (
            <>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="heard-about-notra">
                    Where did you hear about Notra?{" "}
                    {field.state.value !== "other" ? (
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    ) : null}
                  </Label>
                  {field.state.value && !isAttributionLocked ? (
                    <Button
                      className="h-auto px-0 text-muted-foreground"
                      disabled={isSubmitting}
                      onClick={() => {
                        field.handleChange("");
                        form.setFieldValue("heardAboutNotraOther", "");
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <Select
                  onValueChange={(value) => {
                    if (!isHeardAboutNotraSource(value)) {
                      return;
                    }

                    field.handleChange(value);
                    if (value !== "other") {
                      form.setFieldValue("heardAboutNotraOther", "");
                    }
                  }}
                  value={field.state.value}
                >
                  <SelectTrigger
                    aria-invalid={field.state.meta.errors.length > 0}
                    className="h-10 w-full"
                    disabled={isSubmitting || isAttributionLocked}
                    id="heard-about-notra"
                  >
                    <SelectValue placeholder="Select an option">
                      {(value) =>
                        getHeardAboutNotraLabel(value) ?? "Select an option"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ONBOARDING_HEARD_ABOUT_NOTRA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 ? (
                  <p className="text-destructive text-sm">
                    {getValidationMessage(field.state.meta.errors[0])}
                  </p>
                ) : null}
              </div>

              {field.state.value === "other" ? (
                <form.Field
                  name="heardAboutNotraOther"
                  validators={{
                    onChange:
                      onboardingWorkspaceFormFieldsSchema.shape
                        .heardAboutNotraOther,
                  }}
                >
                  {(otherField) => (
                    <div className="grid gap-2">
                      <Label htmlFor="heard-about-notra-other">
                        Tell us where{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        aria-invalid={otherField.state.meta.errors.length > 0}
                        disabled={isSubmitting || isAttributionLocked}
                        id="heard-about-notra-other"
                        onBlur={otherField.handleBlur}
                        onChange={(e) =>
                          otherField.handleChange(e.target.value)
                        }
                        placeholder="Podcast, community, friend, etc."
                        rows={3}
                        value={otherField.state.value}
                      />
                      {otherField.state.meta.errors.length > 0 ? (
                        <p className="text-destructive text-sm">
                          {getValidationMessage(
                            otherField.state.meta.errors[0]
                          )}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
              ) : null}
            </>
          )}
        </form.Field>

        <form.Field
          name="websiteUrl"
          validators={{
            onChange: onboardingWorkspaceFormFieldsSchema.shape.websiteUrl,
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor="website">
                Website{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
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
                  {getValidationMessage(field.state.meta.errors[0])}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <Button
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
