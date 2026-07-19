"use client";

import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Badge } from "@notra/ui/components/ui/badge";
import { Separator } from "@notra/ui/components/ui/separator";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AuthEmailField } from "@/components/auth/auth-email-field";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthOrDivider } from "@/components/auth/auth-or-divider";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { authClient } from "@/lib/auth/client";
import { errorMessageOr } from "@/lib/utils";
import { loginSchema } from "@/schemas/auth/credentials";
import type { SocialProvider } from "@/types/auth/form-ui";
import type { AuthMethod } from "@/types/auth/method";

const LOGIN_ERROR_FALLBACK = "Failed to sign in. Please try again.";

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
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const authInFlightRef = useRef(false);
  const lastMethod = authClient.getLastUsedLoginMethod();
  const isAuthLoading = authMethod !== null;

  const callbackURL = returnTo
    ? `/callback?returnTo=${encodeURIComponent(returnTo)}`
    : "/callback";

  async function handleSocialLogin(provider: SocialProvider) {
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
      <AuthFormHeader description={description} title={title} />

      <div className="grid gap-4">
        <AuthSocialButtons
          authMethod={authMethod}
          disabled={isAuthLoading}
          lastMethod={lastMethod}
          onSelect={handleSocialLogin}
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
                  loginSchema.shape.email.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  loginSchema.shape.email.safeParse(value).error?.issues[0]
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
                  loginSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
                onSubmit: ({ value }) =>
                  loginSchema.shape.password.safeParse(value).error?.issues[0]
                    ?.message,
              }}
            >
              {(field) => (
                <AuthPasswordField
                  autoComplete="current-password"
                  disabled={isAuthLoading}
                  error={field.state.meta.errors[0]}
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  placeholder="Your password"
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
