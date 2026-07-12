"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const authInFlightRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authInFlightRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    if (!(email && password)) {
      toast.error("Email and password are required");
      return;
    }

    authInFlightRef.current = true;
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to sign in");
        authInFlightRef.current = false;
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to sign in. Please try again.");
      authInFlightRef.current = false;
      setIsLoading(false);
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

      <form
        aria-busy={isLoading}
        className="grid gap-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            disabled={isLoading}
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
              disabled={isLoading}
              id="password"
              name="password"
              placeholder="Password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>
        <Button className="mt-1 w-full" disabled={isLoading} type="submit">
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>

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
