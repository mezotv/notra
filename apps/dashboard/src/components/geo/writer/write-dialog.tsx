"use client";

import {
  SidebarLeft01Icon,
  SidebarRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
/**
 * WriteDialog is the GEO write entry: a sidebar of sections that jump to
 * one scrolling form (prompt, content type, brand identity, competitors),
 * then Plan or Write. Gaps open this with `writeDialogStateFromGap`.
 * After plan, go to `geoContentPath`. Do not send users to
 * `/geo/write?brief=`.
 */
import type { GeoContentSubtype } from "@notra/ai/types/geo-writer";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { cn } from "@notra/ui/lib/utils";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/button";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import {
  GEO_WRITE_CONTENT_SUBTYPES,
  GEO_WRITE_DIALOG_SECTIONS,
  GEO_WRITE_PANEL_FOOTER_CLASS,
  GEO_WRITE_PANEL_FOOTER_ROW_CLASS,
  GEO_WRITE_PANEL_HEADER_CLASS,
  GEO_WRITE_PANEL_HEADER_ROW_CLASS,
  GEO_WRITE_SIDEBAR_SHORTCUT,
  GEO_WRITER_TOPIC_MAX_LENGTH,
  GEO_WRITER_TOPIC_MIN_LENGTH,
} from "@/constants/geo";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useSitemaps } from "@/lib/hooks/use-brand-sitemaps";
import { useGeoCompetitors, useGeoPrompts } from "@/lib/hooks/use-geo";
import { useGeoWriterPlan } from "@/lib/hooks/use-geo-writer";
import type {
  WriteDialogProps,
  WriteDialogSectionId,
  WriteDialogSourceKind,
} from "@/types/components/geo-writer";
import { withGeoProject } from "@/utils/geo-paths";
import { geoContentPath } from "@/utils/geo-write-entry";
import { WriteBrandOption } from "./write-brand-option";
import { WriteOptionCard } from "./write-option-card";
import { WriteSectionSidebar } from "./write-section-sidebar";
import { WriteSitemapSection } from "./write-sitemap-section";

const DEFAULT_CONTENT_SUBTYPE: GeoContentSubtype = "guide";
const MANUAL_PROMPT_VALUE = "manual";

export function WriteDialog({
  open,
  onOpenChange,
  organizationId,
  organizationSlug,
  initial,
}: WriteDialogProps) {
  const [previousOpen, setPreviousOpen] = useState(open);
  const [session, setSession] = useState(0);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      setSession((current) => current + 1);
    }
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <WriteDialogForm
        initial={initial}
        key={`${session}:${initial?.sourceKind ?? "manual"}:${initial?.sourceId ?? ""}`}
        onOpenChange={onOpenChange}
        open={open}
        organizationId={open ? organizationId : ""}
        organizationSlug={organizationSlug}
      />
    </ResponsiveDialog>
  );
}

function WriteDialogForm({
  open,
  onOpenChange,
  organizationId,
  organizationSlug,
  initial,
}: WriteDialogProps) {
  const router = useRouter();
  const { projectId } = useGeoProjectScope();
  const fieldId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] =
    useState<WriteDialogSectionId>("prompt");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== GEO_WRITE_SIDEBAR_SHORTCUT ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setSidebarCollapsed((current) => !current);
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [contentSubtype, setContentSubtype] = useState<GeoContentSubtype>(
    initial?.contentSubtype ?? DEFAULT_CONTENT_SUBTYPE
  );
  const [brandVoiceId, setBrandVoiceId] = useState<string | null>(
    initial?.brandVoiceId ?? null
  );
  const [sitemapId, setSitemapId] = useState<string | null>(null);
  const [competitorIds, setCompetitorIds] = useState<string[]>(
    initial?.competitorIds ?? []
  );
  const [sourceKind, setSourceKind] = useState<WriteDialogSourceKind>(
    initial?.sourceKind ?? "manual"
  );
  const [sourceId, setSourceId] = useState<string | undefined>(
    initial?.sourceId
  );
  const [competitorsTouched, setCompetitorsTouched] = useState(
    Boolean(initial?.competitorIds)
  );

  const planMutation = useGeoWriterPlan(organizationId);
  const { data: brandData } = useBrandSettings(organizationId);
  const { data: competitorData } = useGeoCompetitors(organizationId);
  const { data: promptsData } = useGeoPrompts(organizationId);
  const sitemapQuery = useSitemaps(organizationId, brandVoiceId ?? "");

  const voices = useMemo(() => brandData?.voices ?? [], [brandData?.voices]);
  const competitors = useMemo(
    () => competitorData?.competitors ?? [],
    [competitorData?.competitors]
  );
  const prompts = useMemo(
    () => promptsData?.prompts ?? [],
    [promptsData?.prompts]
  );
  const sitemaps = useMemo(
    () => sitemapQuery.data?.sitemaps ?? [],
    [sitemapQuery.data?.sitemaps]
  );
  const selectedVoice = voices.find((voice) => voice.id === brandVoiceId);
  const effectiveSitemapId = sitemaps.some(
    (sitemap) => sitemap.id === sitemapId
  )
    ? sitemapId
    : (sitemaps[0]?.id ?? null);

  useEffect(() => {
    if (brandVoiceId || voices.length === 0) {
      return;
    }
    const fallback =
      voices.find((voice) => voice.isDefault)?.id ?? voices[0]?.id ?? null;
    setBrandVoiceId(fallback);
  }, [brandVoiceId, voices]);

  useEffect(() => {
    if (competitorsTouched || competitors.length === 0) {
      return;
    }
    setCompetitorIds(competitors.map((competitor) => competitor.id));
  }, [competitors, competitorsTouched]);

  const jumpToSection = (id: WriteDialogSectionId) => {
    setActiveSection(id);
    scrollRef.current
      ?.querySelector<HTMLElement>(`[data-section="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const trackedPromptMatch =
    sourceKind === "prompt" || sourceKind === "gap"
      ? prompts.find((item) => item.id === sourceId)
      : undefined;
  const selectedPromptValue = trackedPromptMatch?.id ?? MANUAL_PROMPT_VALUE;

  const promptSelectLabel = (value: string): string => {
    if (value === MANUAL_PROMPT_VALUE) {
      return "Write a custom prompt";
    }
    return (
      prompts.find((item) => item.id === value)?.prompt ??
      "Write a custom prompt"
    );
  };

  const handlePromptSelect = (promptKey: string) => {
    if (promptKey === MANUAL_PROMPT_VALUE) {
      setSourceKind("manual");
      setSourceId(undefined);
      return;
    }
    const prompt = prompts.find((item) => item.id === promptKey);
    if (!prompt) {
      return;
    }
    setSourceKind("prompt");
    setSourceId(prompt.id);
    setTopic(prompt.prompt);
  };

  const brandSelectLabel = (value: string): ReactNode => {
    const voice = voices.find((item) => item.id === value);
    if (!voice) {
      return "Select a brand identity";
    }
    return (
      <WriteBrandOption
        isDefault={voice.isDefault}
        name={voice.name}
        websiteUrl={voice.websiteUrl}
      />
    );
  };

  const allCompetitorsSelected =
    competitors.length > 0 && competitorIds.length === competitors.length;

  const canSubmit =
    topic.trim().length >= GEO_WRITER_TOPIC_MIN_LENGTH &&
    !planMutation.isPending;

  const handleSubmit = async (autoApprove: boolean) => {
    const trimmed = topic.trim();
    if (
      trimmed.length < GEO_WRITER_TOPIC_MIN_LENGTH ||
      planMutation.isPending
    ) {
      return;
    }
    const result = await planMutation.mutateAsync({
      topic: trimmed,
      autoApprove,
      contentSubtype,
      brandVoiceIds: brandVoiceId ? [brandVoiceId] : [],
      competitorIds,
      sitemapId: effectiveSitemapId ?? undefined,
      sourceKind,
      sourceId,
    });
    onOpenChange(false);
    if (result.postId) {
      router.push(geoContentPath(organizationSlug, result.postId));
      return;
    }
    router.push(withGeoProject(`/${organizationSlug}/geo/gaps`, projectId));
  };

  const sectionMeta = (id: WriteDialogSectionId) =>
    GEO_WRITE_DIALOG_SECTIONS.find((item) => item.id === id);

  const renderSectionHeader = (
    id: WriteDialogSectionId,
    description: string,
    htmlFor?: string
  ) => {
    const meta = sectionMeta(id);
    if (!meta) {
      return null;
    }
    const heading = (
      <>
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={meta.icon}
          strokeWidth={1.8}
        />
        <span>{meta.label}</span>
        {meta.required ? <span className="text-destructive">*</span> : null}
      </>
    );
    return (
      <div className="space-y-1">
        {htmlFor ? (
          <Label
            className="flex items-center gap-2 font-semibold text-base"
            htmlFor={htmlFor}
          >
            {heading}
          </Label>
        ) : (
          <h3 className="flex items-center gap-2 font-semibold text-base">
            {heading}
          </h3>
        )}
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    );
  };

  return (
    <ResponsiveDialogContent
      className="flex h-[min(46rem,88svh)] max-h-[88svh] flex-col gap-0 overflow-visible bg-transparent p-0 shadow-none ring-0 sm:max-w-4xl"
      drawerClassName="bg-background p-3 ring-1 ring-foreground/10"
    >
      <div className="flex min-h-0 flex-1 gap-3">
        <WriteSectionSidebar
          activeSection={activeSection}
          collapsed={sidebarCollapsed}
          onJump={jumpToSection}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className={GEO_WRITE_PANEL_HEADER_CLASS}>
            <div
              className={cn(
                GEO_WRITE_PANEL_HEADER_ROW_CLASS,
                "gap-2 pr-12 pl-2"
              )}
            >
              <Button
                aria-expanded={!sidebarCollapsed}
                aria-label={
                  sidebarCollapsed ? "Show sections" : "Hide sections"
                }
                className="hidden size-7 md:inline-flex"
                onClick={() => setSidebarCollapsed((current) => !current)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={
                    sidebarCollapsed ? SidebarRight01Icon : SidebarLeft01Icon
                  }
                  strokeWidth={1.8}
                />
              </Button>
              <ResponsiveDialogTitle className="font-semibold text-base tracking-tight max-md:sr-only">
                Write article
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="sr-only">
                Plan or write an article from a prompt, content type, brand
                identity, and competitors.
              </ResponsiveDialogDescription>
              <div className="flex gap-1 overflow-x-auto md:hidden">
                {GEO_WRITE_DIALOG_SECTIONS.map((item) => (
                  <button
                    className={cn(
                      "shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-sm transition-colors",
                      activeSection === item.id
                        ? "bg-background font-medium text-foreground"
                        : "text-muted-foreground hover:bg-background/60"
                    )}
                    key={item.id}
                    onClick={() => jumpToSection(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="-mt-5 relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background">
            <div
              className="scrollbar-floating min-h-0 flex-1 divide-y divide-border overflow-y-auto scroll-smooth"
              ref={scrollRef}
            >
              <section
                className="scroll-mt-2 space-y-4 px-6 py-6"
                data-section="prompt"
              >
                {renderSectionHeader(
                  "prompt",
                  "Pick a tracked prompt or write your own. The article answers this question.",
                  `${fieldId}-topic`
                )}
                {prompts.length > 0 ? (
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        handlePromptSelect(value);
                      }
                    }}
                    value={selectedPromptValue}
                  >
                    <SelectTrigger
                      aria-label="Tracked prompt"
                      className="h-10 w-full"
                    >
                      <SelectValue>
                        {(value: string) => (
                          <span
                            className={cn(
                              "truncate",
                              value === MANUAL_PROMPT_VALUE
                                ? "text-muted-foreground"
                                : null
                            )}
                          >
                            {promptSelectLabel(value)}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={MANUAL_PROMPT_VALUE}>
                        Write a custom prompt
                      </SelectItem>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          <span className="line-clamp-2 whitespace-normal">
                            {prompt.prompt}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Textarea
                  className="min-h-24"
                  id={`${fieldId}-topic`}
                  maxLength={GEO_WRITER_TOPIC_MAX_LENGTH}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    if (sourceKind === "prompt") {
                      setSourceKind("manual");
                      setSourceId(undefined);
                    }
                  }}
                  placeholder="e.g. Which tools are best for sharing music demos?"
                  value={topic}
                />
              </section>

              <section
                className="scroll-mt-2 space-y-4 px-6 py-6"
                data-section="type"
              >
                {renderSectionHeader(
                  "type",
                  "Choose what kind of blog post to write."
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {GEO_WRITE_CONTENT_SUBTYPES.map((option) => (
                    <WriteOptionCard
                      description={option.description}
                      icon={
                        <HugeiconsIcon
                          className={cn("size-5", option.iconClass)}
                          icon={option.icon}
                          strokeWidth={1.8}
                        />
                      }
                      key={option.id}
                      label={option.label}
                      onToggle={() => setContentSubtype(option.id)}
                      selected={contentSubtype === option.id}
                    />
                  ))}
                </div>
              </section>

              <section
                className="scroll-mt-2 space-y-4 px-6 py-6"
                data-section="brand"
              >
                {renderSectionHeader(
                  "brand",
                  "The brand whose voice and facts the article uses.",
                  voices.length > 0 ? `${fieldId}-brand` : undefined
                )}
                {voices.length === 0 ? (
                  <p className="rounded-lg border border-border border-dashed px-3 py-2.5 text-muted-foreground text-sm">
                    No brand identities yet. The writer will use your GEO
                    project brand.
                  </p>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      setBrandVoiceId(value || null);
                    }}
                    value={brandVoiceId ?? ""}
                  >
                    <SelectTrigger
                      className="h-10 w-full"
                      id={`${fieldId}-brand`}
                    >
                      <SelectValue placeholder="Select a brand identity">
                        {(value: string) => brandSelectLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <WriteBrandOption
                            isDefault={voice.isDefault}
                            name={voice.name}
                            websiteUrl={voice.websiteUrl}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </section>

              <section
                className="scroll-mt-2 space-y-4 px-6 py-6"
                data-section="sitemap"
              >
                {renderSectionHeader(
                  "sitemap",
                  "The writer links to real pages from the brand identity's sitemap."
                )}
                <WriteSitemapSection
                  brandIdentityHref={`/${organizationSlug}/brand/identity`}
                  brandVoiceId={brandVoiceId}
                  isPending={Boolean(brandVoiceId) && sitemapQuery.isPending}
                  onSelect={setSitemapId}
                  organizationId={organizationId}
                  selectedSitemapId={effectiveSitemapId}
                  sitemaps={sitemaps}
                  voiceName={selectedVoice?.name ?? null}
                  voiceWebsiteUrl={selectedVoice?.websiteUrl ?? null}
                />
              </section>

              <section
                className="scroll-mt-2 space-y-4 px-6 py-6"
                data-section="competitors"
              >
                <div className="flex items-start justify-between gap-3">
                  {renderSectionHeader(
                    "competitors",
                    "Competitors the article can mention when it compares options."
                  )}
                  {competitors.length > 0 ? (
                    <button
                      className="shrink-0 cursor-pointer text-muted-foreground text-xs transition-colors hover:text-foreground"
                      onClick={() => {
                        setCompetitorsTouched(true);
                        setCompetitorIds(
                          allCompetitorsSelected
                            ? []
                            : competitors.map((competitor) => competitor.id)
                        );
                      }}
                      type="button"
                    >
                      {allCompetitorsSelected ? "Clear all" : "Select all"}
                    </button>
                  ) : null}
                </div>
                {competitors.length === 0 ? (
                  <p className="rounded-lg border border-border border-dashed px-3 py-2.5 text-muted-foreground text-sm">
                    No competitors tracked yet. Add them in GEO settings to
                    mention alternatives.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {competitors.map((competitor) => {
                      const selected = competitorIds.includes(competitor.id);
                      return (
                        <WriteOptionCard
                          compact
                          description={competitor.domain}
                          icon={
                            <CompetitorLogo
                              className="size-5"
                              domain={competitor.domain}
                              name={competitor.name}
                            />
                          }
                          key={competitor.id}
                          label={competitor.name}
                          onToggle={() => {
                            setCompetitorsTouched(true);
                            setCompetitorIds((current) =>
                              selected
                                ? current.filter((id) => id !== competitor.id)
                                : [...current, competitor.id]
                            );
                          }}
                          selected={selected}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className={GEO_WRITE_PANEL_FOOTER_CLASS}>
            <div
              className={cn(
                GEO_WRITE_PANEL_FOOTER_ROW_CLASS,
                "justify-end gap-3 px-4"
              )}
            >
              <div className="flex shrink-0 gap-2">
                <Button
                  disabled={!canSubmit}
                  onClick={() => {
                    handleSubmit(false).catch(() => undefined);
                  }}
                  variant="outline"
                >
                  {planMutation.isPending ? "Planning…" : "Plan"}
                </Button>
                <Button
                  disabled={!canSubmit}
                  onClick={() => {
                    handleSubmit(true).catch(() => undefined);
                  }}
                >
                  Write
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveDialogContent>
  );
}
