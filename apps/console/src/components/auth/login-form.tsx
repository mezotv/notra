"use client";

import { LoginForm as SharedLoginForm } from "@notra/ui/components/shared/auth/login-form";

import {
  signInWithPasswordAction,
  verifyEmailCodeAction,
} from "@/lib/auth/password-actions";
import { startSocialSignInAction } from "@/lib/auth/social-actions";
import { loginSchema } from "@/schemas/auth";
import type { ConsoleLoginFormProps } from "@/types/auth";

const validators = {
  email: (value: string) =>
    loginSchema.shape.email.safeParse(value).error?.issues[0]?.message,
  password: (value: string) =>
    loginSchema.shape.password.safeParse(value).error?.issues[0]?.message,
};

export function LoginForm(props: ConsoleLoginFormProps) {
  return (
    <SharedLoginForm
      {...props}
      callbackPath="/dashboard"
      description="Sign in to manage Notra."
      showForgotPasswordLink={false}
      showSignupLink={false}
      signInWithPassword={signInWithPasswordAction}
      startSocialSignIn={startSocialSignInAction}
      title="Notra Console"
      validators={validators}
      verifyEmailCode={verifyEmailCodeAction}
    />
  );
}
