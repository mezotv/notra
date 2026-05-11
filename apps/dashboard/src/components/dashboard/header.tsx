import { getCalApi } from "@calcom/embed-react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Message01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@notra/ui/components/ui/breadcrumb";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Separator } from "@notra/ui/components/ui/separator";
import { SidebarTrigger } from "@notra/ui/components/ui/sidebar";
import { cn } from "@notra/ui/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  CreditBalanceButton,
  CreditBalanceMenuItem,
} from "@/components/billing/credit-balance-button";
import { ChatTopbarTitle } from "@/components/dashboard/chat-topbar-title";
import { useFeedback } from "@/components/dashboard/feedback-context";
import {
  FeedbackForm,
  FeedbackPopover,
} from "@/components/dashboard/feedback-popover";

const NON_ORG_PATHS: string[] = [];

const SEGMENT_CONFIG: Record<string, { label?: string; href?: null }> = {
  billing: { label: "Billing & Usage" },
  automation: { href: null },
  brand: { href: null },
  "api-keys": { label: "API Keys" },
  identity: { label: "Identity & References" },
  schedules: { label: "Schedules" },
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const id = useId();
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const isInSettings = segments[1] === "settings";
  const preSettingsPathsRef = useRef<Record<string, string>>({});
  const activeSettingsShortcutSlugRef = useRef<string | null>(null);
  const { openFeedback } = useFeedback();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFeedbackOpen, setMobileFeedbackOpen] = useState(false);

  function triggerScheduleDemo() {
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-cal-namespace="15min"]'
    );
    btn?.click();
  }

  useEffect(() => {
    const activeSlug = activeSettingsShortcutSlugRef.current;
    if (!activeSlug) {
      return;
    }

    if (activeSlug !== slug || !isInSettings) {
      delete preSettingsPathsRef.current[activeSlug];
      activeSettingsShortcutSlugRef.current = null;
    }
  }, [isInSettings, slug]);

  useHotkey("Mod+,", (event) => {
    event.preventDefault();
    if (!slug) {
      return;
    }

    if (isInSettings) {
      const returnPath =
        activeSettingsShortcutSlugRef.current === slug
          ? preSettingsPathsRef.current[slug]
          : null;

      delete preSettingsPathsRef.current[slug];
      activeSettingsShortcutSlugRef.current = null;
      router.push(returnPath ?? `/${slug}`);
      return;
    }

    preSettingsPathsRef.current[slug] = pathname;
    activeSettingsShortcutSlugRef.current = slug;
    router.push(`/${slug}/settings/account`);
  });

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  useHotkey("D", () => {
    triggerScheduleDemo();
  });

  useHotkey("F", () => {
    openFeedback();
  });

  const isNonOrgPath = NON_ORG_PATHS.some((path) => pathname.startsWith(path));
  const breadcrumbSegments = isNonOrgPath ? segments : segments.slice(1);
  const isChatDetail =
    !isNonOrgPath &&
    breadcrumbSegments[0] === "chat" &&
    breadcrumbSegments.length >= 2;
  const chatDetailId = isChatDetail ? breadcrumbSegments[1] : null;

  const breadcrumbs = breadcrumbSegments.flatMap((segment, index) => {
    const href = isNonOrgPath
      ? `/${segments.slice(0, index + 1).join("/")}`
      : `/${segments.slice(0, index + 2).join("/")}`;
    const isLast = index === breadcrumbSegments.length - 1;
    const config = SEGMENT_CONFIG[segment];
    const label =
      config?.label ??
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isClickable = config?.href !== null;
    const isChatDetailLast = isChatDetail && isLast && chatDetailId;
    const content = (() => {
      if (isChatDetailLast) {
        return <ChatTopbarTitle chatId={chatDetailId} />;
      }

      if (isClickable) {
        return <BreadcrumbLink render={<Link href={href}>{label}</Link>} />;
      }

      if (isLast) {
        return <BreadcrumbPage>{label}</BreadcrumbPage>;
      }

      return <span>{label}</span>;
    })();

    const item = (
      <BreadcrumbItem
        className={cn(
          isChatDetailLast && "min-w-0",
          isClickable && !isChatDetailLast && "hover:underline"
        )}
        key={`${id}-item-${segment}`}
      >
        {content}
      </BreadcrumbItem>
    );

    if (isLast) {
      return [item];
    }

    return [
      item,
      <BreadcrumbSeparator key={`${id}-separator-${segment}`}>
        <HugeiconsIcon icon={ArrowRight01Icon} />
      </BreadcrumbSeparator>,
    ];
  });

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-dashed transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            className="mx-2 border-border border-l border-dashed bg-transparent"
            orientation="vertical"
          />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="min-w-0 flex-nowrap">
              {breadcrumbs}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <CreditBalanceButton className="hidden sm:inline-flex" />
          <div className="hidden items-center gap-2 lg:flex">
            <FeedbackPopover
              sharedState
              trigger={
                <Button className="gap-1.5" size="sm" variant="outline">
                  <HugeiconsIcon icon={Message01Icon} size={16} />
                  Feedback
                  <Kbd className="ml-1 hidden sm:inline-flex">F</Kbd>
                </Button>
              }
            />
            <Button
              className="gap-1.5"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              data-cal-link="dominikkoch/15min"
              data-cal-namespace="15min"
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={16} />
              Schedule a Demo
              <Kbd className="ml-1 hidden sm:inline-flex">D</Kbd>
            </Button>
          </div>
          <DropdownMenu onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="More actions"
                  className="lg:hidden"
                  size="icon-sm"
                  variant="outline"
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <CreditBalanceMenuItem className="sm:hidden" />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileFeedbackOpen(true);
                }}
              >
                <HugeiconsIcon icon={Message01Icon} />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerScheduleDemo();
                }}
              >
                <HugeiconsIcon icon={Calendar03Icon} />
                Schedule a Demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ResponsiveDialog
            onOpenChange={setMobileFeedbackOpen}
            open={mobileFeedbackOpen}
          >
            <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-md">
              <ResponsiveDialogHeader className="sr-only">
                <ResponsiveDialogTitle>Send feedback</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  Share your thoughts with us.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              {mobileFeedbackOpen ? (
                <FeedbackForm
                  autoFocus={false}
                  onSubmitted={() => setMobileFeedbackOpen(false)}
                />
              ) : null}
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>
    </header>
  );
}
