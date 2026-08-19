"use client";

import { Logout01Icon, User02Icon } from "@hugeicons/core-free-icons";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";
import { useHidePersonalData } from "@/lib/hooks/use-privacy-preferences";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function NavUser() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const { activeOrganization } = useOrganizationsContext();
  const { hidePersonalData } = useHidePersonalData();

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const slug = activeOrganization?.slug ?? "";

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/login");
          },
        },
      });
    } catch (_error) {
      toast.error("Failed to sign out");
      setIsSigningOut(false);
    }
  }

  if (!hasHydrated || (!user && isPending)) {
    return <Skeleton className="size-7 shrink-0 rounded-lg" />;
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label="Account"
            className="shrink-0 cursor-pointer rounded-lg outline-none ring-sidebar-ring focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-popup-open:ring-1 data-popup-open:ring-sidebar-border/70"
            disabled={isSigningOut}
            type="button"
          >
            <Avatar className="size-7 rounded-lg after:rounded-lg">
              <AvatarImage
                alt={user.name}
                className="rounded-lg"
                src={user.image ?? undefined}
              />
              <AvatarFallback className="flex items-center justify-center rounded-lg font-medium text-[0.6875rem] leading-none">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="min-w-56 rounded-lg"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg after:rounded-lg">
                <AvatarImage
                  alt={user.name}
                  className="rounded-lg"
                  src={user.image ?? undefined}
                />
                <AvatarFallback className="flex items-center justify-center rounded-lg font-medium text-xs leading-none">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className={cn(
                    "truncate font-medium text-foreground transition-[filter] duration-200",
                    hidePersonalData && "select-none blur-[5px] hover:blur-0"
                  )}
                >
                  {user.name}
                </span>
                <span
                  className={cn(
                    "truncate text-muted-foreground text-xs transition-[filter] duration-200",
                    hidePersonalData && "select-none blur-[5px] hover:blur-0"
                  )}
                >
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/${slug}/settings/account`)}
          >
            <HugeiconsIcon icon={User02Icon} />
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={isSigningOut}
          onClick={handleSignOut}
          variant="destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} />
          {isSigningOut ? "Signing out..." : "Log Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
