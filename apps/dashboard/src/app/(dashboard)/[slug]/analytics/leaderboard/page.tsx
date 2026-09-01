import type { Metadata } from "next";

import LeaderboardPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Leaderboard",
};

function Page() {
  return <LeaderboardPageClient />;
}

export default Page;
