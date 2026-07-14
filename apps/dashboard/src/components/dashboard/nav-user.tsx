"use client";

import {
  Logout01Icon,
  Moon02Icon,
  MoreVerticalCircle01Icon,
  Sun03Icon,
  User02Icon,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Kbd } from "@notra/ui/components/ui/kbd";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  const { isMobile, state } = useSidebar();
  const { setTheme, resolvedTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  let dropdownSide: "bottom" | "right" | "top" = "top";
  if (isMobile) {
    dropdownSide = "bottom";
  } else if (isCollapsed) {
    dropdownSide = "right";
  }
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
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

  useHotkey("D", toggleTheme);

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
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled size="lg" tooltip={"Account"}>
            <Skeleton className="size-8 rounded-lg" />
            {!isCollapsed && (
              <>
                <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="ml-auto size-4" />
              </>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className={cn(
                  "cursor-pointer data-popup-open:bg-sidebar-accent/90 data-popup-open:text-sidebar-accent-foreground data-popup-open:ring-1 data-popup-open:ring-sidebar-border/70",
                  isCollapsed ? "size-10 min-w-0 justify-center p-1" : ""
                )}
                disabled={isSigningOut}
                size="lg"
                tooltip={"Account"}
              >
                <Avatar className="size-8 rounded-lg after:rounded-lg">
                  <AvatarImage
                    alt={user.name}
                    className="rounded-lg"
                    src={user.image ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span
                        className={cn(
                          "truncate font-medium transition-[filter] duration-200",
                          hidePersonalData &&
                            "select-none blur-[5px] hover:blur-0"
                        )}
                      >
                        {user.name}
                      </span>
                      <span
                        className={cn(
                          "truncate text-muted-background text-xs transition-[filter] duration-200",
                          hidePersonalData &&
                            "select-none blur-[5px] hover:blur-0"
                        )}
                      >
                        {user.email}
                      </span>
                    </div>
                    <HugeiconsIcon
                      className="ml-auto size-4"
                      icon={MoreVerticalCircle01Icon}
                    />
                  </>
                )}
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={dropdownSide}
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
                    <AvatarFallback className="rounded-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span
                      className={cn(
                        "truncate font-medium text-foreground transition-[filter] duration-200",
                        hidePersonalData &&
                          "select-none blur-[5px] hover:blur-0"
                      )}
                    >
                      {user.name}
                    </span>
                    <span
                      className={cn(
                        "truncate text-muted-foreground text-xs transition-[filter] duration-200",
                        hidePersonalData &&
                          "select-none blur-[5px] hover:blur-0"
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
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={toggleTheme}
              >
                <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} />
                {isDark ? "Light Mode" : "Dark Mode"}
                <Kbd className="ml-auto">D</Kbd>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
