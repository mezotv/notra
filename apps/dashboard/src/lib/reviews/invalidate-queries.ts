import { dashboardOrpc } from "@/lib/orpc/query";
import type { InvalidatePostReviewQueriesInput } from "@/types/reviews";

export async function invalidatePostReviewQueries({
  queryClient,
  organizationId,
  contentId,
}: InvalidatePostReviewQueriesInput) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.reviews.state.queryKey({
        input: { organizationId, contentId },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.reviews.inbox.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.get.queryKey({
        input: { organizationId, contentId },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.list.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.collections.list.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.collections.get.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.content.metrics.get.queryKey({
        input: { organizationId },
      }),
    }),
  ]);
}
