"use client";

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
import { Check, ChevronsUpDown, Home, LogOut, Plug } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface User {
  name: string;
  email: string;
  image?: string | null;
}

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
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="start"
            className="min-w-56"
            side={side}
            sideOffset={4}
          >
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuGroup>
              {(organizations ?? []).map((organization) => (
                <DropdownMenuItem
                  disabled={isSwitching}
                  key={organization.id}
                  onClick={() => switchOrganization(organization)}
                >
                  <Avatar className="size-6 rounded-md after:rounded-md">
                    <AvatarImage
                      className="rounded-md"
                      src={organization.logo ?? undefined}
                    />
                    <AvatarFallback className="rounded-md text-xs">
                      {organization.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{organization.name}</span>
                  {organization.id === activeOrganization.id ? (
                    <Check className="ml-auto" />
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

function ConsoleNavigation({ slug }: { slug: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/${slug}`, label: "Overview", icon: Home },
    {
      href: `/${slug}/integrations`,
      label: "Integrations",
      icon: Plug,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={
                  item.href === `/${slug}`
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                }
                render={
                  <Link href={item.href}>
                    <item.icon />
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

function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);
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
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="end"
            className="min-w-56"
            side={side}
            sideOffset={4}
          >
            <DropdownMenuLabel>
              <span className="block truncate text-foreground">
                {user.name}
              </span>
              <span className="block truncate font-normal">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onClick={signOut}
              variant="destructive"
            >
              <LogOut />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function ConsoleShell({
  activeOrganization,
  children,
  initialSidebarOpen,
  user,
}: {
  activeOrganization: Organization;
  children: React.ReactNode;
  initialSidebarOpen: boolean;
  user: User;
}) {
  return (
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <Sidebar className="border-none" collapsible="icon">
        <SidebarHeader>
          <OrganizationSwitcher activeOrganization={activeOrganization} />
        </SidebarHeader>
        <SidebarContent>
          <ConsoleNavigation slug={activeOrganization.slug} />
        </SidebarContent>
        <SidebarFooter>
          <UserMenu user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="font-medium text-sm">Notra Console</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
