"use client";

import {
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  CLI_API_KEY_TTL_DAYS,
  CLI_VERIFICATION_CODE_PATTERN,
} from "@/lib/cli-auth/constants";
import { detectPlatform } from "@/lib/cli-auth/platform";
import type { CliAuthFormProps } from "@/types/cli-auth/form";

function subscribeToNothing() {
  return () => undefined;
}

function getServerPlatform(): string {
  return "";
}

export function CliAuthForm({ sessionId, organizations }: CliAuthFormProps) {
  const [organizationId, setOrganizationId] = useState(
    organizations[0]?.id ?? ""
  );
  const platform = useSyncExternalStore(
    subscribeToNothing,
    detectPlatform,
    getServerPlatform
  );
  const defaultName = platform ? `Notra CLI on ${platform}` : "";
  const [editedName, setEditedName] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState<
    "idle" | "pending" | "success"
  >("idle");
  const authorizationRequestRef = useRef<AbortController | null>(null);
  const name = editedName ?? defaultName;

  const selectedOrg =
    organizations.find((organization) => organization.id === organizationId) ??
    null;

  useEffect(() => {
    return () => authorizationRequestRef.current?.abort();
  }, []);

  const authorize = async () => {
    authorizationRequestRef.current?.abort();
    const controller = new AbortController();
    authorizationRequestRef.current = controller;
    setAuthorizationStatus("pending");
    try {
      const response = await fetch(
        `/api/cli/sessions/${encodeURIComponent(sessionId)}/authorize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            name: name.trim(),
            verificationCode,
          }),
          signal: controller.signal,
        }
      );
      if (controller.signal.aborted) {
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (controller.signal.aborted) {
          return;
        }
        toast.error(
          body.error ?? `Failed to authorize CLI (HTTP ${response.status})`
        );
        setAuthorizationStatus("idle");
        return;
      }
      setAuthorizationStatus("success");
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to authorize CLI"
      );
      setAuthorizationStatus("idle");
    }
  };

  if (organizations.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-semibold text-2xl tracking-tight">
          No organizations
        </h1>
        <p className="text-muted-foreground text-sm">
          You're not a member of any organization yet. Create one first, then
          come back to authorize the CLI.
        </p>
      </div>
    );
  }

  if (authorizationStatus === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} />
        </div>
        <h1 className="font-semibold text-2xl tracking-tight">Authorized</h1>
        <p className="text-muted-foreground text-sm">
          Return to your terminal, the CLI will continue automatically.
        </p>
        <p className="text-muted-foreground text-xs">You can close this tab.</p>
      </div>
    );
  }

  const isPending = authorizationStatus === "pending";
  const canSubmit =
    organizationId !== "" &&
    name.trim().length > 0 &&
    CLI_VERIFICATION_CODE_PATTERN.test(verificationCode) &&
    !isPending;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) {
          authorize();
        }
      }}
    >
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          Authorize Notra CLI
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick the organization the CLI should act on. We'll create a new API
          key with read &amp; write access and send it back to your terminal.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cli-auth-org">Organization</Label>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="h-auto w-full justify-between gap-2 px-2.5 py-2 active:scale-100"
                disabled={isPending}
                id="cli-auth-org"
                type="button"
                variant="outline"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarImage src={selectedOrg?.logo || undefined} />
                    <AvatarFallback className="text-xs">
                      {selectedOrg?.name.slice(0, 2) ?? "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-left font-medium text-sm">
                    {selectedOrg?.name ?? "Select an organization"}
                  </span>
                </span>
                <HugeiconsIcon
                  className="size-4 text-muted-foreground"
                  icon={ArrowDown01Icon}
                />
              </Button>
            }
          />
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {organizations.map((org) => (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 pr-8"
                  key={org.id}
                  onClick={() => setOrganizationId(org.id)}
                >
                  <Avatar className="size-6">
                    <AvatarImage src={org.logo || undefined} />
                    <AvatarFallback className="text-xs">
                      {org.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{org.name}</span>
                  {organizationId === org.id ? (
                    <HugeiconsIcon
                      className="absolute right-2 size-4 text-muted-foreground"
                      icon={Tick02Icon}
                    />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cli-auth-verification-code">Verification code</Label>
        <Input
          autoComplete="one-time-code"
          disabled={isPending}
          id="cli-auth-verification-code"
          maxLength={9}
          onChange={(event) =>
            setVerificationCode(event.target.value.toUpperCase())
          }
          placeholder="ABCD-1234"
          value={verificationCode}
        />
        <p className="text-muted-foreground text-xs">
          Enter the code shown by <code>notra auth login</code> in your
          terminal. Never authorize a code someone else sent you.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cli-auth-name">Key name</Label>
        <Input
          disabled={isPending}
          id="cli-auth-name"
          maxLength={100}
          onChange={(e) => setEditedName(e.target.value)}
          placeholder="Notra CLI on my-laptop"
          value={name}
        />
        <p className="text-muted-foreground text-xs">
          Shown in Settings → API Keys so you can revoke it later.
        </p>
      </div>

      <Button className="w-full" disabled={!canSubmit} type="submit">
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Authorizing…
          </>
        ) : (
          "Authorize"
        )}
      </Button>

      <p className="text-center text-muted-foreground text-xs">
        The key expires in {CLI_API_KEY_TTL_DAYS} days. You can revoke it at any
        time from Settings.
      </p>
    </form>
  );
}
