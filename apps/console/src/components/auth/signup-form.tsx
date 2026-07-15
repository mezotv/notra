"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { signupSchema } from "@/schemas/auth";
import type { AuthMethod } from "@/types/auth";

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const authInFlightRef = useRef(false);
  const isAuthLoading = authMethod !== null;

  async function handleSocialSignup(provider: "google" | "github") {
    if (authInFlightRef.current) {
      return;
    }

    authInFlightRef.current = true;
    setAuthMethod(provider);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create account");
        authInFlightRef.current = false;
        setAuthMethod(null);
      }
    } catch {
      toast.error("Failed to create account. Please try again.");
      authInFlightRef.current = false;
      setAuthMethod(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authInFlightRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validation = signupSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    authInFlightRef.current = true;
    setAuthMethod("email");
    try {
      const result = await authClient.signUp.email(validation.data);
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create account");
        authInFlightRef.current = false;
        setAuthMethod(null);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to create account. Please try again.");
      authInFlightRef.current = false;
      setAuthMethod(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="text-center">
        <h1 className="font-semibold text-xl lg:text-2xl">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          Use Notra Console without a subscription.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <Button
            className="w-full border-2 border-border bg-background hover:bg-muted"
            disabled={isAuthLoading}
            onClick={() => handleSocialSignup("google")}
            type="button"
            variant="outline"
          >
            {authMethod === "google" ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <Google className="mr-2 size-4" />
            )}
            Google
          </Button>
          <Button
            className="w-full border-2 border-border bg-background hover:bg-muted"
            disabled={isAuthLoading}
            onClick={() => handleSocialSignup("github")}
            type="button"
            variant="outline"
          >
            {authMethod === "github" ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <Github className="mr-2 size-4" />
            )}
            GitHub
          </Button>
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
          className="grid gap-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              autoComplete="name"
              disabled={isAuthLoading}
              id="name"
              name="name"
              placeholder="Your name"
              required
            />
          </div>
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
                autoComplete="new-password"
                className="pr-10"
                disabled={isAuthLoading}
                id="password"
                name="password"
                placeholder="At least 8 characters"
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
                Creating account...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>

      <p className="px-8 text-center text-muted-foreground text-xs">
        Already have an account?{" "}
        <Link
          className="underline underline-offset-4 hover:text-primary"
          href="/login"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
