import { db } from "@notra/db/drizzle";
import { postCollections } from "@notra/db/schema";
import { projectScopeFilter } from "@notra/db/utils/projects";
import { and, eq } from "drizzle-orm";

/**
 * Subquery of collection ids visible from a project. Posts carry no project
 * of their own; they inherit it from their collection. Returns undefined when
 * no project is active so callers can skip the filter entirely.
 */
export function projectScopedCollectionIds(
  organizationId: string,
  projectId: string | null | undefined
) {
  const scope = projectScopeFilter(postCollections.projectId, projectId);
  if (!scope) {
    return;
  }
  return db
    .select({ id: postCollections.id })
    .from(postCollections)
    .where(and(eq(postCollections.organizationId, organizationId), scope));
}
