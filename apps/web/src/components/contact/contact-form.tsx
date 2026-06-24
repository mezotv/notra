"use client";

import { Confetti } from "@neoconfetti/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useState } from "react";
import { CONTACT_MESSAGE_MIN_LENGTH } from "@/constants/contact";
import { contactMessageSchema } from "@/schemas/contact";

type SubmitStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error"
  | "validation-error"
  | "rate-limited";

const fieldErrorClass = "text-destructive text-sm";
const labelClass = "font-medium font-sans text-foreground text-sm";

export function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = contactMessageSchema.safeParse(value);

      if (!parsed.success) {
        setStatus("validation-error");
        return;
      }

      setStatus("submitting");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      }).catch(() => null);

      if (!response) {
        setStatus("error");
        return;
      }

      if (response.status === 429) {
        setStatus("rate-limited");
        return;
      }

      setStatus(response.ok ? "success" : "error");
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
          Message sent
        </h3>
        <p className="relative max-w-md text-pretty font-sans text-muted-foreground text-sm leading-6">
          Thanks for reaching out. A real human will write back, usually within
          one business day.
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
              contactMessageSchema.shape.name.safeParse(value).error?.issues[0]
                ?.message,
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
                placeholder="Jane Doe"
                required
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
              contactMessageSchema.shape.email.safeParse(value).error?.issues[0]
                ?.message,
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
                placeholder="jane@example.com"
                required
                type="email"
                value={field.state.value}
              />
              {field.state.meta.errors.length > 0 ? (
                <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
              ) : null}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field
        name="company"
        validators={{
          onBlur: ({ value }) =>
            contactMessageSchema.shape.company.safeParse(value).error?.issues[0]
              ?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label className={labelClass} htmlFor={field.name}>
              Company{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Acme Inc."
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className={fieldErrorClass}>{field.state.meta.errors[0]}</p>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="message"
        validators={{
          onBlur: ({ value }) =>
            contactMessageSchema.shape.message.safeParse(value).error?.issues[0]
              ?.message,
        }}
      >
        {(field) => {
          const trimmedLength = field.state.value.trim().length;
          const charsRemaining = CONTACT_MESSAGE_MIN_LENGTH - trimmedLength;

          return (
            <div className="flex flex-col gap-2">
              <Label className={labelClass} htmlFor={field.name}>
                Message
              </Label>
              <Textarea
                aria-invalid={field.state.meta.errors.length > 0}
                className="min-h-32"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Tell us what you're working on and how we can help."
                required
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

      <div aria-live="assertive" role="alert">
        {status === "validation-error" ? (
          <p className={fieldErrorClass}>
            Please complete the required fields before sending your message.
          </p>
        ) : null}

        {status === "error" ? (
          <p className={fieldErrorClass}>
            Something went wrong sending your message. Please try again, or
            email us at hello@usenotra.com.
          </p>
        ) : null}

        {status === "rate-limited" ? (
          <p className={fieldErrorClass}>
            You've sent too many messages recently. Please try again in about an
            hour, or email us at hello@usenotra.com.
          </p>
        ) : null}
      </div>

      <p className="text-pretty font-sans text-muted-foreground text-xs leading-5">
        By submitting this form you agree to our{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          href="/privacy"
        >
          Privacy Policy
        </Link>
        . We'll only use your details to respond to your message.
      </p>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            className="h-11 w-full overflow-hidden rounded-lg border-transparent bg-primary px-6 hover:bg-primary-hover sm:w-auto sm:self-start"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            <span className="font-medium font-sans text-primary-foreground text-sm">
              {isSubmitting ? "Sending..." : "Send message"}
            </span>
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
