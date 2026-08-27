"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CorporateIcon,
  Github01Icon,
  LinkSquare02Icon,
  Loading03Icon,
  Message01Icon,
  NoteIcon,
  QuotesIcon,
  SearchIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@notra/ui/components/ui/dialog";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { cn } from "@notra/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { domAnimation, LazyMotion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useFeedback } from "@/components/dashboard/feedback-context";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useHasAiCreditsFeature } from "@/lib/hooks/use-plan";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  AiResult,
  CommandSection,
  EntityHit,
} from "@/types/components/command-palette";
import { truncateSnippet } from "@/utils/format";
import { isGeoDashboardPath, withGeoProject } from "@/utils/geo-paths";

import { useCommandPalette } from "./command-palette-context";
import {
  COMMAND_ROUTES,
  COMMAND_SECTIONS,
  isCommandRouteAvailable,
} from "./registry";

const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;
const SEARCH_DEBOUNCE_MS = 150;
const SEARCH_MIN_LENGTH = 2;
const REFERENCE_SNIPPET_MAX = 80;

const REFERENCE_TYPE_LABEL: Record<string, string> = {
  twitter_post: "Twitter",
  linkedin_post: "LinkedIn",
  blog_post: "Blog",
  custom: "Custom",
};
const BRAILLE_FRAMES = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
] as const;
const BRAILLE_INTERVAL_MS = 80;
const ENTITY_SECTION_ORDER = [
  "Posts",
  "Brand voices",
  "References",
  "Integrations",
] as const;

const GROUPED_ROUTES = (() => {
  const groups: Record<CommandSection, typeof COMMAND_ROUTES> = {
    Navigation: [],
    GEO: [],
    Workspace: [],
    Automation: [],
    Manage: [],
    Settings: [],
  };
  for (const route of COMMAND_ROUTES) {
    groups[route.section].push(route);
  }
  return groups;
})();

const emptySubscribe = () => () => undefined;

let cachedIsApplePlatform: boolean | null = null;

function readIsApplePlatform(): boolean {
  if (cachedIsApplePlatform === null) {
    const platform = navigator.platform || navigator.userAgent;
    cachedIsApplePlatform = APPLE_PLATFORM_PATTERN.test(platform);
  }
  return cachedIsApplePlatform;
}

const getServerIsApplePlatform = () => true;

function BrailleSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % BRAILLE_FRAMES.length);
    }, BRAILLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block font-mono tabular-nums", className)}
    >
      {BRAILLE_FRAMES[frame]}
    </span>
  );
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { activeOrganization } = useOrganizationsContext();
  const { hasAiCredits } = useHasAiCreditsFeature();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const isApplePlatform = useSyncExternalStore(
    emptySubscribe,
    readIsApplePlatform,
    getServerIsApplePlatform
  );
  const [aiState, setAiState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "navigating"; label: string }
    | { status: "error" }
  >({ status: "idle" });
  const [, startNavigation] = useTransition();
  const { openFeedback: triggerFeedback } = useFeedback();
  const abortRef = useRef<AbortController | null>(null);

  const slug = activeOrganization?.slug ?? "";
  const organizationId = activeOrganization?.id ?? "";
  const [projectParam] = useGeoProjectQueryState();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    const id = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchEnabled =
    debouncedQuery.length >= SEARCH_MIN_LENGTH &&
    organizationId.length > 0 &&
    open &&
    aiState.status === "idle";

  const searchResults = useQuery({
    ...dashboardOrpc.search.global.queryOptions({
      input: { organizationId, query: debouncedQuery },
    }),
    enabled: searchEnabled,
    staleTime: 15_000,
  });

  const entityHits: EntityHit[] = (() => {
    const data = searchResults.data;
    if (!(data && slug)) {
      return [];
    }
    const hits: EntityHit[] = [];
    for (const post of data.posts) {
      hits.push({
        key: `post:${post.id}`,
        label: post.title,
        sublabel: post.status === "published" ? "Published" : "Draft",
        icon: NoteIcon,
        path: `/${slug}/content/${post.id}`,
        keywords: ["post", "content", post.slug ?? "", debouncedQuery],
      });
    }
    for (const voice of data.voices) {
      const parts = [voice.companyName, voice.websiteUrl]
        .filter(Boolean)
        .join(" · ");
      hits.push({
        key: `voice:${voice.id}`,
        label: voice.name,
        sublabel: parts || "Brand voice",
        icon: CorporateIcon,
        path: `/${slug}/brand/identity`,
        keywords: [
          "brand",
          "voice",
          "identity",
          voice.websiteUrl ?? "",
          debouncedQuery,
        ],
      });
    }
    for (const reference of data.references) {
      const typeLabel = REFERENCE_TYPE_LABEL[reference.type] ?? "Reference";
      hits.push({
        key: `reference:${reference.id}`,
        label: truncateSnippet(reference.content, REFERENCE_SNIPPET_MAX),
        sublabel: reference.note
          ? `${typeLabel} · ${truncateSnippet(reference.note, 40)}`
          : typeLabel,
        icon: QuotesIcon,
        path: `/${slug}/brand/identity`,
        keywords: [
          "reference",
          "brand",
          typeLabel.toLowerCase(),
          debouncedQuery,
        ],
      });
    }
    for (const integration of data.githubIntegrations) {
      const repoLabel =
        integration.owner && integration.repo
          ? `${integration.owner}/${integration.repo}`
          : undefined;
      hits.push({
        key: `github:${integration.id}`,
        label: integration.displayName,
        sublabel: repoLabel ? `GitHub · ${repoLabel}` : "GitHub",
        icon: Github01Icon,
        path: `/${slug}/integrations/github/${integration.id}`,
        keywords: ["github", "integration", repoLabel ?? "", debouncedQuery],
      });
    }
    for (const integration of data.linearIntegrations) {
      const sub = [
        integration.linearOrganizationName,
        integration.linearTeamName,
      ]
        .filter(Boolean)
        .join(" · ");
      hits.push({
        key: `linear:${integration.id}`,
        label: integration.displayName,
        sublabel: sub ? `Linear · ${sub}` : "Linear",
        icon: LinkSquare02Icon,
        path: `/${slug}/integrations/linear/${integration.id}`,
        keywords: ["linear", "integration", debouncedQuery],
      });
    }
    for (const account of data.socialAccounts) {
      hits.push({
        key: `social:${account.id}`,
        label: account.displayName,
        sublabel: `${account.provider} · @${account.username}`,
        icon: UserCircleIcon,
        path: `/${slug}/integrations`,
        keywords: [
          "social",
          "account",
          account.provider,
          account.username,
          debouncedQuery,
        ],
      });
    }
    return hits;
  })();

  const entityHitsBySection = (() => {
    const groups = {
      Posts: [] as EntityHit[],
      "Brand voices": [] as EntityHit[],
      References: [] as EntityHit[],
      Integrations: [] as EntityHit[],
    };
    for (const hit of entityHits) {
      if (hit.key.startsWith("post:")) {
        groups.Posts.push(hit);
      } else if (hit.key.startsWith("voice:")) {
        groups["Brand voices"].push(hit);
      } else if (hit.key.startsWith("reference:")) {
        groups.References.push(hit);
      } else {
        groups.Integrations.push(hit);
      }
    }
    return groups;
  })();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      abortRef.current?.abort();
      abortRef.current = null;
      setQuery("");
      setAiState({ status: "idle" });
    }
  };

  useHotkeys(
    "mod+k",
    (event) => {
      if (
        !open &&
        typeof document !== "undefined" &&
        document.querySelector('[role="dialog"][data-state="open"]')
      ) {
        return;
      }
      event.preventDefault();
      handleOpenChange(!open);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const scopedPath = (path: string) =>
    isGeoDashboardPath(path)
      ? withGeoProject(path, projectParam ?? undefined)
      : path;

  const navigate = (path: string) => {
    handleOpenChange(false);
    router.push(scopedPath(path));
  };

  const navigateFromAi = (path: string, label: string) => {
    setAiState({ status: "navigating", label });
    startNavigation(() => {
      router.push(scopedPath(path));
    });
    handleOpenChange(false);
  };

  const openFeedback = () => {
    handleOpenChange(false);
    triggerFeedback();
  };

  const openChatWithQuery = (text: string) => {
    if (!slug) {
      return;
    }
    const qs = text ? `?q=${encodeURIComponent(text)}` : "";
    navigate(`/${slug}/chat${qs}`);
  };

  const runAiSearch = async () => {
    const trimmed = query.trim();
    if (!(trimmed && slug)) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAiState({ status: "loading" });
    let result: AiResult | undefined;
    try {
      const response = await fetch("/api/command-palette/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, slug }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      if (!response.ok) {
        setAiState({ status: "error" });
        return;
      }
      result = (await response.json()) as AiResult;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setAiState({ status: "error" });
      return;
    }
    if (controller.signal.aborted || !result) {
      return;
    }
    if (result.action === "navigate" && result.path) {
      navigateFromAi(result.path, "Opening");
      return;
    }
    if (result.action === "chat") {
      const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
      navigateFromAi(`/${slug}/chat${qs}`, "Opening chat");
      return;
    }
    setAiState({ status: "error" });
  };

  if (!slug) {
    return null;
  }

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isLoading =
    aiState.status === "loading" || aiState.status === "navigating";
  const isNavigatingAi = aiState.status === "navigating";
  const aiModifierLabel = isApplePlatform ? "⌘" : "Ctrl";

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="border-border/60 top-[18%] w-[calc(100%-2rem)] max-w-[45rem]! translate-y-0 gap-0 overflow-hidden rounded-xl! border p-0! shadow-2xl sm:max-w-[45rem]!"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search pages, jump to tools, or ask AI.
          </DialogDescription>
        </DialogHeader>
        <CommandPrimitive
          className="bg-popover text-popover-foreground flex size-full flex-col"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              hasQuery
            ) {
              event.preventDefault();
              runAiSearch().catch(() => undefined);
            }
          }}
          shouldFilter={aiState.status === "idle"}
        >
          <div className="border-border/60 flex h-12 items-center gap-2.5 border-b px-4">
            <HugeiconsIcon
              className="text-muted-foreground size-4 shrink-0"
              icon={SearchIcon}
              strokeWidth={2}
            />
            <CommandPrimitive.Input
              className={cn(
                "text-foreground flex-1 bg-transparent text-sm outline-none",
                "placeholder:text-muted-foreground/70",
                isLoading && "text-muted-foreground"
              )}
              onValueChange={(value) => {
                setQuery(value);
                if (aiState.status !== "idle") {
                  abortRef.current?.abort();
                  abortRef.current = null;
                  setAiState({ status: "idle" });
                }
              }}
              placeholder="Search pages, actions, or ask AI…"
              value={query}
            />
            {hasQuery ? (
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Kbd>{aiModifierLabel}</Kbd>
                <Kbd>↵</Kbd>
                <span>for AI</span>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden">
            {isLoading ? (
              <div className="flex h-[14rem] flex-col items-center justify-center px-6 text-center">
                <div className="text-foreground grid grid-cols-[1.125rem_auto_1.125rem] items-center gap-2 text-sm">
                  <BrailleSpinner className="text-[18px] leading-none" />
                  <LazyMotion features={domAnimation}>
                    <Shimmer
                      as="span"
                      className="font-medium"
                      duration={1.6}
                      spread={1.4}
                    >
                      {isNavigatingAi
                        ? `${(aiState as { status: "navigating"; label: string }).label}…`
                        : "Thinking…"}
                    </Shimmer>
                  </LazyMotion>
                  <span aria-hidden="true" />
                </div>
                <p className="text-muted-foreground mt-3 max-w-xs text-xs">
                  {isNavigatingAi
                    ? "Hang tight, almost there."
                    : `Figuring out where to take you for “${trimmedQuery}”.`}
                </p>
              </div>
            ) : null}
            <CommandPrimitive.List
              className={cn(
                "max-h-[24rem] scroll-py-2 overflow-y-auto overscroll-contain p-1.5",
                isLoading && "hidden"
              )}
            >
              <CommandPrimitive.Empty className="px-3 py-10">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
                  <div className="border-border bg-muted/40 flex size-10 items-center justify-center rounded-full border border-dashed">
                    <HugeiconsIcon
                      className="text-muted-foreground size-4"
                      icon={SparklesIcon}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground text-sm font-medium">
                      No matches for &ldquo;{trimmedQuery}&rdquo;
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Let AI navigate for you or open a chat with your question.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-1.5">
                    <button
                      className="group border-border/80 bg-background hover:border-border hover:bg-muted/60 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-150 disabled:opacity-60"
                      disabled={isLoading}
                      onClick={runAiSearch}
                      type="button"
                    >
                      <HugeiconsIcon
                        className={cn(
                          "text-muted-foreground group-hover:text-foreground size-4 transition-colors",
                          isLoading && "animate-spin motion-reduce:animate-none"
                        )}
                        icon={isLoading ? Loading03Icon : SparklesIcon}
                        strokeWidth={2}
                      />
                      <span className="flex-1 font-medium">
                        {isLoading ? "Thinking…" : "Navigate with AI"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Kbd>{aiModifierLabel}</Kbd>
                        <Kbd>↵</Kbd>
                      </div>
                    </button>
                    <button
                      className="group border-border/80 bg-background hover:border-border hover:bg-muted/60 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-150"
                      onClick={() => openChatWithQuery(trimmedQuery)}
                      type="button"
                    >
                      <HugeiconsIcon
                        className="text-muted-foreground group-hover:text-foreground size-4 transition-colors"
                        icon={Message01Icon}
                        strokeWidth={2}
                      />
                      <span className="flex-1 font-medium">Ask AI chat</span>
                      <HugeiconsIcon
                        className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                  {aiState.status === "error" ? (
                    <p className="text-destructive text-xs">
                      AI search failed. Try the chat fallback.
                    </p>
                  ) : null}
                </div>
              </CommandPrimitive.Empty>

              {COMMAND_SECTIONS.map((section) => {
                const items = GROUPED_ROUTES[section].filter((route) =>
                  isCommandRouteAvailable(route, hasAiCredits)
                );
                if (items.length === 0) {
                  return null;
                }
                return (
                  <CommandPrimitive.Group
                    className="text-foreground [&_[cmdk-group-heading]]:text-muted-foreground px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase"
                    heading={section}
                    key={section}
                  >
                    {items.map((item) => (
                      <CommandPrimitive.Item
                        className={cn(
                          "group/item relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors outline-none select-none",
                          "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
                          "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                        )}
                        key={item.id}
                        keywords={item.keywords}
                        onSelect={() => navigate(item.path(slug))}
                        value={item.label}
                      >
                        <HugeiconsIcon
                          className="text-muted-foreground group-data-[selected=true]/item:text-foreground size-4 shrink-0 transition-colors"
                          icon={item.icon}
                          strokeWidth={2}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        <HugeiconsIcon
                          className="text-muted-foreground size-3 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                        />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                );
              })}

              {ENTITY_SECTION_ORDER.map((section) => {
                const items = entityHitsBySection[section];
                if (!items || items.length === 0) {
                  return null;
                }
                return (
                  <CommandPrimitive.Group
                    className="text-foreground [&_[cmdk-group-heading]]:text-muted-foreground px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase"
                    heading={section}
                    key={section}
                  >
                    {items.map((hit) => (
                      <CommandPrimitive.Item
                        className={cn(
                          "group/item relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors outline-none select-none",
                          "data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                        )}
                        key={hit.key}
                        keywords={hit.keywords}
                        onSelect={() => navigate(hit.path)}
                        value={`${hit.key}__${hit.label}`}
                      >
                        <HugeiconsIcon
                          className="text-muted-foreground group-data-[selected=true]/item:text-foreground size-4 shrink-0 transition-colors"
                          icon={hit.icon}
                          strokeWidth={2}
                        />
                        <span className="flex-1 truncate">{hit.label}</span>
                        {hit.sublabel ? (
                          <span className="text-muted-foreground max-w-[40%] truncate text-[11px]">
                            {hit.sublabel}
                          </span>
                        ) : null}
                        <HugeiconsIcon
                          className="text-muted-foreground size-3 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                        />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                );
              })}

              <CommandPrimitive.Group
                className="text-foreground [&_[cmdk-group-heading]]:text-muted-foreground px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase"
                heading="Actions"
              >
                <CommandPrimitive.Item
                  className="group/item data-[selected=true]:bg-muted data-[selected=true]:text-foreground relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors outline-none select-none"
                  keywords={["feedback", "bug", "report", "idea", "feature"]}
                  onSelect={openFeedback}
                  value="__action_feedback"
                >
                  <HugeiconsIcon
                    className="text-muted-foreground group-data-[selected=true]/item:text-foreground size-4 shrink-0 transition-colors"
                    icon={Message01Icon}
                    strokeWidth={2}
                  />
                  <span className="flex-1 truncate">Send feedback</span>
                  <HugeiconsIcon
                    className="text-muted-foreground size-3 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                  />
                </CommandPrimitive.Item>
              </CommandPrimitive.Group>

              {hasQuery ? (
                <CommandPrimitive.Group
                  className="text-foreground [&_[cmdk-group-heading]]:text-muted-foreground px-1 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase"
                  heading="AI"
                >
                  <CommandPrimitive.Item
                    className="group/item data-[selected=true]:bg-muted data-[selected=true]:text-foreground relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors outline-none select-none"
                    keywords={["ai", "ask", "natural language"]}
                    onSelect={runAiSearch}
                    value={`__ai_navigate_${query}`}
                  >
                    <HugeiconsIcon
                      className={cn(
                        "text-muted-foreground group-data-[selected=true]/item:text-foreground size-4 shrink-0 transition-colors",
                        isLoading && "animate-spin motion-reduce:animate-none"
                      )}
                      icon={isLoading ? Loading03Icon : SparklesIcon}
                      strokeWidth={2}
                    />
                    <span className="flex-1 truncate">
                      {isLoading
                        ? "Thinking…"
                        : `Navigate with AI: "${trimmedQuery}"`}
                    </span>
                    <div className="flex items-center gap-1">
                      <Kbd>{aiModifierLabel}</Kbd>
                      <Kbd>↵</Kbd>
                    </div>
                  </CommandPrimitive.Item>
                  <CommandPrimitive.Item
                    className="group/item data-[selected=true]:bg-muted data-[selected=true]:text-foreground relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors outline-none select-none"
                    keywords={["chat", "conversation", "message"]}
                    onSelect={() => openChatWithQuery(trimmedQuery)}
                    value={`__ai_chat_${query}`}
                  >
                    <HugeiconsIcon
                      className="text-muted-foreground group-data-[selected=true]/item:text-foreground size-4 shrink-0 transition-colors"
                      icon={Message01Icon}
                      strokeWidth={2}
                    />
                    <span className="flex-1 truncate">
                      Ask AI chat about this
                    </span>
                    <HugeiconsIcon
                      className="text-muted-foreground size-3 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-60"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  </CommandPrimitive.Item>
                </CommandPrimitive.Group>
              ) : null}
            </CommandPrimitive.List>
          </div>

          <div className="border-border/60 bg-muted/30 text-muted-foreground flex h-9 shrink-0 items-center justify-between gap-3 border-t px-3 text-[11px]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Kbd>
                  <HugeiconsIcon
                    className="size-2.5"
                    icon={ArrowUp01Icon}
                    strokeWidth={2}
                  />
                </Kbd>
                <Kbd>
                  <HugeiconsIcon
                    className="size-2.5"
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                  />
                </Kbd>
                <span className="ml-0.5">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span className="ml-0.5">Select</span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <Kbd className="px-1 text-[9.5px]">esc</Kbd>
                <span className="ml-0.5">Close</span>
              </div>
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
