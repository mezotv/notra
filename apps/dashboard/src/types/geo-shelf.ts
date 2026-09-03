import type { GeoCompetitor, GeoSettings } from "@notra/geo-core/types/geo";
import type { z } from "zod";

import type {
  GEO_SHELF_SHELF_FILTERS,
  GEO_SHELF_TICKET_FILTERS,
  GEO_SHELF_VIEWS,
} from "@/constants/geo-shelf";
import type {
  geoShelfCitationSummarySchema,
  geoShelfCreateInputSchema,
  geoShelfFetchStatusSchema,
  geoShelfListResponseSchema,
  geoShelfMemberSchema,
  geoShelfMembersResponseSchema,
  geoShelfMutationResponseSchema,
  geoShelfOpportunitySchema,
  geoShelfPreviewResponseSchema,
  geoShelfOpportunityStatusSchema,
  geoShelfOpportunityWriteSchema,
  geoShelfOriginSchema,
  geoShelfOwnershipSchema,
  geoShelfPlacementSchema,
  geoShelfPlacementStatusSchema,
  geoShelfPlacementWriteSchema,
  geoShelfPrioritySchema,
  geoShelfSourceKindSchema,
  geoShelfSourceSchema,
  geoShelfUpdateInputSchema,
} from "@/schemas/geo-shelf";

export type GeoShelfSourceKind = z.infer<typeof geoShelfSourceKindSchema>;
export type GeoShelfOwnership = z.infer<typeof geoShelfOwnershipSchema>;
export type GeoShelfOrigin = z.infer<typeof geoShelfOriginSchema>;
export type GeoShelfFetchStatus = z.infer<typeof geoShelfFetchStatusSchema>;
export type GeoShelfPlacementStatus = z.infer<
  typeof geoShelfPlacementStatusSchema
>;
export type GeoShelfOpportunityStatus = z.infer<
  typeof geoShelfOpportunityStatusSchema
>;
export type GeoShelfPriority = z.infer<typeof geoShelfPrioritySchema>;
export type GeoShelfMember = z.infer<typeof geoShelfMemberSchema>;
export type GeoShelfPlacement = z.infer<typeof geoShelfPlacementSchema>;
export type GeoShelfPlacementWrite = z.infer<
  typeof geoShelfPlacementWriteSchema
>;
export type GeoShelfCitationSummary = z.infer<
  typeof geoShelfCitationSummarySchema
>;
export type GeoShelfOpportunity = z.infer<typeof geoShelfOpportunitySchema>;
export type GeoShelfOpportunityWrite = z.infer<
  typeof geoShelfOpportunityWriteSchema
>;
export type GeoShelfSource = z.infer<typeof geoShelfSourceSchema>;
export type GeoShelfListResponse = z.infer<typeof geoShelfListResponseSchema>;
export type GeoShelfMembersResponse = z.infer<
  typeof geoShelfMembersResponseSchema
>;
export type GeoShelfCreateInput = z.infer<typeof geoShelfCreateInputSchema>;
export type GeoShelfUpdateInput = z.infer<typeof geoShelfUpdateInputSchema>;
export type GeoShelfMutationResponse = z.infer<
  typeof geoShelfMutationResponseSchema
>;
export type GeoShelfPreview = z.infer<typeof geoShelfPreviewResponseSchema>;

export type GeoShelfShelfFilter = (typeof GEO_SHELF_SHELF_FILTERS)[number];
export type GeoShelfTicketFilter = (typeof GEO_SHELF_TICKET_FILTERS)[number];
export type GeoShelfView = (typeof GEO_SHELF_VIEWS)[number];

export interface GeoShelfViewToggleProps {
  value: GeoShelfView;
  onChange: (view: GeoShelfView) => void;
}

export interface GeoShelfKanbanItem {
  id: string;
  name: string;
  column: string;
  row: GeoShelfRow;
  [key: string]: unknown;
}

export interface GeoShelfKanbanProps {
  rows: GeoShelfRow[];
  currentMemberId: string | null;
  pendingSourceIds: ReadonlySet<string>;
  onOpenRow: (row: GeoShelfRow) => void;
  onUpdateOpportunity: GeoShelfDbApi["updateOpportunity"];
}

export interface GeoShelfStoreKey {
  organizationId: string;
  projectId: string;
}

export interface GeoShelfFixtureContext {
  ownBrandName: string;
  ownDomain: string | null;
  competitors: GeoCompetitor[];
  engines: string[];
  members: GeoShelfMember[];
  now: Date;
}

export interface GeoShelfStoreSeed {
  settings: GeoSettings;
  ownDomain: string | null;
  competitors: GeoCompetitor[];
  members: GeoShelfMember[];
}

export interface GeoShelfRow extends GeoShelfSource {
  ownPlacement: GeoShelfPlacement | null;
  competitorPlacements: GeoShelfPlacement[];
  presentCompetitors: GeoShelfPlacement[];
  isOpportunity: boolean;
  assignee: GeoShelfMember | null;
  poc: GeoShelfMember | null;
}

export interface GeoShelfFilterState {
  search: string;
  shelf: GeoShelfShelfFilter;
  ticket: GeoShelfTicketFilter;
  currentMemberId: string | null;
}

export interface GeoShelfNewSourceDraft {
  url: string;
  title: string;
  kind: GeoShelfSourceKind;
  ownPresent: boolean;
  presentCompetitorIds: string[];
  opportunity: GeoShelfOpportunityWrite;
}

export interface GeoShelfDbApi {
  sources: GeoShelfSource[];
  pendingSourceIds: ReadonlySet<string>;
  addSource: (source: GeoShelfSource) => void;
  updateOpportunity: (
    sourceId: string,
    changes: Partial<GeoShelfOpportunityWrite>
  ) => void;
  setPlacementStatus: (
    sourceId: string,
    competitorId: string | null,
    status: GeoShelfPlacementStatus
  ) => void;
}

export interface GeoShelfPageContentProps {
  organizationSlug: string;
}

export interface GeoShelfToolbarProps {
  filters: GeoShelfFilterState;
  onSearchChange: (value: string) => void;
  onShelfFilterChange: (value: GeoShelfShelfFilter) => void;
  onTicketFilterChange: (value: GeoShelfTicketFilter) => void;
  view: GeoShelfView;
  onViewChange: (view: GeoShelfView) => void;
}

export interface GeoShelfTableProps {
  rows: GeoShelfRow[];
  totalCount: number;
  onRowClick: (row: GeoShelfRow) => void;
  pendingSourceIds: ReadonlySet<string>;
  hasScanData: boolean;
  onAddShelf: () => void;
}

export interface GeoShelfPlacementBadgeProps {
  status: GeoShelfPlacementStatus | null;
  evidence?: GeoShelfPlacement["evidence"];
  className?: string;
}

export interface GeoShelfTicketBadgeProps {
  status: GeoShelfOpportunityStatus;
  className?: string;
}

export interface GeoShelfMemberAvatarProps {
  member: GeoShelfMember | null;
  className?: string;
  fallbackLabel?: string;
}

export interface GeoShelfMemberSelectProps {
  members: GeoShelfMember[];
  value: string | null;
  onChange: (memberId: string | null) => void;
  placeholder?: string;
  allowSameAsAssignee?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

export interface GeoShelfDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: GeoShelfRow | null;
  members: GeoShelfMember[];
  currentMemberId: string | null;
  ownBrandName: string;
  onUpdateOpportunity: GeoShelfDbApi["updateOpportunity"];
  onSetPlacementStatus: GeoShelfDbApi["setPlacementStatus"];
  isPending: boolean;
}

export interface GeoShelfTicketFormProps {
  opportunity: GeoShelfOpportunity | null;
  members: GeoShelfMember[];
  currentMemberId: string | null;
  onChange: (changes: Partial<GeoShelfOpportunityWrite>) => void;
  disabled: boolean;
}

export interface GeoShelfAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  competitors: GeoCompetitor[];
  members: GeoShelfMember[];
  currentMemberId: string | null;
  ownBrandName: string;
  onSubmit: (draft: GeoShelfNewSourceDraft) => void;
}

export interface GeoShelfPlacementsTableProps {
  row: GeoShelfRow;
  ownBrandName: string;
  onSetPlacementStatus: GeoShelfDbApi["setPlacementStatus"];
  disabled: boolean;
}
