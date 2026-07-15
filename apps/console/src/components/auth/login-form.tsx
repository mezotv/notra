"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { authClient } from "@/lib/auth/client";
import { useAuthFlow } from "@/lib/auth/use-auth-flow";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { authMethod, isAuthLoading, begin, reset, signInWithProvider } =
    useAuthFlow("Failed to sign in. Please try again.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    if (!(email && password)) {
      toast.error("Email and password are required");
      return;
    }

    if (!begin("email")) {
      return;
    }
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to sign in");
        reset();
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to sign in. Please try again.");
      reset();
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="text-center">
        <h1 className="font-semibold text-xl lg:text-2xl">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Log in to manage your integrations.
        </p>
      </div>

      <div className="grid gap-6">
        <SocialAuthButtons
          authMethod={authMethod}
          disabled={isAuthLoading}
          onSelect={signInWithProvider}
        />

        <div className="relative flex items-center">
          <span className="inline-block h-px w-full border-t bg-border" />
          <span className="shrink-0 px-2 text-muted-foreground text-xs uppercase">
            Or
          </span>
          <span className="inline-block h-px w-full border-t bg-border" />
        </div>

        <form
          aria-busy={isAuthLoading}
          className="grid gap-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              disabled={isAuthLoading}
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                autoComplete="current-password"
                className="pr-10"
                disabled={isAuthLoading}
                id="password"
                name="password"
                placeholder="Password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
                disabled={isAuthLoading}
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? (
                  <HugeiconsIcon className="size-4" icon={ViewOffIcon} />
                ) : (
                  <HugeiconsIcon className="size-4" icon={ViewIcon} />
                )}
              </button>
            </div>
          </div>
          <Button
            className="mt-1 w-full"
            disabled={isAuthLoading}
            type="submit"
          >
            {authMethod === "email" ? (
              <>
                <Loader2Icon className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>

      <div className="space-y-4 px-8 text-center text-muted-foreground text-xs">
        <p>
          Forgot your password?{" "}
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href="https://app.usenotra.com/forgot-password"
          >
            Reset it in Notra
          </Link>
        </p>
        <p>
          Don&apos;t have an account?{" "}
          <Link
            className="underline underline-offset-4 hover:text-primary"
            href="/signup"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
