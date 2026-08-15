"use client";

import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { verifyEmailCodeAction } from "@/lib/auth/password-actions";
import type { EmailVerificationFormProps } from "@/types/auth/form-ui";

export function EmailVerificationForm({
  pendingAuthenticationToken,
  email,
  returnTo,
  onSuccess,
}: EmailVerificationFormProps) {
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyEmailCodeAction({
        pendingAuthenticationToken,
        code,
        returnTo,
      }),
    onSuccess: (result) => {
      if (result.status === "success") {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign(result.redirectTo);
        }
        return;
      }

      setFormError(
        result.status === "error"
          ? result.message
          : "Verification failed. Please try again."
      );
    },
    onError: () => {
      setFormError("Verification failed. Please try again.");
    },
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <AuthFormHeader
        description={`We sent a 6-digit code to ${email || "your email address"}. Enter it below to continue.`}
        title="Check your email"
      />

      <form
        className="grid gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          verifyMutation.mutate();
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="verification-code">Verification code</Label>
          <Input
            autoComplete="one-time-code"
            autoFocus
            className="h-11 rounded-xl px-3.5 text-center font-mono text-lg tracking-[0.5em]"
            disabled={verifyMutation.isPending}
            id="verification-code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            value={code}
          />
        </div>

        <p aria-live="polite" className="min-h-5 text-destructive text-sm">
          {formError}
        </p>

        <CtaButton
          className="w-full"
          disabled={verifyMutation.isPending || code.length !== 6}
          type="submit"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </CtaButton>
      </form>
    </div>
  );
}
