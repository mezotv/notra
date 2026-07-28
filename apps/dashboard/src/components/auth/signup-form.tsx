"use client";

import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Separator } from "@notra/ui/components/ui/separator";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AuthEmailField } from "@/components/auth/auth-email-field";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthOrDivider } from "@/components/auth/auth-or-divider";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { SignupCreditsBanner } from "@/components/auth/signup-credits-banner";
import { authClient } from "@/lib/auth/client";
import { errorMessageOr } from "@/lib/utils";
import { signupSchema } from "@/schemas/auth/credentials";
import type { SocialProvider } from "@/types/auth/form-ui";
import type { AuthMethod } from "@/types/auth/method";
import {
  marketingAttributionSearchParams,
  persistMarketingAttribution,
  readMarketingAttributionFromValues,
} from "@/utils/marketing-attribution";
import { marketingAttributionUrlKeys } from "@/utils/marketing-attribution-keys";

const SIGNUP_ERROR_FALLBACK = "Failed to sign up. Please try again.";

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

  function buildCallbackUrl(signupMethod: "email" | SocialProvider) {
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

  async function handleSocialSignup(provider: SocialProvider) {
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
      <AuthFormHeader description={description} title={title} />

      <SignupCreditsBanner />

      <div className="grid gap-4">
        <AuthSocialButtons
          authMethod={authMethod}
          disabled={isAuthLoading}
          onSelect={handleSocialSignup}
        />

        <AuthOrDivider />

        <form
          aria-busy={isAuthLoading}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setFormError(null);
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
                <AuthEmailField
                  disabled={isAuthLoading}
                  error={field.state.meta.errors[0]}
                  id={field.name}
                  label="Email"
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  placeholder="jane@company.com"
                  value={field.state.value}
                />
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
                <AuthPasswordField
                  autoComplete="new-password"
                  disabled={isAuthLoading}
                  error={field.state.meta.errors[0]}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  placeholder="At least 8 characters"
                  value={field.state.value}
                />
              )}
            </form.Field>
          </div>

          <p
            aria-live="polite"
            className="mt-1 min-h-5 text-destructive text-sm"
          >
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
