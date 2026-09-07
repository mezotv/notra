"use client";

import {
  GEO_SCAN_PREFLIGHT_BODY,
  GEO_SCAN_PREFLIGHT_CANCEL,
  GEO_SCAN_PREFLIGHT_CONFIRM,
  GEO_SCAN_PREFLIGHT_ENGINES_LABEL,
  GEO_SCAN_PREFLIGHT_LANGUAGES_LABEL,
  GEO_SCAN_PREFLIGHT_LAST_SCAN_LABEL,
  GEO_SCAN_PREFLIGHT_PENDING,
  GEO_SCAN_PREFLIGHT_PROMPTS_LABEL,
  GEO_SCAN_PREFLIGHT_TITLE,
  GEO_SCAN_SIZE_DANGER,
  GEO_SCAN_SIZE_LABEL,
  GEO_SCAN_SIZE_WARN,
} from "@notra/geo-core/constants/geo";
import {
  calcGeoScanSize,
  geoScanSizeSeverity,
} from "@notra/geo-core/utils/geo-scan";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";

import { EngineIcon } from "@/components/geo/engine-icon";
import { useAnswersBalance } from "@/lib/hooks/use-answers-balance";
import type { ScanPreflightDialogProps } from "@/types/geo";
import { formatEngineFamily } from "@/utils/geo-charts";
import { formatScanPreflightLastScan } from "@/utils/geo-scan-preflight";

export function ScanPreflightDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  promptCount,
  engines,
  languages,
  lastScanAt,
}: ScanPreflightDialogProps) {
  const { balance: answersBalance, isLoading: answersLoading } =
    useAnswersBalance();
  const scanSize = calcGeoScanSize({
    promptCount,
    engineCount: engines.length,
    languageCount: languages.length,
  });
  const scanSizeSeverity = geoScanSizeSeverity(scanSize);
  const sizeWarningMessage =
    scanSizeSeverity === "danger" ? GEO_SCAN_SIZE_DANGER : GEO_SCAN_SIZE_WARN;
  // Only warn when the scan costs more answers than remain. An unknown
  // balance (loading or missing) keeps the warning visible.
  const showSizeWarning =
    scanSizeSeverity !== "ok" &&
    (answersLoading || answersBalance === null || scanSize > answersBalance);

  const engineFamilyEntries = new Map<string, string>();
  for (const engine of engines) {
    const label = formatEngineFamily(engine);
    if (!engineFamilyEntries.has(label)) {
      engineFamilyEntries.set(label, engine);
    }
  }
  const engineFamilies = [...engineFamilyEntries].map(([label, id]) => ({
    label,
    id,
  }));

  return (
    <ResponsiveAlertDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle className="flex items-center gap-2">
            {GEO_SCAN_PREFLIGHT_TITLE}
            {showSizeWarning ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      aria-label={sizeWarningMessage}
                      className={
                        scanSizeSeverity === "danger"
                          ? "bg-destructive text-destructive-foreground inline-flex size-3.5 cursor-help items-center justify-center rounded-full text-[10px] leading-none font-bold"
                          : "bg-warning text-warning-foreground inline-flex size-3.5 cursor-help items-center justify-center rounded-full text-[10px] leading-none font-bold"
                      }
                    />
                  }
                >
                  !
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {sizeWarningMessage}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {GEO_SCAN_PREFLIGHT_BODY}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">
            {GEO_SCAN_PREFLIGHT_PROMPTS_LABEL}
          </dt>
          <dd className="tabular-nums">{promptCount.toLocaleString()}</dd>
          <dt className="text-muted-foreground">
            {GEO_SCAN_PREFLIGHT_ENGINES_LABEL}
          </dt>
          <dd className="min-w-0">
            <span className="tabular-nums">{engines.length}</span>
            {engineFamilies.length > 0 ? (
              <>
                <span className="text-muted-foreground">{" · "}</span>
                <span className="inline-flex items-center gap-1.5 align-middle">
                  {engineFamilies.map(({ id, label }) => (
                    <Tooltip key={id}>
                      <TooltipTrigger
                        render={
                          <span
                            aria-label={label}
                            className="inline-flex cursor-help"
                          />
                        }
                      >
                        <EngineIcon className="size-4" engine={id} />
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </span>
              </>
            ) : null}
          </dd>
          <dt className="text-muted-foreground">
            {GEO_SCAN_PREFLIGHT_LANGUAGES_LABEL}
          </dt>
          <dd className="min-w-0">
            <span className="tabular-nums">{languages.length}</span>
            {languages.length > 0 ? (
              <span className="text-muted-foreground">
                {" · "}
                {languages.join(", ")}
              </span>
            ) : null}
          </dd>
          <dt className="text-muted-foreground">{GEO_SCAN_SIZE_LABEL}</dt>
          <dd className="tabular-nums">{scanSize.toLocaleString()}</dd>
          <dt className="text-muted-foreground">
            {GEO_SCAN_PREFLIGHT_LAST_SCAN_LABEL}
          </dt>
          <dd>{formatScanPreflightLastScan(lastScanAt)}</dd>
        </dl>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel disabled={isPending}>
            {GEO_SCAN_PREFLIGHT_CANCEL}
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction disabled={isPending} onClick={onConfirm}>
            {isPending
              ? GEO_SCAN_PREFLIGHT_PENDING
              : GEO_SCAN_PREFLIGHT_CONFIRM}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
