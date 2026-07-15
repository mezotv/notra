"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Loader2Icon } from "lucide-react";
import type { SocialAuthButtonsProps } from "@/types/auth";

export function SocialAuthButtons({
  authMethod,
  disabled,
  onSelect,
}: SocialAuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        className="w-full border-2 border-border bg-background hover:bg-muted"
        disabled={disabled}
        onClick={() => onSelect("google")}
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
        disabled={disabled}
        onClick={() => onSelect("github")}
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
  );
}
