import type { GeoCompetitor } from "@notra/geo-core/types/geo";

import {
  GEO_SHELF_KANBAN_NO_TICKET_COLUMN,
  GEO_SHELF_OPEN_STATUSES,
  GEO_SHELF_VIEWS,
} from "@/constants/geo-shelf";
import type {
  GeoShelfFilterState,
  GeoShelfMember,
  GeoShelfNewSourceDraft,
  GeoShelfOpportunity,
  GeoShelfOpportunityWrite,
  GeoShelfPlacement,
  GeoShelfRow,
  GeoShelfSource,
  GeoShelfView,
} from "@/types/geo-shelf";

export function isOpenShelfStatus(
  status: GeoShelfOpportunity["status"] | null | undefined
): boolean {
  return status ? GEO_SHELF_OPEN_STATUSES.includes(status) : false;
}

export function resolveShelfPoc(
  opportunity: GeoShelfOpportunity | null
): string | null {
  if (!opportunity) {
    return null;
  }
  return opportunity.pocMemberId ?? opportunity.assigneeMemberId;
}

export function toShelfRows(
  sources: GeoShelfSource[],
  members: GeoShelfMember[]
): GeoShelfRow[] {
  const memberById = new Map(members.map((member) => [member.id, member]));
  return sources.map((source) => {
    const ownPlacement =
      source.placements.find((placement) => placement.competitorId === null) ??
      null;
    const competitorPlacements = source.placements.filter(
      (placement) => placement.competitorId !== null
    );
    const presentCompetitors = competitorPlacements.filter(
      (placement) => placement.status === "present"
    );
    const isOpportunity =
      source.ownership === "third_party" &&
      ownPlacement?.status !== "present" &&
      presentCompetitors.length > 0;
    const assigneeId = source.opportunity?.assigneeMemberId ?? null;
    const pocId = resolveShelfPoc(source.opportunity);
    return {
      ...source,
      ownPlacement,
      competitorPlacements,
      presentCompetitors,
      isOpportunity,
      assignee: assigneeId ? (memberById.get(assigneeId) ?? null) : null,
      poc: pocId ? (memberById.get(pocId) ?? null) : null,
    };
  });
}

function matchesShelfFilter(
  row: GeoShelfRow,
  shelf: GeoShelfFilterState["shelf"]
): boolean {
  switch (shelf) {
    case "opportunities":
      return row.isOpportunity;
    case "on_shelf":
      return row.ownPlacement?.status === "present";
    case "unknown":
      return (
        row.ownPlacement === null ||
        row.ownPlacement.status === "unknown" ||
        row.fetchStatus === "blocked" ||
        row.fetchStatus === "pending"
      );
    default:
      return true;
  }
}

function matchesTicketFilter(
  row: GeoShelfRow,
  ticket: GeoShelfFilterState["ticket"],
  currentMemberId: string | null
): boolean {
  const opportunity = row.opportunity;
  switch (ticket) {
    case "open":
      return opportunity?.status === "open";
    case "in_progress":
      return opportunity?.status === "in_progress";
    case "mine":
      return (
        currentMemberId !== null &&
        isOpenShelfStatus(opportunity?.status) &&
        (opportunity?.assigneeMemberId === currentMemberId ||
          resolveShelfPoc(opportunity) === currentMemberId)
      );
    case "unassigned":
      return (
        isOpenShelfStatus(opportunity?.status) &&
        opportunity?.assigneeMemberId === null
      );
    case "closed":
      return opportunity !== null && !isOpenShelfStatus(opportunity.status);
    default:
      return true;
  }
}

function matchesSearch(row: GeoShelfRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (query.length === 0) {
    return true;
  }
  const haystack = [
    row.title ?? "",
    row.domain,
    row.url,
    ...row.presentCompetitors.map((placement) => placement.brandName),
    row.assignee?.name ?? "",
    row.opportunity?.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function filterShelfRows(
  rows: GeoShelfRow[],
  filters: GeoShelfFilterState
): GeoShelfRow[] {
  return rows.filter(
    (row) =>
      matchesShelfFilter(row, filters.shelf) &&
      matchesTicketFilter(row, filters.ticket, filters.currentMemberId) &&
      matchesSearch(row, filters.search)
  );
}

export function mergeShelfOpportunity(
  existing: GeoShelfOpportunity | null,
  changes: Partial<GeoShelfOpportunityWrite>,
  nowIso: string
): GeoShelfOpportunity {
  const base: GeoShelfOpportunity = existing ?? {
    id: crypto.randomUUID(),
    status: "open",
    priority: null,
    assigneeMemberId: null,
    pocMemberId: null,
    notes: null,
    dueAt: null,
    createdByUserId: null,
    resolvedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const next: GeoShelfOpportunity = { ...base, ...changes, updatedAt: nowIso };
  if (
    changes.assigneeMemberId !== undefined &&
    next.pocMemberId === changes.assigneeMemberId
  ) {
    next.pocMemberId = null;
  }
  next.resolvedAt = isOpenShelfStatus(next.status)
    ? null
    : (base.resolvedAt ?? nowIso);
  return next;
}

export function buildOptimisticShelfSource(
  draft: GeoShelfNewSourceDraft,
  context: {
    ownBrandName: string;
    ownDomain: string | null;
    competitors: GeoCompetitor[];
    createdByUserId: string | null;
  }
): GeoShelfSource {
  const nowIso = new Date().toISOString();
  const url = new URL(draft.url.trim());
  const presentIds = new Set(draft.presentCompetitorIds);
  const placements: GeoShelfPlacement[] = [
    {
      competitorId: null,
      brandName: context.ownBrandName,
      brandDomain: context.ownDomain,
      status: draft.ownPresent ? "present" : "absent",
      position: null,
      hasLink: false,
      evidence: "manual",
      excerpt: null,
      checkedAt: nowIso,
    },
    ...context.competitors.map<GeoShelfPlacement>((competitor) => ({
      competitorId: competitor.id,
      brandName: competitor.name,
      brandDomain: competitor.domain,
      status: presentIds.has(competitor.id) ? "present" : "unknown",
      position: null,
      hasLink: false,
      evidence: "manual",
      excerpt: null,
      checkedAt: nowIso,
    })),
  ];
  const title = draft.title.trim();
  return {
    id: crypto.randomUUID(),
    url: url.toString(),
    domain: url.hostname.toLowerCase().replace(/^www\./, ""),
    title: title.length > 0 ? title : null,
    kind: draft.kind,
    ownership: "third_party",
    origin: "manual",
    fetchStatus: "pending",
    lastFetchedAt: null,
    citations: {
      windowCount: 0,
      totalCount: 0,
      promptCount: 0,
      engines: [],
      firstCitedAt: null,
      lastCitedAt: null,
    },
    placements,
    opportunity: mergeShelfOpportunity(null, draft.opportunity, nowIso),
    createdByUserId: context.createdByUserId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function shelfMemberInitial(member: GeoShelfMember): string {
  return (member.name || member.email).charAt(0).toUpperCase();
}

export function formatShelfDate(iso: string | null): string {
  if (!iso) {
    return "-";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatShelfDueDate(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function shelfDueDateToIso(date: Date): string {
  const noon = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  );
  return noon.toISOString();
}

export function shelfKanbanColumnFor(row: GeoShelfRow): string {
  return row.opportunity?.status ?? GEO_SHELF_KANBAN_NO_TICKET_COLUMN;
}

export function isShelfView(value: string | null): value is GeoShelfView {
  return GEO_SHELF_VIEWS.some((view) => view === value);
}
