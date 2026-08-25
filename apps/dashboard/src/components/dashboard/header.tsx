import { getCalApi } from "@calcom/embed-react";
import { ArrowRight01Icon, SearchIcon } from "@hugeicons/core-free-icons";
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
import { Kbd, KbdGroup } from "@notra/ui/components/ui/kbd";
import { useIsApplePlatform } from "@notra/ui/hooks/use-is-apple-platform";
import { cn } from "@notra/ui/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { useCommandPalette } from "@/components/command-palette/command-palette-context";
import { BrandTopbarIdentitySelector } from "@/components/dashboard/brand-topbar-identity-selector";
import { ChatTopbarTitle } from "@/components/dashboard/chat-topbar-title";
import { ContentTopbarTitle } from "@/components/dashboard/content-topbar-title";
import { useFeedback } from "@/components/dashboard/feedback-context";
import { FeedbackForm } from "@/components/dashboard/feedback-popover";
import { GeoTopbarProjectSwitcher } from "@/components/dashboard/geo-topbar-project-switcher";
import { NavUser } from "@/components/dashboard/nav-user";
import { SidebarToggle } from "@/components/dashboard/sidebar-toggle";
import { GEO_DEFAULT_TAB, GEO_TAB_BREADCRUMB_LABELS } from "@/constants/geo";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { withGeoProject } from "@/utils/geo-paths";

const NON_ORG_PATHS: string[] = [];

const SEGMENT_CONFIG: Record<string, { label?: string; href?: null }> = {
  collection: { label: "Collections" },
  billing: { label: "Billing & Usage" },
  automation: { href: null },
  brand: { href: null },
  "api-keys": { label: "API Keys" },
  identity: { label: "Brand Identity" },
  schedules: { label: "Schedules" },
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [geoProjectParam] = useGeoProjectQueryState();
  const id = useId();
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const isInSettings = segments[1] === "settings";
  const preSettingsPathsRef = useRef<Record<string, string>>({});
  const activeSettingsShortcutSlugRef = useRef<string | null>(null);
  const {
    open: feedbackOpen,
    setOpen: setFeedbackOpen,
    openFeedback,
  } = useFeedback();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const isApplePlatform = useIsApplePlatform();

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

  useHotkey("F", () => {
    openFeedback();
  });

  useHotkey("S", () => {
    triggerScheduleDemo();
  });

  const isNonOrgPath = NON_ORG_PATHS.some((path) => pathname.startsWith(path));
  const breadcrumbSegments = isNonOrgPath ? segments : segments.slice(1);
  const isChatDetail =
    !isNonOrgPath &&
    breadcrumbSegments[0] === "chat" &&
    breadcrumbSegments.length >= 2;
  const chatDetailId = isChatDetail ? breadcrumbSegments[1] : null;
  const isCollectionDetail =
    !isNonOrgPath &&
    breadcrumbSegments[0] === "collection" &&
    breadcrumbSegments.length >= 2;
  const isContentDetail =
    !isNonOrgPath &&
    breadcrumbSegments[0] === "content" &&
    breadcrumbSegments.length >= 2;
  const contentDetailId = isContentDetail ? breadcrumbSegments[1] : null;
  const isBrandIdentity =
    !isNonOrgPath &&
    breadcrumbSegments[0] === "brand" &&
    breadcrumbSegments[1] === "identity";
  const isGeo = !isNonOrgPath && breadcrumbSegments[0] === "geo";

  const displayBreadcrumbSegments = isCollectionDetail
    ? ["content", "collection"]
    : breadcrumbSegments;

  const brandIdentityBreadcrumbs = [
    <BreadcrumbItem
      className="hover:underline"
      key={`${id}-brand-identity-link`}
    >
      <BreadcrumbLink
        render={<Link href={`/${slug}/brand/identity`}>Brand Identity</Link>}
      />
    </BreadcrumbItem>,
    <BreadcrumbSeparator key={`${id}-brand-identity-sep`}>
      <HugeiconsIcon icon={ArrowRight01Icon} />
    </BreadcrumbSeparator>,
    <BreadcrumbItem className="min-w-0" key={`${id}-brand-identity-selector`}>
      <BrandTopbarIdentitySelector slug={slug ?? ""} />
    </BreadcrumbItem>,
  ];

  const genericBreadcrumbs = displayBreadcrumbSegments.flatMap(
    (segment, index) => {
      const href = (() => {
        if (isCollectionDetail && segment === "content") {
          return `/${slug}/content`;
        }
        if (isCollectionDetail && segment === "collection") {
          return `/${slug}/content`;
        }
        return isNonOrgPath
          ? `/${segments.slice(0, index + 1).join("/")}`
          : `/${segments.slice(0, index + 2).join("/")}`;
      })();
      const isLast = index === displayBreadcrumbSegments.length - 1;
      const config = SEGMENT_CONFIG[segment];
      const label =
        config?.label ??
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      const isClickable = config?.href !== null;
      const isChatDetailLast = isChatDetail && isLast && chatDetailId;
      const isContentDetailLast = isContentDetail && isLast && contentDetailId;
      const content = (() => {
        if (isChatDetailLast) {
          return <ChatTopbarTitle chatId={chatDetailId} />;
        }

        if (isContentDetailLast) {
          return <ContentTopbarTitle contentId={contentDetailId} />;
        }

        if (isCollectionDetail && isLast) {
          return <BreadcrumbPage>{label}</BreadcrumbPage>;
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
            (isChatDetailLast || isContentDetailLast) && "min-w-0",
            isClickable &&
              !(
                isChatDetailLast ||
                isCollectionDetail ||
                isContentDetailLast
              ) &&
              "hover:underline"
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
    }
  );

  const geoSectionSegments = breadcrumbSegments.slice(1);
  const geoProjectId = geoProjectParam ?? undefined;
  const geoTabLabel =
    GEO_TAB_BREADCRUMB_LABELS[searchParams.get("tab") ?? GEO_DEFAULT_TAB] ??
    GEO_TAB_BREADCRUMB_LABELS[GEO_DEFAULT_TAB] ??
    "Visibility";

  const geoSectionBreadcrumbs =
    geoSectionSegments.length > 0
      ? geoSectionSegments.flatMap((segment, index) => {
          const isLast = index === geoSectionSegments.length - 1;
          const href = withGeoProject(
            `/${segments.slice(0, index + 3).join("/")}`,
            geoProjectId
          );
          const label =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " ");
          return [
            <BreadcrumbSeparator key={`${id}-geo-sep-${segment}`}>
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </BreadcrumbSeparator>,
            <BreadcrumbItem
              className={cn(isLast && "min-w-0", !isLast && "hover:underline")}
              key={`${id}-geo-item-${segment}`}
            >
              {isLast ? (
                <BreadcrumbPage className="block truncate">
                  {label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={href}>{label}</Link>} />
              )}
            </BreadcrumbItem>,
          ];
        })
      : [
          <BreadcrumbSeparator key={`${id}-geo-tab-sep`}>
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </BreadcrumbSeparator>,
          <BreadcrumbItem className="min-w-0" key={`${id}-geo-tab`}>
            <BreadcrumbPage className="block truncate">
              {geoTabLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>,
        ];

  const geoBreadcrumbs = [
    <BreadcrumbItem className="hover:underline" key={`${id}-geo-link`}>
      <BreadcrumbLink
        render={
          <Link href={withGeoProject(`/${slug}/geo`, geoProjectId)}>Geo</Link>
        }
      />
    </BreadcrumbItem>,
    <GeoTopbarProjectSwitcher key={`${id}-geo-project-switcher`} />,
    ...geoSectionBreadcrumbs,
  ];

  const breadcrumbs = (() => {
    if (isBrandIdentity) {
      return brandIdentityBreadcrumbs;
    }
    if (isGeo) {
      return geoBreadcrumbs;
    }
    return genericBreadcrumbs;
  })();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-muted transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="grid h-full w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex h-full min-w-0 items-center gap-2 overflow-hidden">
          <SidebarToggle className="-mx-1.5" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="min-w-0 flex-nowrap gap-2">
              {breadcrumbs}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <button
          aria-label="Search"
          className="@container/search hidden h-8 w-48 cursor-pointer items-center @[8rem]/search:justify-start justify-center gap-2 rounded-lg border bg-background/60 @[8rem]/search:px-3 px-2 text-muted-foreground text-sm transition-colors hover:bg-muted/60 md:flex lg:w-64 xl:w-80"
          onClick={() => setCommandPaletteOpen(true)}
          type="button"
        >
          <HugeiconsIcon className="shrink-0" icon={SearchIcon} size={16} />
          <span className="@[8rem]/search:block hidden min-w-0 flex-1 truncate text-left">
            Search
          </span>
          <KbdGroup className="@[14rem]/search:flex hidden shrink-0">
            <Kbd>{isApplePlatform ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>
        <div className="flex h-full min-w-0 items-center justify-end gap-2">
          <button
            aria-hidden
            className="hidden"
            data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            data-cal-link="dominikkoch/15min"
            data-cal-namespace="15min"
            tabIndex={-1}
            type="button"
          />
          <NavUser />
          <ResponsiveDialog onOpenChange={setFeedbackOpen} open={feedbackOpen}>
            <ResponsiveDialogContent className="gap-0 p-0 sm:max-w-md">
              <ResponsiveDialogHeader className="sr-only">
                <ResponsiveDialogTitle>Send feedback</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  Share your thoughts with us.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              {feedbackOpen ? (
                <FeedbackForm
                  autoFocus={false}
                  onSubmitted={() => setFeedbackOpen(false)}
                />
              ) : null}
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>
    </header>
  );
}
