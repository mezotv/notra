"use client";

import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@notra/ui/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { IMPERSONATION_SEARCH_DEBOUNCE_MS } from "@/constants/auth";
import { authClient } from "@/lib/auth/client";
import { hasAdminRole } from "@/lib/auth/role";
import type { UserImpersonationDialogProps } from "@/types/auth";
import { QUERY_KEYS } from "@/utils/query-keys";

const WORKOS_DASHBOARD_URL = "https://dashboard.workos.com/";

export function UserImpersonationDialog({
  currentUserId,
  onOpenChange,
  open,
}: UserImpersonationDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, IMPERSONATION_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.AUTH.adminUsers(debouncedSearch),
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        search: debouncedSearch,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data ?? [];
    },
    enabled: open,
  });

  const users = usersQuery.data ?? [];

  return (
    <CommandDialog
      description="Look up a user, then start impersonation from the WorkOS dashboard."
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton
      title="Impersonate user"
    >
      <Command shouldFilter={false}>
        <CommandInput
          onValueChange={setSearch}
          placeholder="Search users by name or email..."
          value={search}
        />
        <CommandList>
          {usersQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Loading users...
            </div>
          ) : (
            <>
              <CommandEmpty>
                {usersQuery.isError
                  ? "Failed to load users."
                  : "No users found."}
              </CommandEmpty>
              <CommandGroup heading="Users">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  let status: string | undefined;
                  if (isCurrentUser) {
                    status = "Current account";
                  } else if (hasAdminRole(user.role)) {
                    status = "Admin";
                  } else if (user.banned) {
                    status = "Banned";
                  }

                  return (
                    <CommandItem
                      key={user.id}
                      onSelect={() => {
                        window.open(WORKOS_DASHBOARD_URL, "_blank", "noopener");
                      }}
                      value={`${user.name} ${user.email} ${user.id}`}
                    >
                      <Avatar size="sm">
                        <AvatarImage alt="" src={user.image ?? undefined} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </div>
                      </div>
                      {status ? (
                        <span className="text-muted-foreground ml-auto text-xs">
                          {status}
                        </span>
                      ) : (
                        <HugeiconsIcon
                          className="text-muted-foreground ml-auto"
                          icon={LinkSquare02Icon}
                        />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-xs">
            Impersonation is started from the WorkOS dashboard. Find the user
            there and choose Impersonate.
          </p>
          <Button
            onClick={() => {
              window.open(WORKOS_DASHBOARD_URL, "_blank", "noopener");
            }}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={LinkSquare02Icon} />
            Open WorkOS
          </Button>
        </div>
      </Command>
    </CommandDialog>
  );
}
