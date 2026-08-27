import {
  GEO_FAMILY_IMPROVE_SPLIT,
  GEO_FAMILY_IMPROVE_STRONG_RATE,
} from "@/constants/geo";
import type {
  FamilyImproveInsight,
  FamilyImproveKind,
  GeoEngineFamilyTotals,
} from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";

function promptCountLabel(missed: number): string {
  return `${missed.toLocaleString()} prompt${missed === 1 ? "" : "s"}`;
}

function classifyImproveKind(
  searchRate: number | null,
  memoryRate: number | null
): FamilyImproveKind {
  if (searchRate !== null && memoryRate !== null) {
    if (searchRate - memoryRate >= GEO_FAMILY_IMPROVE_SPLIT) {
      return "search-ahead";
    }
    if (memoryRate - searchRate >= GEO_FAMILY_IMPROVE_SPLIT) {
      return "memory-ahead";
    }
  }

  const peak = Math.max(searchRate ?? 0, memoryRate ?? 0);
  if (peak >= GEO_FAMILY_IMPROVE_STRONG_RATE) {
    return "closing";
  }
  return "both-weak";
}

function insightCopy(
  kind: FamilyImproveKind,
  familyLabel: string,
  searchRate: number | null,
  memoryRate: number | null,
  missed: number
): Pick<FamilyImproveInsight, "title" | "body"> {
  const prompts = promptCountLabel(missed);
  const search = searchRate === null ? null : formatMentionRate(searchRate);
  const memory = memoryRate === null ? null : formatMentionRate(memoryRate);

  if (kind === "search-ahead" && search && memory) {
    return {
      title: "Search finds you. Memory doesn't.",
      body: `When ${familyLabel} looks at the web it mentions you ${search}. Without search it's ${memory}. Pages that answer the ${prompts} it missed are how search keeps citing you.`,
    };
  }

  if (kind === "memory-ahead" && search && memory) {
    return {
      title: "Remembered, not found.",
      body: `${familyLabel} already names you without searching (${memory}), but live search only mentions you ${search}. Pages that match the ${prompts} it missed close that gap.`,
    };
  }

  if (kind === "closing") {
    return {
      title: `${prompts} still miss you`,
      body: `${familyLabel} already mentions you often. Closing the remaining misses is the fastest way to raise the rate.`,
    };
  }

  return {
    title: `${prompts} never mention you`,
    body: `Neither search nor memory is recommending you on these questions. Write the pages that answer them.`,
  };
}

export function familyImproveInsight(input: {
  familyLabel: string;
  search: GeoEngineFamilyTotals | null;
  memory: GeoEngineFamilyTotals | null;
  missed: number;
}): FamilyImproveInsight | null {
  if (input.missed <= 0) {
    return null;
  }

  const searchRate = input.search?.rate ?? null;
  const memoryRate = input.memory?.rate ?? null;
  const kind = classifyImproveKind(searchRate, memoryRate);
  const copy = insightCopy(
    kind,
    input.familyLabel,
    searchRate,
    memoryRate,
    input.missed
  );

  return { kind, ...copy };
}
