"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { GEO_PROMPT_HISTORY_ANSWER_LABELS } from "@notra/geo-core/constants/geo";
import type {
  GeoPromptHistoryCheck,
  GeoPromptReceiptView,
  GeoPromptResultSummary,
} from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { tween } from "@notra/ui/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/button";
import { GeoPromptAnswerThread } from "@/components/geo/geo-prompt-answer-thread";
import { PromptDetailStatus } from "@/components/geo/prompt-detail-status";
import { PromptEngineSwitcher } from "@/components/geo/prompt-engine-switcher";
import { PromptReceiptAnalysis } from "@/components/geo/prompt-receipt-analysis";
import { PromptReceiptViewSwitch } from "@/components/geo/prompt-receipt-view-switch";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_PROMPT_DETAIL_SURFACES } from "@/constants/geo-analytics";
import { trackEvent } from "@/lib/analytics/posthog-client";
import {
  useGeoCompetitors,
  useGeoPromptHistory,
  useGeoPromptResultDetail,
} from "@/lib/hooks/use-geo";
import type {
  PromptAnswerPageProps,
  PromptDetailDialogProps,
} from "@/types/geo";
import type {
  PromptAnswerBodyProps,
  PromptAnswerHeaderProps,
} from "@/types/geo-prompt-detail";
import { sharedEngineAnswerMode } from "@/utils/geo-charts";
import { geoPromptDetailState } from "@/utils/geo-prompt-detail";
import {
  adjacentPromptEngine,
  promptEngineArrowDelta,
} from "@/utils/geo-prompt-engines";
import {
  promptHistoryForEngine,
  promptResultFromHistoryCheck,
} from "@/utils/geo-prompt-history";

const INSTANT = { duration: 0 } as const;
const SLIDE_PX = 18;

function threadVariants(reduceMotion: boolean) {
  return {
    enter: (direction: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : direction * SLIDE_PX,
    }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : direction * -SLIDE_PX,
    }),
  };
}

function latestPromptCheckAt(
  results: readonly GeoPromptResultSummary[]
): string | null {
  let latest: string | null = null;
  for (const result of results) {
    if (!latest || result.lastCheckedAt > latest) {
      latest = result.lastCheckedAt;
    }
  }
  return latest;
}

function HistoryAnswerBanner({
  check,
  onBack,
}: {
  check: GeoPromptHistoryCheck;
  onBack: () => void;
}) {
  return (
    <div className="bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-6 py-2 text-sm">
      <p className="text-muted-foreground">
        {GEO_PROMPT_HISTORY_ANSWER_LABELS.scanFrom}{" "}
        <time
          className="text-foreground tabular-nums"
          dateTime={check.capturedAt}
        >
          {formatAiTrafficTimestamp(check.capturedAt)}
        </time>
      </p>
      <Button onClick={onBack} size="sm" type="button" variant="ghost">
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        {GEO_PROMPT_HISTORY_ANSWER_LABELS.backToLatest}
      </Button>
    </div>
  );
}

function PromptAnswerHeader({
  prompt,
  results,
  active,
  view,
  onSelectEngine,
  onSelectView,
}: PromptAnswerHeaderProps) {
  const answerMode = sharedEngineAnswerMode(
    results.map((result) => result.engine)
  );
  const latestCheck = latestPromptCheckAt(results);

  return (
    <ResponsiveDialogHeader className="shrink-0 gap-4 overflow-visible border-b px-6 pt-5 pb-4">
      <div className="flex flex-col gap-1 pr-8">
        <ResponsiveDialogTitle className="text-xl leading-snug font-semibold text-balance">
          {prompt}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">
          {answerMode
            ? `Latest ${answerMode} answer from each engine`
            : "Latest answer from each engine"}
        </ResponsiveDialogDescription>
        {latestCheck ? (
          <p className="text-muted-foreground text-sm">
            {formatAiTrafficTimestamp(latestCheck)}
          </p>
        ) : null}
      </div>
      {results.length > 0 && active ? (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <PromptEngineSwitcher
            active={active}
            onChange={onSelectEngine}
            results={results}
          />
          <PromptReceiptViewSwitch onChange={onSelectView} view={view} />
        </div>
      ) : null}
    </ResponsiveDialogHeader>
  );
}

function PromptAnswerBody({
  detailState,
  view,
  prompt,
  scanPromptId,
  selectedCheck,
  history,
  isHistoryLoading,
  competitors,
  onRetry,
  onSelectCheck,
  onBackToLatest,
}: PromptAnswerBodyProps) {
  if (selectedCheck) {
    return (
      <>
        <HistoryAnswerBanner check={selectedCheck} onBack={onBackToLatest} />
        <GeoPromptAnswerThread
          prompt={prompt}
          result={promptResultFromHistoryCheck(
            selectedCheck,
            scanPromptId,
            prompt
          )}
        />
      </>
    );
  }

  if (detailState.status !== "ready") {
    return <PromptDetailStatus onRetry={onRetry} status={detailState.status} />;
  }

  if (view === "analysis") {
    return (
      <PromptReceiptAnalysis
        competitors={competitors}
        history={history}
        isHistoryLoading={isHistoryLoading}
        onSelectCheck={onSelectCheck}
        prompt={prompt}
        result={detailState.result}
      />
    );
  }

  return <GeoPromptAnswerThread prompt={prompt} result={detailState.result} />;
}

function PromptAnswerPage({
  row,
  open,
  organizationId,
  isScanning = false,
  surface,
  initialEngine,
}: PromptAnswerPageProps) {
  const results = row.results;
  const engines = results.map((result) => result.engine);
  const [engine, setEngine] = useState(
    () =>
      engines.find((candidate) => candidate === initialEngine) ??
      engines[0] ??
      ""
  );
  const [view, setView] = useState<GeoPromptReceiptView>("analysis");
  const [selectedCheck, setSelectedCheck] =
    useState<GeoPromptHistoryCheck | null>(null);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const active =
    results.find((result) => result.engine === engine) ?? results[0] ?? null;
  const checkId = open ? (active?.checkId ?? null) : null;
  const detail = useGeoPromptResultDetail(organizationId, checkId);
  const detailState = geoPromptDetailState(
    active?.checkId ?? null,
    detail.data,
    detail.isError
  );
  const openedRef = useRef(false);
  const activeEngine = active?.engine ?? null;
  const resultCount = results.length;

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (openedRef.current) {
      return;
    }
    openedRef.current = true;
    trackEvent(POSTHOG_EVENTS.GEO_PROMPT_DETAIL_OPENED, {
      surface: surface ?? GEO_PROMPT_DETAIL_SURFACES.PROMPTS_TABLE,
      engine: activeEngine,
      engine_count: resultCount,
      prompt_id: row.id,
    });
  }, [activeEngine, open, resultCount, row.id, surface]);
  const scanPromptId = results[0]?.promptId ?? row.id;
  const history = useGeoPromptHistory(organizationId, scanPromptId, {
    enabled: open && results.length > 0,
  });
  const competitors = useGeoCompetitors(organizationId);
  const engineHistory = active
    ? promptHistoryForEngine(history.data?.checks ?? [], active.engine)
    : [];
  const threadTransition = reduceMotion ? INSTANT : tween("slow", "emphasized");

  function selectEngine(next: string, nextDirection: number) {
    if (next === engine) {
      return;
    }
    setDirection(nextDirection);
    setEngine(next);
    setSelectedCheck(null);
  }

  function selectView(next: GeoPromptReceiptView) {
    setView(next);
    if (next === "analysis") {
      setSelectedCheck(null);
    }
  }

  function openHistoryAnswer(check: GeoPromptHistoryCheck) {
    setSelectedCheck(check);
    setView("raw");
  }

  function handleArrowNavigation(event: KeyboardEvent<HTMLElement>) {
    const delta = promptEngineArrowDelta(event, results.length);
    if (delta === null) {
      return;
    }

    event.preventDefault();
    selectEngine(
      adjacentPromptEngine(engines, active?.engine ?? engine, delta),
      delta
    );
  }

  return (
    <ResponsiveDialogContent
      className="flex h-[min(calc(100vh-2rem),900px)] max-h-[calc(100vh-2rem)] w-full max-w-[min(calc(100vw-2rem),54rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),54rem)]"
      drawerClassName="h-[94svh] max-h-[94svh]"
      onKeyDown={handleArrowNavigation}
    >
      <PromptAnswerHeader
        active={active}
        onSelectEngine={selectEngine}
        onSelectView={selectView}
        prompt={row.prompt}
        results={results}
        view={view}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          {active ? (
            <motion.div
              animate="center"
              className="absolute inset-0 flex flex-col"
              custom={direction}
              exit="exit"
              initial="enter"
              key={`${active.engine}-${view}-${selectedCheck?.id ?? "latest"}`}
              transition={threadTransition}
              variants={threadVariants(Boolean(reduceMotion))}
            >
              <PromptAnswerBody
                competitors={competitors.data?.competitors}
                detailState={detailState}
                history={engineHistory}
                isHistoryLoading={history.isPending}
                onBackToLatest={() => setSelectedCheck(null)}
                onRetry={() => {
                  void detail.refetch();
                }}
                onSelectCheck={openHistoryAnswer}
                prompt={row.prompt}
                scanPromptId={scanPromptId}
                selectedCheck={selectedCheck}
                view={view}
              />
            </motion.div>
          ) : (
            <div className="flex h-full min-h-0 items-center justify-center px-6">
              <p className="text-muted-foreground text-center text-sm text-pretty">
                {geoScanEmptyMessage(
                  isScanning,
                  "Run a scan to see how engines answer this"
                )}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ResponsiveDialogContent>
  );
}

export function PromptDetailDialog({
  open,
  onOpenChange,
  row,
  isScanning = false,
  surface,
  organizationId,
  initialEngine,
}: PromptDetailDialogProps) {
  const { activeOrganization } = useOrganizationsContext();
  const resolvedOrganizationId = organizationId ?? activeOrganization?.id ?? "";
  if (!row) {
    return null;
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <PromptAnswerPage
        initialEngine={initialEngine}
        isScanning={isScanning}
        key={row.id}
        open={open}
        organizationId={resolvedOrganizationId}
        row={row}
        surface={surface}
      />
    </ResponsiveDialog>
  );
}
