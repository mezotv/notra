"use client";

import { Button } from "@notra/ui/components/ui/button";
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
import { cn } from "@notra/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
  ossProgramApplicationSchema,
  SUPPORTED_LICENSES,
} from "@/schemas/oss-program";

type SubmitStatus = "idle" | "submitting" | "success";

const LICENSE_LABELS = new Map<string, string>(
  SUPPORTED_LICENSES.map((license) => [license.value, license.label])
);

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
      license: "",
      description: "",
      assetNeeds: "",
      isMaintainer: false,
    },
    onSubmit: ({ value }) => {
      const parsed = ossProgramApplicationSchema.safeParse(value);

      if (!parsed.success) {
        return;
      }

      setStatus("success");
    },
  });

  if (status === "success") {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <h3 className="font-sans font-semibold text-foreground text-xl">
          Application received
        </h3>
        <p className="max-w-md text-pretty font-sans text-muted-foreground text-sm leading-6">
          Thanks for applying to the Notra OSS pilot. We review every submission
          and will reach out by email if your project is a fit.
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
        setStatus("submitting");
        form.handleSubmit().finally(() => {
          setStatus((current) => (current === "success" ? current : "idle"));
        });
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
                Name
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Ada Lovelace"
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
                placeholder="you@example.com"
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
                placeholder="my-open-source-project"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="license"
          validators={{
            onChange: ({ value }) =>
              ossProgramApplicationSchema.shape.license.safeParse(value).error
                ?.issues[0]?.message,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                License
              </Label>
              <Select
                onValueChange={(value) =>
                  field.handleChange(typeof value === "string" ? value : "")
                }
                value={field.state.value}
              >
                <SelectTrigger
                  aria-invalid={field.state.meta.errors.length > 0}
                  className="h-9 w-full"
                  id={field.name}
                >
                  <SelectValue>
                    {(value: string) =>
                      value ? LICENSE_LABELS.get(value) : "Select a license"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LICENSES.map((license) => (
                    <SelectItem key={license.value} value={license.value}>
                      {license.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field
        name="repositoryUrl"
        validators={{
          onBlur: ({ value }) =>
            ossProgramApplicationSchema.shape.repositoryUrl.safeParse(value)
              .error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label className={labelClass} htmlFor={field.name}>
              Repository URL
            </Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              inputMode="url"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="https://github.com/your-org/your-project"
              type="url"
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="description"
        validators={{
          onBlur: ({ value }) =>
            ossProgramApplicationSchema.shape.description.safeParse(value).error
              ?.issues[0]?.message,
        }}
      >
        {(field) => (
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
            {field.state.meta.errors.length > 0 ? (
              <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
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
              placeholder="Changelogs, launch posts, social updates, docs — what would move the needle for your project?"
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
