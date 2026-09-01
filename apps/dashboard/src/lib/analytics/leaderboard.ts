import type {
  LeaderboardAccount,
  LeaderboardEntry,
  LeaderboardWindowTotals,
} from "@/types/analytics";

function leaderboardAccountKey(
  provider: string,
  providerAccountId: string
): string {
  return `${provider}:${providerAccountId}`;
}

interface RankableTotals {
  key: string;
  interactions: number;
  impressions: number;
}

function rankByInteractions(items: RankableTotals[]): Map<string, number> {
  const sorted = [...items].sort((left, right) => {
    if (right.interactions !== left.interactions) {
      return right.interactions - left.interactions;
    }
    return right.impressions - left.impressions;
  });
  return new Map(sorted.map((item, index) => [item.key, index + 1]));
}

export function buildLeaderboardEntries(
  accounts: LeaderboardAccount[],
  totals: LeaderboardWindowTotals[]
): LeaderboardEntry[] {
  const totalsByKey = new Map(
    totals.map((row) => [
      leaderboardAccountKey(row.provider, row.providerAccountId),
      row,
    ])
  );

  const current: RankableTotals[] = [];
  const previous: RankableTotals[] = [];

  for (const account of accounts) {
    const key = leaderboardAccountKey(
      account.provider,
      account.providerAccountId
    );
    const row = totalsByKey.get(key);
    current.push({
      key,
      interactions: row?.interactions ?? 0,
      impressions: row?.impressions ?? 0,
    });
    const hasPreviousData =
      (row?.previousPosts ?? 0) > 0 || (row?.previousInteractions ?? 0) > 0;
    if (hasPreviousData && row) {
      previous.push({
        key,
        interactions: row.previousInteractions,
        impressions: row.previousImpressions,
      });
    }
  }

  const currentRanks = rankByInteractions(current);
  const previousRanks = rankByInteractions(previous);

  const entries = accounts.map((account) => {
    const key = leaderboardAccountKey(
      account.provider,
      account.providerAccountId
    );
    const row = totalsByKey.get(key);
    const rank = currentRanks.get(key) ?? accounts.length;
    const previousRank = previousRanks.get(key) ?? null;
    return {
      key,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      username: account.username,
      displayName: account.displayName,
      profileImageUrl: account.profileImageUrl,
      verified: account.verified,
      verifiedType: account.verifiedType,
      isConnected: account.isConnected,
      trackedAccountId: account.trackedAccountId,
      rank,
      previousRank,
      rankChange: previousRank === null ? null : previousRank - rank,
      interactions: row?.interactions ?? 0,
      impressions: row?.impressions ?? null,
      posts: row?.posts ?? 0,
    };
  });

  return entries.sort((left, right) => left.rank - right.rank);
}
