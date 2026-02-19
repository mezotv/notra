"use client";

import {
  CreditCardIcon,
  Key01Icon,
  Notification03Icon,
  Settings01Icon,
  UserCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSettingsItem {
  label: string;
  url: string;
  icon: IconSvgElement;
}

const accountItems: NavSettingsItem[] = [
  {
    label: "Account",
    url: "settings/account",
    icon: UserCircleIcon,
  },
];

const organizationItems: NavSettingsItem[] = [
  {
    label: "General",
    url: "settings/general",
    icon: Settings01Icon,
  },
  {
    label: "Members",
    url: "settings/members",
    icon: UserGroupIcon,
  },
  {
    label: "Notifications",
    url: "settings/notifications",
    icon: Notification03Icon,
  },
  {
    label: "Billing & Usage",
    url: "billing",
    icon: CreditCardIcon,
  },
  {
    label: "API Keys",
    url: "billing/api-keys",
    icon: Key01Icon,
  },
];

interface NavSettingsProps {
  slug: string;
}

export function NavSettings({ slug }: NavSettingsProps) {
  const pathname = usePathname();
  const { open } = useSidebar();

  const isActive = (url: string) => pathname === `/${slug}/${url}`;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarMenu>
          {accountItems.map((item) => (
            <SidebarMenuButton
              isActive={isActive(item.url)}
              key={item.label}
              render={
                <Link href={`/${slug}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              }
              tooltip={item.label}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Organization</SidebarGroupLabel>
        <SidebarMenu>
          {organizationItems.map((item) => (
            <SidebarMenuButton
              isActive={isActive(item.url)}
              key={item.label}
              render={
                <Link href={`/${slug}/${item.url}`}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              }
              tooltip={item.label}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
