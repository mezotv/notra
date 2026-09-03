export interface ActiveProjectState {
  /** Project the Studio views are scoped to; null when the organization has none. */
  projectId: string | null;
  /** False while the project list is still loading, so dependent queries can wait. */
  isResolved: boolean;
}
