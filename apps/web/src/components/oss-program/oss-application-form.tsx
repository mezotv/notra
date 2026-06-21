"use client";

import { Confetti } from "@neoconfetti/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { cn } from "@notra/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
  buildRepositoryUrl,
  extractRepoSlug,
} from "@/lib/oss-program/repository-url";
import {
  DESCRIPTION_MIN_LENGTH,
  ossProgramApplicationSchema,
} from "@/schemas/oss-program";

type SubmitStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error"
  | "rate-limited"
  | "validation-error";

const fieldErrorClass = "text-destructive text-sm";
const labelClass = "font-medium font-sans text-foreground text-sm";

export function OssApplicationForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      projectName: "",
      repositoryUrl: "",
      description: "",
      assetNeeds: "",
      isMaintainer: false,
    },
    onSubmit: async ({ value }) => {
      const parsed = ossProgramApplicationSchema.safeParse(value);

      if (!parsed.success) {
        setStatus("validation-error");
        return;
      }

      setStatus("submitting");

      try {
        const response = await fetch("/api/oss-program", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (response.status === 429) {
          setStatus("rate-limited");
          return;
        }

        if (!response.ok) {
          throw new Error("Request failed");
        }

        setStatus("success");
      } catch {
        setStatus("error");
      }
    },
  });

  if (status === "success") {
    return (
      <div
        aria-live="polite"
        className="relative flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center"
      >
        <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
          <Confetti
            colors={[
              "var(--primary)",
              "#FFC700",
              "#FF6B6B",
              "#41BBC7",
              "#A78BFA",
              "#34D399",
            ]}
            duration={3000}
            force={0.5}
            particleCount={120}
            particleShape="mix"
            particleSize={8}
            stageHeight={500}
            stageWidth={800}
          />
        </div>
        <h3 className="relative font-sans font-semibold text-foreground text-xl">
          Application received
        </h3>
        <p className="relative max-w-md text-pretty font-sans text-muted-foreground text-sm leading-6">
          Thanks for applying to the Notra OSS program. We review every
          submission and will reach out by email if your project is a fit.
        </p>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) =>
              ossProgramApplicationSchema.shape.name.safeParse(value).error
                ?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                Your name
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Linus Torvalds"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onBlur: ({ value }) =>
              ossProgramApplicationSchema.shape.email.safeParse(value).error
                ?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                Email
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                inputMode="email"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="torvalds@kernel.org"
                type="email"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="projectName"
          validators={{
            onBlur: ({ value }) =>
              ossProgramApplicationSchema.shape.projectName.safeParse(value)
                .error?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                Project name
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Linux"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="repositoryUrl"
          validators={{
            onBlur: ({ value }) =>
              ossProgramApplicationSchema.shape.repositoryUrl.safeParse(value)
                .error?.issues[0]?.message,
          }}
        >
          {(field) => {
            const hasError = field.state.meta.errors.length > 0;

            return (
              <div className="flex flex-col gap-2">
                <Label className={labelClass} htmlFor={field.name}>
                  Repository URL
                </Label>
                <div
                  className={cn(
                    "flex h-8 w-full items-center overflow-hidden rounded-lg border border-input bg-transparent text-base transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm dark:bg-input/30",
                    hasError &&
                      "border-destructive ring-[3px] ring-destructive/20 dark:ring-destructive/40"
                  )}
                >
                  <label
                    className="flex h-full cursor-text select-none items-center border-input border-r bg-muted/50 px-2.5 text-muted-foreground"
                    htmlFor={field.name}
                  >
                    github.com/
                  </label>
                  <input
                    aria-invalid={hasError}
                    className="h-full w-full min-w-0 bg-transparent px-2.5 text-foreground outline-none placeholder:text-muted-foreground"
                    id={field.name}
                    inputMode="url"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(buildRepositoryUrl(event.target.value))
                    }
                    placeholder="torvalds/linux"
                    value={extractRepoSlug(field.state.value)}
                  />
                </div>
                {hasError ? (
                  <p className={fieldErrorClass}>
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            );
          }}
        </form.Field>
      </div>

      <form.Field
        name="description"
        validators={{
          onBlur: ({ value }) =>
            ossProgramApplicationSchema.shape.description.safeParse(value).error
              ?.issues[0]?.message,
        }}
      >
        {(field) => {
          const trimmedLength = field.state.value.trim().length;
          const charsRemaining = DESCRIPTION_MIN_LENGTH - trimmedLength;

          return (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                What are you building?
              </Label>
              <Textarea
                aria-invalid={field.state.meta.errors.length > 0}
                className="min-h-24"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Tell us about your project, who it's for, and what makes it interesting."
                value={field.state.value}
              />
              <div className="flex items-center justify-between gap-3">
                {field.state.meta.errors.length > 0 ? (
                  <p className={fieldErrorClass}>
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
                <span className="ml-auto shrink-0 font-sans text-muted-foreground text-xs">
                  {charsRemaining > 0
                    ? `${charsRemaining} more character${charsRemaining === 1 ? "" : "s"} needed`
                    : `${trimmedLength} characters`}
                </span>
              </div>
            </div>
          );
        }}
      </form.Field>

      <form.Field
        name="assetNeeds"
        validators={{
          onBlur: ({ value }) =>
            ossProgramApplicationSchema.shape.assetNeeds.safeParse(value).error
              ?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label className={labelClass} htmlFor={field.name}>
              How would content &amp; marketing assets help?{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              aria-invalid={field.state.meta.errors.length > 0}
              className="min-h-24"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Changelogs, launch posts, social updates, docs. What would move the needle for your project?"
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="isMaintainer"
        validators={{
          onChange: ({ value }) =>
            ossProgramApplicationSchema.shape.isMaintainer.safeParse(value)
              .error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <label
              className="flex cursor-pointer items-start gap-3"
              htmlFor={field.name}
            >
              <input
                aria-invalid={field.state.meta.errors.length > 0}
                checked={field.state.value}
                className={cn(
                  "mt-0.5 size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  field.state.meta.errors.length > 0 && "border-destructive"
                )}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.checked)}
                type="checkbox"
              />
              <span className="font-normal font-sans text-foreground text-sm leading-5">
                I'm an owner or maintainer of this repository and have
                permission to apply.
              </span>
            </label>
            {field.state.meta.errors.length > 0 ? (
              <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <div aria-live="assertive" role="alert">
        {status === "validation-error" ? (
          <p className={fieldErrorClass}>
            Please complete the required fields before submitting your
            application.
          </p>
        ) : null}

        {status === "error" ? (
          <p className={fieldErrorClass}>
            Something went wrong submitting your application. Please try again,
            or email us at hello@usenotra.com.
          </p>
        ) : null}

        {status === "rate-limited" ? (
          <p className={fieldErrorClass}>
            You've submitted too many applications recently. Please try again in
            about an hour.
          </p>
        ) : null}
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            className="h-11 w-full overflow-hidden rounded-lg border-transparent bg-primary px-6 hover:bg-primary-hover sm:w-auto sm:self-start"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            <span className="font-medium font-sans text-primary-foreground text-sm">
              {isSubmitting ? "Submitting…" : "Submit application"}
            </span>
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
