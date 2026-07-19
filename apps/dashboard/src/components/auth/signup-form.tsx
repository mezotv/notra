"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Separator } from "@notra/ui/components/ui/separator";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SignupCreditsBanner } from "@/components/auth/signup-credits-banner";
import { SHOW_SIGNUP_CREDITS_BANNER } from "@/constants/signup-credits";
import { authClient } from "@/lib/auth/client";
import { errorMessageOr } from "@/lib/utils";
import { signupSchema } from "@/schemas/auth/credentials";
import type { AuthMethod } from "@/types/auth/method";
import {
  marketingAttributionSearchParams,
  persistMarketingAttribution,
  readMarketingAttributionFromValues,
} from "@/utils/marketing-attribution";
import { marketingAttributionUrlKeys } from "@/utils/marketing-attribution-keys";

const SIGNUP_ERROR_FALLBACK = "Failed to sign up. Please try again.";

const fieldErrorClass = "min-h-5 text-destructive text-sm";

export interface SignupFormProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  returnTo?: string;
  showLoginLink?: boolean;
  showForgotPasswordLink?: boolean;
}

export function SignupForm({
  title = "Create your account",
  description = "Start turning what you ship into what you publish.",
  onSuccess,
  returnTo,
  showLoginLink = true,
  showForgotPasswordLink = false,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const authInFlightRef = useRef(false);
  const [attributionParams] = useQueryStates(marketingAttributionSearchParams, {
    history: "replace",
    urlKeys: marketingAttributionUrlKeys,
  });
  const isAuthLoading = authMethod !== null;

  const attribution = readMarketingAttributionFromValues({
    landingPageH1Copy: attributionParams.dbLandingPageH1Copy,
    landingPageH1Variant: attributionParams.dbLandingPageH1Variant,
    source: attributionParams.dbSource,
    signupMethod: attributionParams.signupMethod,
  });

  function buildCallbackUrl(signupMethod: "email" | "google" | "github") {
    const params = new URLSearchParams();

    if (returnTo) {
      params.set("returnTo", encodeURIComponent(returnTo));
    }

    if (attribution.source) {
      params.set("db_source", attribution.source);
    }
    if (attribution.landingPageH1Variant) {
      params.set(
        "db_landing_page_h1_variant",
        attribution.landingPageH1Variant
      );
    }
    if (attribution.landingPageH1Copy) {
      params.set("db_landing_page_h1_copy", attribution.landingPageH1Copy);
    }

    params.set("signup_method", signupMethod);

    const query = params.toString();

    return query ? `/callback?${query}` : "/callback";
  }

  async function handleSocialSignup(provider: "google" | "github") {
    if (authInFlightRef.current) {
      return;
    }

    setFormError(null);
    authInFlightRef.current = true;
    flushSync(() => setAuthMethod(provider));
    try {
      persistMarketingAttribution({ ...attribution, signupMethod: provider });

      await authClient.signIn.social({
        provider,
        callbackURL: buildCallbackUrl(provider),
      });
    } catch (error) {
      console.error("Social signup error:", error);
      setFormError(SIGNUP_ERROR_FALLBACK);
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

      const parsed = signupSchema.safeParse(value);
      if (!parsed.success) {
        return;
      }

      setFormError(null);
      authInFlightRef.current = true;
      flushSync(() => setAuthMethod("email"));
      const fallbackName = parsed.data.email.split("@")[0] || "User";
      try {
        const result = await authClient.signUp.email({
          email: parsed.data.email,
          password: parsed.data.password,
          name: fallbackName,
        });

        if (result.error) {
          setFormError(
            errorMessageOr(result.error.message, SIGNUP_ERROR_FALLBACK)
          );
          authInFlightRef.current = false;
          setAuthMethod(null);
          return;
        }

        // Call onSuccess callback if provided, otherwise redirect through callback
        if (onSuccess) {
          onSuccess();
        } else {
          persistMarketingAttribution({
            ...attribution,
            signupMethod: "email",
          });
          window.location.assign(buildCallbackUrl("email"));
        }
      } catch (error) {
        console.error("Email signup error:", error);
        setFormError(SIGNUP_ERROR_FALLBACK);
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

      {SHOW_SIGNUP_CREDITS_BANNER && <SignupCreditsBanner />}

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <CtaButton
            className="w-full"
            disabled={isAuthLoading}
            onClick={() => handleSocialSignup("google")}
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
          <CtaButton
            className="w-full"
            disabled={isAuthLoading}
            onClick={() => handleSocialSignup("github")}
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
                  signupSchema.shape.email.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  signupSchema.shape.email.safeParse(value).error?.issues[0]
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
                  signupSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  signupSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Password</Label>
                  <div className="relative">
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      autoComplete="new-password"
                      className="h-11 rounded-xl px-4 pr-10"
                      disabled={isAuthLoading}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="At least 8 characters"
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

          <CtaButton
            className="mt-1 w-full"
            disabled={isAuthLoading}
            type="submit"
          >
            {authMethod === "email" ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </CtaButton>
        </form>
      </div>

      {(showForgotPasswordLink || showLoginLink) && (
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
          {showForgotPasswordLink && showLoginLink && <Separator />}
          {showLoginLink && (
            <p>
              Already have an account?{" "}
              <Link
                className="underline underline-offset-4 hover:text-primary"
                href="/login"
              >
                Log in
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
