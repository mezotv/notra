"use client";

import {
  Logout01Icon,
  PlugSocketIcon,
  SecurityCheckIcon,
  Tick02Icon,
  UnfoldMoreIcon,
  UserSwitchIcon,
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
import { Separator } from "@notra/ui/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { UserImpersonationDialog } from "@/components/auth/user-impersonation-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { authClient } from "@/lib/auth/client";
import type { ConsoleUser, UserMenuProps } from "@/types/auth";
import type { Organization } from "@/types/organization";

function OrganizationSwitcher({
  activeOrganization,
}: {
  activeOrganization: Organization;
}) {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const { data: organizations } = authClient.useListOrganizations();
  const [isSwitching, setIsSwitching] = useState(false);
  let side: "bottom" | "right" = "bottom";
  if (!isMobile && state === "collapsed") {
    side = "right";
  }

  async function switchOrganization(organization: {
    id: string;
    slug: string;
  }) {
    if (organization.id === activeOrganization.id) {
      return;
    }

    setIsSwitching(true);
    const result = await authClient.organization.setActive({
      organizationId: organization.id,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Failed to switch workspace");
      setIsSwitching(false);
      return;
    }

    router.push(`/${organization.slug}/integrations`);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="cursor-pointer"
                disabled={isSwitching}
                size="lg"
                tooltip={activeOrganization.name}
              >
                <Avatar className="size-8 rounded-lg after:rounded-lg">
                  <AvatarImage
                    alt=""
                    className="rounded-lg"
                    src={activeOrganization.logo ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg">
                    {activeOrganization.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeOrganization.name}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    Notra Console
                  </span>
                </div>
                <HugeiconsIcon className="ml-auto" icon={UnfoldMoreIcon} />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="start"
            className="min-w-56"
            side={side}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {(organizations ?? []).map((organization) => (
                <DropdownMenuItem
                  disabled={isSwitching}
                  key={organization.id}
                  onClick={() => switchOrganization(organization)}
                >
                  <Avatar className="size-6 rounded-md after:rounded-md">
                    <AvatarImage
                      alt=""
                      className="rounded-md"
                      src={organization.logo ?? undefined}
                    />
                    <AvatarFallback className="rounded-md text-xs">
                      {organization.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{organization.name}</span>
                  {organization.id === activeOrganization.id ? (
                    <HugeiconsIcon className="ml-auto" icon={Tick02Icon} />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ConsoleNavigation({
  isAdmin,
  slug,
}: {
  isAdmin: boolean;
  slug: string;
}) {
  const pathname = usePathname();
  const items = [
    {
      href: `/${slug}/integrations`,
      label: "Integrations",
      icon: PlugSocketIcon,
    },
    ...(isAdmin
      ? [
          {
            href: `/${slug}/review`,
            label: "Review Queue",
            icon: SecurityCheckIcon,
          },
        ]
      : []),
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname.startsWith(item.href)}
                render={
                  <Link href={item.href}>
                    <HugeiconsIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                }
                tooltip={item.label}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function UserMenu({ isAdmin, user }: UserMenuProps) {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [impersonationOpen, setImpersonationOpen] = useState(false);
  let side: "bottom" | "right" | "top" = "top";
  if (isMobile) {
    side = "bottom";
  } else if (state === "collapsed") {
    side = "right";
  }

  async function signOut() {
    setIsSigningOut(true);
    const result = await authClient.signOut();
    if (result.error) {
      toast.error(result.error.message ?? "Failed to sign out");
      setIsSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  className="cursor-pointer"
                  disabled={isSigningOut}
                  size="lg"
                  tooltip="Account"
                >
                  <Avatar className="size-8 rounded-lg after:rounded-lg">
                    <AvatarImage
                      alt={user.name}
                      className="rounded-lg"
                      src={user.image ?? undefined}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                  <HugeiconsIcon className="ml-auto" icon={UnfoldMoreIcon} />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              align="end"
              className="min-w-56"
              side={side}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className="block truncate text-foreground">
                    {user.name}
                  </span>
                  <span className="block truncate font-normal">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {isAdmin ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isSigningOut}
                    onClick={() => setImpersonationOpen(true)}
                  >
                    <HugeiconsIcon icon={UserSwitchIcon} />
                    Impersonate user
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSigningOut}
                onClick={signOut}
                variant="destructive"
              >
                <HugeiconsIcon icon={Logout01Icon} />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {isAdmin ? (
        <UserImpersonationDialog
          currentUserId={user.id}
          onOpenChange={setImpersonationOpen}
          open={impersonationOpen}
        />
      ) : null}
    </>
  );
}

export function ConsoleShell({
  activeOrganization,
  children,
  initialSidebarOpen,
  isAdmin,
  user,
}: {
  activeOrganization: Organization;
  children: React.ReactNode;
  initialSidebarOpen: boolean;
  isAdmin: boolean;
  user: ConsoleUser;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden overscroll-none">
      <SidebarProvider
        className="min-h-0! flex-1 overflow-hidden overscroll-none"
        defaultOpen={initialSidebarOpen}
      >
        <Sidebar className="border-none" collapsible="icon" variant="inset">
          <SidebarHeader>
            <OrganizationSwitcher activeOrganization={activeOrganization} />
          </SidebarHeader>
          <SidebarContent>
            <ConsoleNavigation
              isAdmin={isAdmin}
              slug={activeOrganization.slug}
            />
          </SidebarContent>
          <SidebarFooter>
            <ThemeToggle />
            <UserMenu isAdmin={isAdmin} user={user} />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-dashed transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  className="mx-2 border-border border-l border-dashed bg-transparent"
                  orientation="vertical"
                />
                <span className="font-medium text-sm">Notra Console</span>
              </div>
            </div>
          </header>
          <div className="@container/main flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
