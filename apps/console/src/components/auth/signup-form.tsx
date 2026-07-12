"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { authClient } from "@/lib/auth/client";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const authInFlightRef = useRef(false);

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
    setIsLoading(true);
    try {
      const result = await authClient.signUp.email(validation.data);
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create account");
        authInFlightRef.current = false;
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to create account. Please try again.");
      authInFlightRef.current = false;
      setIsLoading(false);
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

      <form
        aria-busy={isLoading}
        className="grid gap-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            autoComplete="name"
            disabled={isLoading}
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
              autoComplete="new-password"
              className="pr-10"
              disabled={isLoading}
              id="password"
              name="password"
              placeholder="At least 8 characters"
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
              Creating account...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>

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
