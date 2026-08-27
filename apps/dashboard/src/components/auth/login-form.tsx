"use client";

import { LoginForm as SharedLoginForm } from "@notra/ui/components/shared/auth/login-form";

import {
  signInWithPasswordAction,
  verifyEmailCodeAction,
} from "@/lib/auth/password-actions";
import { startSocialSignInAction } from "@/lib/auth/social-actions";
import { loginSchema } from "@/schemas/auth/credentials";
import type { LoginFormProps } from "@/types/auth/login-form";

const validators = {
  email: (value: string) =>
    loginSchema.shape.email.safeParse(value).error?.issues[0]?.message,
  password: (value: string) =>
    loginSchema.shape.password.safeParse(value).error?.issues[0]?.message,
};

export function LoginForm({ returnTo, ...props }: LoginFormProps) {
  return (
    <SharedLoginForm
      {...props}
      callbackPath="/callback"
      returnTo={
        returnTo
          ? `/callback?returnTo=${encodeURIComponent(returnTo)}`
          : undefined
      }
      signInWithPassword={signInWithPasswordAction}
      startSocialSignIn={startSocialSignInAction}
      validators={validators}
      verifyEmailCode={verifyEmailCodeAction}
    />
  );
}
