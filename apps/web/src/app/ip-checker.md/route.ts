import { Effect } from "effect";
import type { NextRequest } from "next/server";

import { IP_CHECKER_QUERY_KEY } from "@/constants/ip-checker";
import { parseIp } from "@/lib/ip-checker/cidr";
import { buildIpCheckerMarkdown } from "@/lib/ip-checker/markdown";
import {
  buildIpCheckResult,
  loadCrawlerIpLists,
  summarizeCrawlerIpLists,
} from "@/lib/ip-checker/sources";
import { ipCheckRequestSchema } from "@/schemas/ip-checker";
import { markdownResponse } from "@/utils/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawIp = request.nextUrl.searchParams.get(IP_CHECKER_QUERY_KEY);
  const parsedInput = rawIp
    ? ipCheckRequestSchema.safeParse({ ip: rawIp })
    : null;
  const ip = parsedInput?.success ? parseIp(parsedInput.data.ip) : null;
  const invalidInput = rawIp && !ip ? rawIp.slice(0, 64) : null;

  const lists = await Effect.runPromise(loadCrawlerIpLists());
  const result = ip ? buildIpCheckResult(lists, ip) : null;
  const markdown = buildIpCheckerMarkdown(
    summarizeCrawlerIpLists(lists),
    result,
    invalidInput
  );

  return markdownResponse(markdown, invalidInput ? 422 : 200);
}
