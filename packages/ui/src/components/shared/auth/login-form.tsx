"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import type {
  AuthMethod,
  LoginFormProps,
  PendingVerification,
  SocialProvider,
} from "../../../lib/auth-types";
import {
  getLastUsedLoginMethod,
  setLastUsedLoginMethod,
} from "../../../lib/last-login-method";
import { isNextRedirectError } from "../../../lib/redirect-error";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { CtaButton } from "../cta-button";
import { AuthEmailField } from "./auth-email-field";
import { AuthFormHeader } from "./auth-form-header";
import { AuthOrDivider } from "./auth-or-divider";
import { AuthPasswordField } from "./auth-password-field";
import { AuthSocialButtons } from "./auth-social-buttons";
import { EmailVerificationForm } from "./email-verification-form";

const LOGIN_ERROR_FALLBACK = "Failed to sign in. Please try again.";

const noop = () => {
  return;
};
const subscribeToNothing = () => noop;
const returnNull = () => null;

export function LoginForm({
  title = "Welcome back",
  description = "Log in to pick up where your team left off.",
  onSuccess,
  returnTo,
  showSignupLink = true,
  showForgotPasswordLink = true,
  initialError,
  initialPendingVerification,
  callbackPath,
  validators,
  signInWithPassword,
  verifyEmailCode,
  startSocialSignIn,
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

  const callbackURL = returnTo ?? callbackPath;

  function handleSocialLogin(provider: SocialProvider) {
    if (authInFlightRef.current) {
      return;
    }

    setFormError(null);
    authInFlightRef.current = true;
    setAuthMethod(provider);
    setLastUsedLoginMethod(provider);
    startSocialSignIn({ provider, returnTo: callbackURL }).catch((error) => {
      if (isNextRedirectError(error)) {
        return;
      }
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

      if (validators.email(value.email) || validators.password(value.password)) {
        return;
      }

      setFormError(null);
      authInFlightRef.current = true;
      setAuthMethod("email");
      try {
        const result = await signInWithPassword({
          email: value.email,
          password: value.password,
          returnTo: callbackURL,
        });

        if (result.status === "error") {
          setFormError(result.message || LOGIN_ERROR_FALLBACK);
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
        verifyEmailCode={verifyEmailCode}
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
                onBlur: ({ value }) => validators.email(value),
                onSubmit: ({ value }) => validators.email(value),
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
                onBlur: ({ value }) => validators.password(value),
                onSubmit: ({ value }) => validators.password(value),
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
            className="mt-3 text-destructive text-sm empty:hidden"
          >
            {formError}
          </p>

          <div className="relative mt-4 pt-2">
            {lastMethod === "email" && (
              <Badge
                className="-right-2 absolute top-0 z-10"
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
