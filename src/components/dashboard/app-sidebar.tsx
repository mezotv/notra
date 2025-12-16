"use client";

import {
  ActivityIcon,
  DollarIcon,
  Home01Icon,
  InfinityIcon,
  Link01Icon,
  PackageIcon,
  PercentIcon,
  PieChart01Icon,
  Settings01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  Store01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import type { Route } from "@/components/dashboard/nav-main";
import DashboardNavigation from "@/components/dashboard/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { OrgSelector } from "./org-selector";

const dashboardRoutes: Route[] = [
  {
    id: "home",
    title: "Home",
    icon: Home01Icon,
    link: "#",
  },
  {
    id: "products",
    title: "Products",
    icon: PackageIcon,
    link: "#",
    subs: [
      {
        title: "Catalogue",
        link: "#",
        icon: PackageIcon,
      },
      {
        title: "Checkout Links",
        link: "#",
        icon: Link01Icon,
      },
      {
        title: "Discounts",
        link: "#",
        icon: PercentIcon,
      },
    ],
  },
  {
    id: "usage-billing",
    title: "Usage Billing",
    icon: PieChart01Icon,
    link: "#",
    subs: [
      {
        title: "Meters",
        link: "#",
        icon: PieChart01Icon,
      },
      {
        title: "Events",
        link: "#",
        icon: ActivityIcon,
      },
    ],
  },
  {
    id: "benefits",
    title: "Benefits",
    icon: SparklesIcon,
    link: "#",
  },
  {
    id: "customers",
    title: "Customers",
    icon: UserIcon,
    link: "#",
  },
  {
    id: "sales",
    title: "Sales",
    icon: ShoppingBag01Icon,
    link: "#",
    subs: [
      {
        title: "Orders",
        link: "#",
        icon: ShoppingBag01Icon,
      },
      {
        title: "Subscriptions",
        link: "#",
        icon: InfinityIcon,
      },
    ],
  },
  {
    id: "storefront",
    title: "Storefront",
    icon: Store01Icon,
    link: "#",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: PieChart01Icon,
    link: "#",
  },
  {
    id: "finance",
    title: "Finance",
    icon: DollarIcon,
    link: "#",
    subs: [
      { title: "Incoming", link: "#" },
      { title: "Outgoing", link: "#" },
      { title: "Payout Account", link: "#" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings01Icon,
    link: "#",
    subs: [
      { title: "General", link: "#" },
      { title: "Webhooks", link: "#" },
      { title: "Custom Fields", link: "#" },
    ],
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <OrgSelector />

        <motion.div
          animate={{ opacity: 1 }}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          transition={{ duration: 0.8 }}
        >
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
    </Sidebar>
  );
}
