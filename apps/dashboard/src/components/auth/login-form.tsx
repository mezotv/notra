"use client";

import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Badge } from "@notra/ui/components/ui/badge";
import { Separator } from "@notra/ui/components/ui/separator";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { AuthEmailField } from "@/components/auth/auth-email-field";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { AuthOrDivider } from "@/components/auth/auth-or-divider";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import {
  getLastUsedLoginMethod,
  setLastUsedLoginMethod,
} from "@/lib/auth/last-login-method";
import { signInWithPasswordAction } from "@/lib/auth/password-actions";
import { startSocialSignInAction } from "@/lib/auth/social-actions";
import { errorMessageOr } from "@/lib/utils";
import { loginSchema } from "@/schemas/auth/credentials";
import type { PendingVerification, SocialProvider } from "@/types/auth/form-ui";
import type { AuthMethod } from "@/types/auth/method";

const LOGIN_ERROR_FALLBACK = "Failed to sign in. Please try again.";

const noop = () => {
  return;
};
const subscribeToNothing = () => noop;
const returnNull = () => null;

export interface LoginFormProps {
  title?: string;
  description?: string;
  onSuccess?: () => void;
  returnTo?: string;
  showSignupLink?: boolean;
  showForgotPasswordLink?: boolean;
  initialError?: string;
  initialPendingVerification?: PendingVerification;
}

export function LoginForm({
  title = "Welcome back",
  description = "Log in to pick up where your team left off.",
  onSuccess,
  returnTo,
  showSignupLink = true,
  showForgotPasswordLink = true,
  initialError,
  initialPendingVerification,
}: LoginFormProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null
  );
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerification | null>(initialPendingVerification ?? null);
  const authInFlightRef = useRef(false);
  const lastMethod = useSyncExternalStore(
    subscribeToNothing,
    getLastUsedLoginMethod,
    returnNull
  );
  const isAuthLoading = authMethod !== null;

  const callbackURL = returnTo
    ? `/callback?returnTo=${encodeURIComponent(returnTo)}`
    : "/callback";

  function handleSocialLogin(provider: SocialProvider) {
    if (authInFlightRef.current) {
      return;
    }

    setFormError(null);
    authInFlightRef.current = true;
    flushSync(() => setAuthMethod(provider));
    setLastUsedLoginMethod(provider);
    startSocialSignInAction({ provider, returnTo: callbackURL }).catch(() => {
      authInFlightRef.current = false;
      setAuthMethod(null);
      setFormError("Social sign-in failed. Please try again.");
    });
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
        const result = await signInWithPasswordAction({
          email: parsed.data.email,
          password: parsed.data.password,
          returnTo: callbackURL,
        });

        if (result.status === "error") {
          setFormError(errorMessageOr(result.message, LOGIN_ERROR_FALLBACK));
          authInFlightRef.current = false;
          setAuthMethod(null);
          return;
        }

        if (result.status === "verification-required") {
          authInFlightRef.current = false;
          setAuthMethod(null);
          setPendingVerification({
            pendingAuthenticationToken: result.pendingAuthenticationToken,
            email: result.email,
          });
          return;
        }

        setLastUsedLoginMethod("email");
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign(result.redirectTo);
        }
      } catch (error) {
        console.error("Email login error:", error);
        setFormError(LOGIN_ERROR_FALLBACK);
        authInFlightRef.current = false;
        setAuthMethod(null);
      }
    },
  });

  if (pendingVerification) {
    return (
      <EmailVerificationForm
        email={pendingVerification.email}
        onSuccess={onSuccess}
        pendingAuthenticationToken={
          pendingVerification.pendingAuthenticationToken
        }
        returnTo={callbackURL}
      />
    );
  }

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
