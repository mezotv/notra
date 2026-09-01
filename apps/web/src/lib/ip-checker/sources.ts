import { Data, Effect } from "effect";

import {
  CRAWLER_IP_SOURCES,
  IP_CHECKER_EASTER_EGGS,
  IP_CHECKER_FETCH_USER_AGENT,
  IP_CHECKER_LIST_REVALIDATE_SECONDS,
} from "@/constants/ip-checker";
import {
  readListsFromMemory,
  readPayloadFromRedis,
  writeListsToMemory,
  writePayloadToRedis,
} from "@/lib/ip-checker/cache";
import { parseCidr, rangeContains } from "@/lib/ip-checker/cidr";
import { crawlerIpListPayloadSchema } from "@/schemas/ip-checker";
import type {
  CrawlerIpList,
  CrawlerIpRange,
  CrawlerIpSource,
  CrawlerListSummary,
  IpCheckMatch,
  IpCheckResult,
  ParsedIp,
} from "@/types/ip-checker";

class CrawlerIpListFetchError extends Data.TaggedError(
  "CrawlerIpListFetchError"
)<{
  readonly sourceId: string;
  readonly cause: unknown;
}> {}

const fetchCrawlerIpList = Effect.fn("fetchCrawlerIpList")(function* (
  source: CrawlerIpSource
) {
  const payload = yield* Effect.tryPromise({
    try: async () => {
      const cached = await readPayloadFromRedis(source.id);
      if (cached) {
        return cached;
      }
      const response = await fetch(source.url, {
        headers: {
          accept: "application/json",
          "user-agent": IP_CHECKER_FETCH_USER_AGENT,
        },
        next: { revalidate: IP_CHECKER_LIST_REVALIDATE_SECONDS },
      });
      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      const parsed = crawlerIpListPayloadSchema.parse(await response.json());
      await writePayloadToRedis(source.id, parsed);
      return parsed;
    },
    catch: (cause) =>
      new CrawlerIpListFetchError({ sourceId: source.id, cause }),
  });

  const ranges: CrawlerIpRange[] = [];
  for (const entry of payload.prefixes) {
    const prefix = entry.ipv4Prefix ?? entry.ipv6Prefix;
    const range = prefix ? parseCidr(prefix) : null;
    if (range) {
      ranges.push(range);
    }
  }

  return {
    source,
    ranges,
    updatedAt: payload.creationTime ?? null,
    ok: true,
  } satisfies CrawlerIpList;
});

const loadCrawlerIpList = Effect.fn("loadCrawlerIpList")(function* (
  source: CrawlerIpSource
) {
  return yield* fetchCrawlerIpList(source).pipe(
    Effect.catch(() =>
      Effect.succeed({
        source,
        ranges: [],
        updatedAt: null,
        ok: false,
      } satisfies CrawlerIpList)
    )
  );
});

export const loadCrawlerIpLists = Effect.fn("loadCrawlerIpLists")(function* () {
  const cached = readListsFromMemory();
  if (cached) {
    return cached;
  }
  const lists = yield* Effect.all(
    CRAWLER_IP_SOURCES.map((source) => loadCrawlerIpList(source)),
    { concurrency: "unbounded" }
  );
  if (lists.every((list) => list.ok)) {
    writeListsToMemory(lists);
  }
  return lists;
});

function findCrawlerMatches(
  lists: readonly CrawlerIpList[],
  ip: ParsedIp
): IpCheckMatch[] {
  const matches: IpCheckMatch[] = [];
  for (const list of lists) {
    const range = list.ranges.find((candidate) =>
      rangeContains(candidate, ip.version, ip.value)
    );
    if (!range) {
      continue;
    }
    matches.push({
      sourceId: list.source.id,
      vendor: list.source.vendor,
      iconEngine: list.source.iconEngine,
      agents: [...list.source.agents],
      range: range.prefix,
      listUrl: list.source.url,
      docs: list.source.docs,
      listUpdatedAt: list.updatedAt,
    });
  }
  return matches;
}

export function buildIpCheckResult(
  lists: readonly CrawlerIpList[],
  ip: ParsedIp
): IpCheckResult {
  let listsChecked = 0;
  const listsUnavailable: string[] = [];
  for (const list of lists) {
    if (list.ok) {
      listsChecked += 1;
    } else {
      listsUnavailable.push(list.source.vendor);
    }
  }
  return {
    ip: ip.normalized,
    version: ip.version,
    easterEgg:
      IP_CHECKER_EASTER_EGGS.find((egg) => egg.ip === ip.normalized) ?? null,
    matches: findCrawlerMatches(lists, ip),
    listsChecked,
    listsUnavailable,
  };
}

export function summarizeCrawlerIpLists(
  lists: readonly CrawlerIpList[]
): CrawlerListSummary[] {
  return lists.map((list) => ({
    id: list.source.id,
    vendor: list.source.vendor,
    iconEngine: list.source.iconEngine,
    agents: [...list.source.agents],
    rangeCount: list.ranges.length,
    updatedAt: list.updatedAt,
    url: list.source.url,
    ok: list.ok,
  }));
}
