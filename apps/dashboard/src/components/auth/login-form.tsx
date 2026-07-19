"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Badge } from "@notra/ui/components/ui/badge";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Separator } from "@notra/ui/components/ui/separator";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { authClient } from "@/lib/auth/client";
import { errorMessageOr } from "@/lib/utils";
import { loginSchema } from "@/schemas/auth/credentials";
import type { AuthMethod } from "@/types/auth/method";

const LOGIN_ERROR_FALLBACK = "Failed to sign in. Please try again.";

const fieldErrorClass = "min-h-5 text-destructive text-sm";

export interface LoginFormProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  returnTo?: string;
  showSignupLink?: boolean;
  showForgotPasswordLink?: boolean;
}

export function LoginForm({
  title = "Welcome back",
  description = "Log in to pick up where your team left off.",
  onSuccess,
  returnTo,
  showSignupLink = true,
  showForgotPasswordLink = true,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const authInFlightRef = useRef(false);
  const lastMethod = authClient.getLastUsedLoginMethod();
  const isAuthLoading = authMethod !== null;

  const callbackURL = returnTo
    ? `/callback?returnTo=${encodeURIComponent(returnTo)}`
    : "/callback";

  async function handleSocialLogin(provider: "google" | "github") {
    if (authInFlightRef.current) {
      return;
    }

    setFormError(null);
    authInFlightRef.current = true;
    flushSync(() => setAuthMethod(provider));

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error) {
      console.error("Social login error:", error);
      setFormError(LOGIN_ERROR_FALLBACK);
      authInFlightRef.current = false;
      setAuthMethod(null);
    }
  }

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (authInFlightRef.current) {
        return;
      }

      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) {
        return;
      }

      setFormError(null);
      authInFlightRef.current = true;
      flushSync(() => setAuthMethod("email"));
      try {
        const result = await authClient.signIn.email({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (result.error) {
          setFormError(
            errorMessageOr(result.error.message, LOGIN_ERROR_FALLBACK)
          );
          authInFlightRef.current = false;
          setAuthMethod(null);
          return;
        }

        // Call onSuccess callback if provided, otherwise redirect through callback
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign(callbackURL);
        }
      } catch (error) {
        console.error("Email login error:", error);
        setFormError(LOGIN_ERROR_FALLBACK);
        authInFlightRef.current = false;
        setAuthMethod(null);
      }
    },
  });

  return (
    <div className="flex w-full flex-col gap-5">
      {(title || description) && (
        <div className="text-center">
          {title && (
            <h1 className="font-semibold text-2xl tracking-tight lg:text-[1.75rem]">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1.5 text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            {lastMethod === "google" && (
              <Badge
                className="-top-4 -right-2 absolute z-10"
                variant="default"
              >
                Last Used
              </Badge>
            )}
            <CtaButton
              className="w-full"
              disabled={isAuthLoading}
              onClick={() => handleSocialLogin("google")}
              type="button"
              variant="light"
            >
              {authMethod === "google" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Google className="size-4" />
              )}
              Google
            </CtaButton>
          </div>
          <div className="relative">
            {lastMethod === "github" && (
              <Badge
                className="-top-4 -right-2 absolute z-10"
                variant="default"
              >
                Last Used
              </Badge>
            )}
            <CtaButton
              className="w-full"
              disabled={isAuthLoading}
              onClick={() => handleSocialLogin("github")}
              type="button"
              variant="light"
            >
              {authMethod === "github" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Github className="size-4" />
              )}
              GitHub
            </CtaButton>
          </div>
        </div>

        <div className="relative flex items-center">
          <span className="inline-block h-px w-full border-t bg-border" />
          <span className="shrink-0 px-2 text-muted-foreground text-xs uppercase">
            Or
          </span>
          <span className="inline-block h-px w-full border-t bg-border" />
        </div>

        <form
          aria-busy={isAuthLoading}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-1">
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) =>
                  loginSchema.shape.email.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  loginSchema.shape.email.safeParse(value).error?.issues[0]
                    ?.message,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    aria-invalid={field.state.meta.errors.length > 0}
                    autoComplete="email"
                    className="h-11 rounded-xl px-4"
                    disabled={isAuthLoading}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="jane@company.com"
                    type="email"
                    value={field.state.value}
                  />
                  <p aria-live="polite" className={fieldErrorClass}>
                    {field.state.meta.errors[0]}
                  </p>
                </div>
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) =>
                  loginSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  loginSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Password</Label>
                  <div className="relative">
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      autoComplete="current-password"
                      className="h-11 rounded-xl px-4 pr-10"
                      disabled={isAuthLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Your password"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="-translate-y-1/2 absolute top-1/2 right-4 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-50"
                      disabled={isAuthLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? (
                        <HugeiconsIcon
                          className="size-4"
                          icon={ViewOffSlashIcon}
                        />
                      ) : (
                        <HugeiconsIcon className="size-4" icon={ViewIcon} />
                      )}
                    </button>
                  </div>
                  <p aria-live="polite" className={fieldErrorClass}>
                    {field.state.meta.errors[0]}
                  </p>
                </div>
              )}
            </form.Field>
          </div>

          <p aria-live="polite" className={`mt-1 ${fieldErrorClass}`}>
            {formError}
          </p>

          <div className="relative mt-1">
            {lastMethod === "email" && (
              <Badge
                className="-top-2 -right-2 absolute z-10"
                variant="default"
              >
                Last Used
              </Badge>
            )}
            <CtaButton
              className="w-full"
              disabled={isAuthLoading}
              type="submit"
            >
              {authMethod === "email" ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log in"
              )}
            </CtaButton>
          </div>
        </form>
      </div>

      {(showForgotPasswordLink || showSignupLink) && (
        <div className="flex flex-col gap-4 px-8 text-center text-muted-foreground text-xs">
          {showForgotPasswordLink && (
            <p>
              Forgot your password?{" "}
              <Link
                className="underline underline-offset-4 hover:text-primary"
                href="/forgot-password"
              >
                Reset Your Password
              </Link>
            </p>
          )}
          {showForgotPasswordLink && showSignupLink && <Separator />}
          {showSignupLink && (
            <p>
              Don&apos;t have an account?{" "}
              <Link
                className="underline underline-offset-4 hover:text-primary"
                href="/signup"
              >
                Register
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
