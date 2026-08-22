"use client";

import { CheckmarkCircle02Icon, CircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
/**
 * WriteDialog is the GEO write entry: a sidebar of sections that jump to
 * one scrolling form (prompt, content type, brand identity, competitors),
 * then Plan or Write. Gaps open this with `writeDialogStateFromGap`.
 * After plan, go to `geoContentPath`. Do not send users to
 * `/geo/write?brief=`.
 */
import type { GeoContentType } from "@notra/ai/types/geo-writer";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import {
  GEO_WRITE_CONTENT_TYPES,
  GEO_WRITE_DIALOG_SECTIONS,
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
import { geoContentPath } from "@/utils/geo-write-entry";

const DEFAULT_CONTENT_TYPE: GeoContentType = "guide";
const MANUAL_PROMPT_VALUE = "manual";

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <HugeiconsIcon
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        selected ? "text-primary" : "text-muted-foreground/40"
      )}
      icon={selected ? CheckmarkCircle02Icon : CircleIcon}
      strokeWidth={1.8}
    />
  );
}

export function WriteDialog({
  open,
  onOpenChange,
  organizationId,
  organizationSlug,
  brandSitemapHref,
  initial,
}: WriteDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <WriteDialogForm
        brandSitemapHref={brandSitemapHref}
        initial={initial}
        key={
          open
            ? `${initial?.sourceKind ?? "manual"}:${initial?.sourceId ?? ""}`
            : "closed"
        }
        onOpenChange={onOpenChange}
        open={open}
        organizationId={open ? organizationId : ""}
        organizationSlug={organizationSlug}
      />
    </ResponsiveDialog>
  );
}

function WriteDialogForm({
  onOpenChange,
  organizationId,
  organizationSlug,
  brandSitemapHref,
  initial,
}: WriteDialogProps) {
  const router = useRouter();
  const fieldId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] =
    useState<WriteDialogSectionId>("prompt");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [contentType, setContentType] = useState<GeoContentType>(
    initial?.contentType ?? DEFAULT_CONTENT_TYPE
  );
  const [brandVoiceId, setBrandVoiceId] = useState<string | null>(
    initial?.brandVoiceId ?? null
  );
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

  const voices = brandData?.voices ?? [];
  const competitors = competitorData?.competitors ?? [];
  const prompts = promptsData?.prompts ?? [];
  const hasSitemap =
    !brandVoiceId ||
    sitemapQuery.isPending ||
    (sitemapQuery.data?.sitemaps.length ?? 0) > 0;

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

  const brandSelectLabel = (value: string): string => {
    const voice = voices.find((item) => item.id === value);
    if (!voice) {
      return "Select a brand identity";
    }
    return voice.isDefault ? `${voice.name} (default)` : voice.name;
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
      contentType,
      brandVoiceIds: brandVoiceId ? [brandVoiceId] : [],
      competitorIds,
      sourceKind,
      sourceId,
    });
    onOpenChange(false);
    if (result.postId) {
      router.push(geoContentPath(organizationSlug, result.postId));
      return;
    }
    router.push(`/${organizationSlug}/geo/gaps`);
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
    <ResponsiveDialogContent className="flex h-[min(46rem,88svh)] max-h-[88svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
      <ResponsiveDialogHeader className="border-border border-b px-5 py-3.5 text-left">
        <ResponsiveDialogTitle className="text-base">
          Write article
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">
          Plan or write an article from a prompt, content type, brand identity,
          and competitors.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Write sections"
          className="hidden w-52 shrink-0 flex-col border-border border-r bg-muted/30 p-3 md:flex"
        >
          <p className="mb-1.5 px-2 text-muted-foreground text-xs">Overview</p>
          {GEO_WRITE_DIALOG_SECTIONS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-background font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
                key={item.id}
                onClick={() => jumpToSection(item.id)}
                type="button"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={item.icon}
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
                {item.required ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-1 overflow-x-auto border-border border-b px-3 py-2 md:hidden">
            {GEO_WRITE_DIALOG_SECTIONS.map((item) => (
              <button
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
                key={item.id}
                onClick={() => jumpToSection(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            className="min-h-0 flex-1 divide-y divide-border overflow-y-auto scroll-smooth"
            ref={scrollRef}
          >
            <section
              className="scroll-mt-2 space-y-4 px-6 py-6"
              data-section="prompt"
            >
              {renderSectionHeader(
                "prompt",
                "Select a tracked prompt or write your own. The article answers this question.",
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
                "Select the type of content you want to generate."
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {GEO_WRITE_CONTENT_TYPES.map((option) => {
                  const selected = contentType === option.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                          : "border-border bg-card hover:border-foreground/20"
                      )}
                      key={option.id}
                      onClick={() => setContentType(option.id)}
                      type="button"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <HugeiconsIcon
                          className="size-4"
                          icon={option.icon}
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="block font-medium text-sm">
                          {option.label}
                        </span>
                        <span className="block text-muted-foreground text-xs leading-relaxed">
                          {option.description}
                        </span>
                      </span>
                      <SelectionMark selected={selected} />
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="scroll-mt-2 space-y-4 px-6 py-6"
              data-section="brand"
            >
              {renderSectionHeader(
                "brand",
                "Whose voice and facts the article should use.",
                voices.length > 0 ? `${fieldId}-brand` : undefined
              )}
              {voices.length === 0 ? (
                <p className="rounded-lg border border-border border-dashed px-3 py-2.5 text-muted-foreground text-sm">
                  No brand identities yet. The writer will use your GEO project
                  brand.
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
                        {voice.name}
                        {voice.isDefault ? " (default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </section>

            <section
              className="scroll-mt-2 space-y-4 px-6 py-6"
              data-section="competitors"
            >
              <div className="flex items-start justify-between gap-3">
                {renderSectionHeader(
                  "competitors",
                  "Names the writer may mention in a fair comparison."
                )}
                {competitors.length > 0 ? (
                  <button
                    className="shrink-0 text-muted-foreground text-xs transition-colors hover:text-foreground"
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {competitors.map((competitor) => {
                    const selected = competitorIds.includes(competitor.id);
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                            : "border-border bg-card hover:border-foreground/20"
                        )}
                        key={competitor.id}
                        onClick={() => {
                          setCompetitorsTouched(true);
                          setCompetitorIds((current) =>
                            selected
                              ? current.filter((id) => id !== competitor.id)
                              : [...current, competitor.id]
                          );
                        }}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-sm">
                            {competitor.name}
                          </span>
                          {competitor.domain ? (
                            <span className="block truncate text-muted-foreground text-xs">
                              {competitor.domain}
                            </span>
                          ) : null}
                        </span>
                        <SelectionMark selected={selected} />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="flex items-center justify-between gap-3 border-border border-t px-6 py-3.5">
            {hasSitemap ? (
              <span />
            ) : (
              <p className="text-muted-foreground text-sm">
                Add a sitemap so the writer can link to real pages.{" "}
                <Link
                  className="font-medium text-foreground underline underline-offset-2"
                  href={brandSitemapHref}
                >
                  Add sitemap
                </Link>
              </p>
            )}
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
    </ResponsiveDialogContent>
  );
}
