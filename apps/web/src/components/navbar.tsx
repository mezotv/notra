"use client";

import {
  Cancel01Icon,
  Copy01Icon,
  Download01Icon,
  Menu02Icon,
  PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { LiquidGlass } from "@notra/ui/components/ui/glasscn/liquid-glass";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND_ASSETS } from "@/lib/brand/constants";
import { getNavbarVariantForPath } from "@/lib/navigation/navbar-variant";
import type { NavbarProps } from "@/types/navbar";
import { copySvgAsset } from "@/utils/copy-svg-asset";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import {
  MARKETING_NAV,
  type MarketingNavCard,
  type MarketingNavGroup,
  type MarketingNavRailItem,
} from "@/utils/navigation";
import { NotraMark, notraMarkSvgString } from "./notra-mark";
import { ThemeToggle } from "./theme-toggle";
import { TrackedSignupLink } from "./tracked-signup-link";

const SIGNIN_URL = "https://app.usenotra.com/login";
const HOVER_CLOSE_DELAY = 120;
const CONTENT_SLIDE = 48;
const EASE = [0.32, 0.72, 0, 1] as const;
const SWAP_EASE = [0.25, 0.1, 0.25, 1] as const;
const PANEL_PERSPECTIVE = 2000;
const PANEL_SCALE_IN = {
  opacity: 0,
  rotateX: -30,
  scale: 0.9,
} as const;
const PANEL_SCALE_OUT = {
  opacity: 0,
  rotateX: -10,
  scale: 0.95,
} as const;
const PANEL_SCALE_REST = {
  opacity: 1,
  rotateX: 0,
  scale: 1,
} as const;
const ENTER_EXIT_TRANSITION = {
  duration: 0.2,
  ease: SWAP_EASE,
};
const MORPH_TRANSITION = {
  duration: 0.28,
  ease: EASE,
};
const SHELL_TRANSITION = {
  duration: 0.32,
  ease: EASE,
};
const SCROLL_THRESHOLD = 64;
const ISLAND_CHROME =
  "inset-shadow-lg inset-shadow-white bg-white shadow-black/8 shadow-lg ring-1 ring-black/5 dark:inset-shadow-white/3 dark:bg-neutral-950 dark:shadow-black/50 dark:shadow-xl dark:ring-white/10";
const SWAP_TRANSITION = {
  duration: 0.15,
  ease: SWAP_EASE,
};
const contentVariants = {
  enter: (direction: number) => ({
    x: direction * CONTENT_SLIDE,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction * -CONTENT_SLIDE,
    opacity: 0,
  }),
};

interface PanelSize {
  width: number;
  height: number;
}

const SECTION_HEADING_CLASS =
  "px-2 pb-1 font-medium text-neutral-400 text-xs uppercase tracking-wider dark:text-neutral-500";

function MegaCard({
  card,
  onSelect,
}: {
  card: MarketingNavCard;
  onSelect: () => void;
}) {
  const className =
    "flex h-40 w-44 flex-col justify-between rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-100/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10";
  const body = (
    <>
      <span className="inset-shadow-sm inset-shadow-white flex size-9 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-black/5 shadow-sm ring-1 ring-black/5 dark:inset-shadow-white/8 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/10">
        <HugeiconsIcon className="size-5" icon={card.icon} />
      </span>
      <span className="block">
        <span className="block font-medium text-neutral-950 text-sm dark:text-white">
          {card.label}
        </span>
        <span className="mt-1 block text-neutral-500 text-xs leading-relaxed dark:text-neutral-400">
          {card.description}
        </span>
      </span>
    </>
  );

  if (card.external) {
    return (
      <a
        className={className}
        href={card.href}
        onClick={onSelect}
        rel="noopener noreferrer"
        role="menuitem"
        target="_blank"
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={card.href}
      onClick={onSelect}
      role="menuitem"
    >
      {body}
    </Link>
  );
}

function RailItem({
  item,
  onSelect,
}: {
  item: MarketingNavRailItem;
  onSelect: () => void;
}) {
  const className =
    "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none dark:hover:bg-white/6 dark:focus-visible:bg-white/6";
  const body = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
        <HugeiconsIcon className="size-4" icon={item.icon} />
      </span>
      <span className="font-medium text-neutral-800 text-sm dark:text-neutral-200">
        {item.label}
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        className={className}
        href={item.href}
        onClick={onSelect}
        rel="noopener noreferrer"
        role="menuitem"
        target="_blank"
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={item.href}
      onClick={onSelect}
      role="menuitem"
    >
      {body}
    </Link>
  );
}

function MegaPanel({
  group,
  onSelect,
}: {
  group: MarketingNavGroup;
  onSelect: () => void;
}) {
  return (
    <div className="flex">
      <div className="flex flex-col gap-2 p-3">
        <p className={SECTION_HEADING_CLASS}>{group.cardsHeading}</p>
        <div className="flex gap-2">
          {group.cards.map((card) => (
            <MegaCard card={card} key={card.href} onSelect={onSelect} />
          ))}
        </div>
      </div>
      <div className="flex w-52 flex-col gap-2 border-neutral-200/70 border-l p-3 dark:border-white/10">
        <p className={SECTION_HEADING_CLASS}>{group.railHeading}</p>
        <div className="flex flex-col gap-0.5">
          {group.rail.map((item) => (
            <RailItem item={item} key={item.href} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar({ variant }: NavbarProps = {}) {
  const pathname = usePathname();
  const resolvedVariant = variant ?? getNavbarVariantForPath(pathname);
  const tracksScroll = resolvedVariant === "island";
  const isStatic = resolvedVariant === "static";

  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [panelSizes, setPanelSizes] = useState<Map<string, PanelSize>>(
    new Map()
  );
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const measureRefs = useRef(new Map<string, HTMLDivElement>());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousGroupRef = useRef<string | null>(null);

  const groups = useMemo<MarketingNavGroup[]>(
    () =>
      MARKETING_NAV.filter(
        (entry): entry is MarketingNavGroup => entry.type === "group"
      ),
    []
  );

  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > SCROLL_THRESHOLD);
  });

  useEffect(() => {
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveGroup(null);
    }, HOVER_CLOSE_DELAY);
  }, [cancelClose]);

  const openGroup = useCallback(
    (label: string) => {
      cancelClose();
      setActiveGroup(label);
    },
    [cancelClose]
  );

  const closePanel = useCallback(() => setActiveGroup(null), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveGroup(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const nodes = measureRefs.current;
    if (nodes.size === 0) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const next = new Map<string, PanelSize>();
      for (const [label, node] of nodes) {
        const rect = node.getBoundingClientRect();
        next.set(label, { width: rect.width, height: rect.height });
      }
      setPanelSizes(next);
    });
    for (const node of nodes.values()) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    previousGroupRef.current = activeGroup;
  }, [activeGroup]);

  const activeGroupData = activeGroup
    ? groups.find((group) => group.label === activeGroup)
    : null;
  const activeSize = activeGroup ? panelSizes.get(activeGroup) : undefined;

  let slideDirection = 0;
  const previousActive = previousGroupRef.current;
  if (activeGroup && previousActive && activeGroup !== previousActive) {
    const currentIndex = groups.findIndex((g) => g.label === activeGroup);
    const previousIndex = groups.findIndex((g) => g.label === previousActive);
    if (currentIndex !== -1 && previousIndex !== -1) {
      slideDirection = currentIndex > previousIndex ? 1 : -1;
    }
  }

  const direction = reduceMotion ? 0 : slideDirection;
  const morphTransition = reduceMotion ? { duration: 0 } : MORPH_TRANSITION;
  const enterExitTransition = reduceMotion
    ? { duration: 0 }
    : ENTER_EXIT_TRANSITION;
  const contentTransition = reduceMotion ? { duration: 0 } : SWAP_TRANSITION;
  const shellTransition = reduceMotion ? { duration: 0 } : SHELL_TRANSITION;
  const chrome = resolvedVariant === "pinned" || (tracksScroll && scrolled);
  const mutedNavClass = chrome
    ? "text-neutral-500 dark:text-neutral-400"
    : "text-neutral-700 dark:text-neutral-200";

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        animate={{ maxWidth: chrome ? "64rem" : "80rem" }}
        className={`z-50 mx-auto w-full ${isStatic ? "" : "sticky top-4"}`}
        initial={false}
        transition={shellTransition}
      >
        <m.header
          animate={{ borderRadius: chrome ? "1rem" : "0rem" }}
          className={`transition-[background-color,box-shadow] duration-300 ease-out ${
            chrome ? ISLAND_CHROME : "bg-transparent"
          }`}
          initial={false}
          transition={shellTransition}
        >
          <div className="px-4 sm:px-6">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: onMouseLeave is a pointer-only convenience to dismiss the hover menu; the menu is fully operable via click, focus, and Escape */}
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: see above */}
            <div
              className="flex h-16 items-center justify-between gap-4"
              onMouseLeave={scheduleClose}
            >
              <DropdownMenu
                onOpenChange={(open, details) => {
                  if (open && details.reason === "trigger-press") {
                    return;
                  }
                  setLogoMenuOpen(open);
                }}
                open={logoMenuOpen}
              >
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={
                    <Link
                      aria-label="Notra home"
                      className="group flex flex-1 items-center"
                      href="/"
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setLogoMenuOpen(true);
                      }}
                    />
                  }
                >
                  <span className="inline-flex origin-left items-center gap-2 transition-transform duration-150 ease-out group-active:scale-95">
                    <span className="flex size-10 items-center justify-center rounded-lg dark:inset-shadow-sm dark:inset-shadow-white/8 dark:bg-[#F6F3F1] dark:shadow-black/40 dark:shadow-sm dark:ring-1 dark:ring-white/10">
                      <NotraMark className="size-7 shrink-0" />
                    </span>
                    <span className="font-semibold text-lg text-neutral-950 dark:text-white">
                      Notra
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                  side="bottom"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      copyToClipboard(notraMarkSvgString, "Copied logo as SVG")
                    }
                  >
                    <HugeiconsIcon icon={Copy01Icon} />
                    Copy logo as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      copySvgAsset(
                        BRAND_ASSETS.wordmark.svg,
                        "Copied wordmark as SVG"
                      )
                    }
                  >
                    <HugeiconsIcon icon={Copy01Icon} />
                    Copy wordmark as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={
                      <a download href={BRAND_ASSETS.zip}>
                        <HugeiconsIcon icon={Download01Icon} />
                        Download brand kit
                      </a>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/brand" />}>
                    <HugeiconsIcon icon={PaintBoardIcon} />
                    Brand Guidelines
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <nav className="relative hidden items-center gap-1 lg:flex">
                {MARKETING_NAV.map((entry) => {
                  if (entry.type === "link") {
                    return (
                      <Link
                        className={`rounded-md px-3 py-2 text-sm transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 dark:hover:bg-white/6 dark:hover:text-white ${mutedNavClass}`}
                        href={entry.href}
                        key={entry.href}
                        onFocus={() => setActiveGroup(null)}
                        onMouseEnter={() => {
                          cancelClose();
                          setActiveGroup(null);
                        }}
                      >
                        {entry.label}
                      </Link>
                    );
                  }
                  const isActive = activeGroup === entry.label;
                  return (
                    <button
                      aria-expanded={isActive}
                      aria-haspopup="menu"
                      className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 aria-expanded:bg-neutral-100 aria-expanded:text-neutral-950 dark:aria-expanded:bg-white/6 dark:aria-expanded:text-white dark:hover:bg-white/6 dark:hover:text-white ${mutedNavClass}`}
                      key={entry.label}
                      onClick={() =>
                        setActiveGroup(isActive ? null : entry.label)
                      }
                      onFocus={() => openGroup(entry.label)}
                      onMouseEnter={() => openGroup(entry.label)}
                      ref={(node) => {
                        if (node) {
                          triggerRefs.current.set(entry.label, node);
                        } else {
                          triggerRefs.current.delete(entry.label);
                        }
                      }}
                      type="button"
                    >
                      {entry.label}
                      <ChevronIcon flipped={isActive} />
                    </button>
                  );
                })}

                <div
                  aria-hidden="true"
                  className="-z-10 pointer-events-none invisible absolute top-full left-0 size-0 overflow-hidden"
                >
                  {groups.map((group) => (
                    <div
                      className="w-max"
                      key={group.label}
                      ref={(node) => {
                        if (node) {
                          measureRefs.current.set(group.label, node);
                        } else {
                          measureRefs.current.delete(group.label);
                        }
                      }}
                    >
                      <MegaPanel group={group} onSelect={closePanel} />
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {activeGroupData && (
                    <m.div
                      animate={{ ...PANEL_SCALE_REST, x: "-50%" }}
                      className="absolute top-full left-1/2 z-50 pt-2"
                      exit={{ ...PANEL_SCALE_OUT, x: "-50%" }}
                      initial={{ ...PANEL_SCALE_IN, x: "-50%" }}
                      key="navbar-dropdown"
                      style={{
                        transformPerspective: PANEL_PERSPECTIVE,
                        transformOrigin: "top center",
                      }}
                      transition={enterExitTransition}
                    >
                      <m.div
                        animate={{
                          width: activeSize?.width,
                          height: activeSize?.height,
                        }}
                        className="relative"
                        initial={{
                          width: activeSize?.width,
                          height: activeSize?.height,
                        }}
                        transition={{
                          width: morphTransition,
                          height: morphTransition,
                        }}
                      >
                        <LiquidGlass
                          blur={5}
                          className="h-full w-full rounded-2xl border-0 bg-transparent shadow-none"
                        >
                          <div className="relative inset-shadow-lg inset-shadow-white h-full w-full overflow-hidden rounded-2xl bg-white/85 shadow-black/8 shadow-lg ring-1 ring-black/5 dark:inset-shadow-white/3 dark:bg-neutral-950/85 dark:shadow-black/50 dark:shadow-xl dark:ring-white/10">
                            <AnimatePresence custom={direction} initial={false}>
                              <m.div
                                animate="center"
                                className="absolute top-0 left-0 w-max"
                                custom={direction}
                                exit="exit"
                                initial="enter"
                                key={activeGroupData.label}
                                role="menu"
                                transition={contentTransition}
                                variants={contentVariants}
                              >
                                <MegaPanel
                                  group={activeGroupData}
                                  onSelect={closePanel}
                                />
                              </m.div>
                            </AnimatePresence>
                          </div>
                        </LiquidGlass>
                      </m.div>
                    </m.div>
                  )}
                </AnimatePresence>
              </nav>

              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="hidden items-center gap-1 lg:flex">
                  <ThemeToggle />
                  <Link
                    className={`rounded-lg px-3 py-1.5 text-sm transition-[transform,background-color,color] duration-150 ease-out hover:bg-accent hover:text-accent-foreground active:scale-95 ${mutedNavClass}`}
                    href={SIGNIN_URL}
                  >
                    Sign in
                  </Link>
                  <TrackedSignupLink
                    className="corner-squircle overflow-hidden rounded-2xl border-transparent bg-primary px-4 py-1.5 font-medium text-primary-foreground text-sm shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] transition-[transform,background-color] duration-150 ease-out hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 active:scale-95 supports-[corner-shape:round]:rounded-[1.25rem]"
                    source="navbar_desktop_signup"
                  >
                    Sign up
                  </TrackedSignupLink>
                </div>
                <button
                  aria-controls="mobile-navigation"
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Close menu" : "Open menu"}
                  className="relative inline-flex size-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-white/6 dark:hover:text-white"
                  onClick={() => setIsOpen((prev) => !prev)}
                  type="button"
                >
                  <HugeiconsIcon
                    className="size-5"
                    icon={isOpen ? Cancel01Icon : Menu02Icon}
                  />
                </button>
              </div>
            </div>
          </div>
        </m.header>

        <AnimatePresence>
          {isOpen && (
            <m.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-shadow-lg inset-shadow-white inset-x-0 top-[calc(100%+0.5rem)] z-40 rounded-2xl bg-white p-3 shadow-black/8 shadow-lg ring-1 ring-black/5 lg:hidden dark:inset-shadow-white/3 dark:bg-neutral-950 dark:shadow-black/50 dark:shadow-xl dark:ring-white/10"
              exit={{ opacity: 0, y: -6 }}
              id="mobile-navigation"
              initial={{ opacity: 0, y: -6 }}
              transition={enterExitTransition}
            >
              <MobileNav onNavigate={() => setIsOpen(false)} />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <nav className="flex flex-col gap-1">
        {MARKETING_NAV.map((entry) => {
          if (entry.type === "link") {
            return (
              <Link
                className="rounded-md px-3 py-2 text-neutral-600 text-sm hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/6 dark:hover:text-white"
                href={entry.href}
                key={entry.href}
                onClick={onNavigate}
              >
                {entry.label}
              </Link>
            );
          }
          return (
            <div className="flex flex-col gap-0.5" key={entry.label}>
              <div className="px-3 pt-2 pb-1 font-medium text-neutral-400 text-xs uppercase tracking-wide dark:text-neutral-500">
                {entry.label}
              </div>
              {[...entry.cards, ...entry.rail].map((item) =>
                item.external ? (
                  <a
                    className="rounded-md px-3 py-2 text-neutral-600 text-sm hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/6 dark:hover:text-white"
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    className="rounded-md px-3 py-2 text-neutral-600 text-sm hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/6 dark:hover:text-white"
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2 border-neutral-200 border-t pt-3 dark:border-white/10">
        <Link
          className="rounded-md px-3 py-2 text-center text-neutral-600 text-sm hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/6 dark:hover:text-white"
          href={SIGNIN_URL}
          onClick={onNavigate}
        >
          Sign in
        </Link>
        <TrackedSignupLink
          className="corner-squircle overflow-hidden rounded-2xl border-transparent bg-primary px-3 py-2 text-center font-medium text-primary-foreground text-sm shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] transition-[transform,background-color] duration-150 ease-out hover:bg-primary-hover active:scale-95 supports-[corner-shape:round]:rounded-[1.25rem]"
          onClick={onNavigate}
          source="navbar_mobile_signup"
        >
          Get started
        </TrackedSignupLink>
        <div className="flex justify-center pt-1">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-3.5 transition-transform duration-200 ${flipped ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 9l6 6l6 -6" />
    </svg>
  );
}
