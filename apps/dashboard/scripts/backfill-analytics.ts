import { isTinybirdConfigured } from "@notra/analytics/tinybird/client";
import {
  listSyncableAccounts,
  snapshotAccountDimensions,
  syncTwitterAnalytics,
} from "@/workflows/steps/social-analytics-steps";

if (!isTinybirdConfigured()) {
  throw new Error("Tinybird is not configured (TINYBIRD_TOKEN missing)");
}

const organizationId = process.argv[2];

const accounts = await listSyncableAccounts(organizationId);
console.log(
  `Syncable accounts: ${accounts.length}`,
  accounts.map((a) => `@${a.username} (${a.provider})`)
);

if (accounts.length === 0) {
  console.log("Nothing to sync.");
  process.exit(0);
}

const snapped = await snapshotAccountDimensions(accounts);
console.log(`Snapshotted ${snapped} account dimension rows`);

const twitter = await syncTwitterAnalytics(accounts);
console.log(
  `Twitter sync: ${twitter.accountStats} account stat rows, ${twitter.posts} posts`
);

console.log("Backfill complete.");
process.exit(0);
