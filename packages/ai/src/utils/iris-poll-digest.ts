import {
  IRIS_POLL_DIGEST_ITEMS_PER_SOURCE,
  IRIS_POLL_DIGEST_TITLE_LIMIT,
} from "@notra/ai/constants/autonomy-poll";
import type {
  IrisPollDigestInput,
  IrisPollItem,
  IrisSourcePollResult,
} from "@notra/ai/types/autonomy-poll";

const DIGEST_HEADING = "## Source activity digest";

const truncateTitle = (value: string): string =>
  value.length <= IRIS_POLL_DIGEST_TITLE_LIMIT
    ? value
    : `${value.slice(0, IRIS_POLL_DIGEST_TITLE_LIMIT).trimEnd()}...`;

const buildItemLine = (item: IrisPollItem): string => {
  const day = item.occurredAt.toISOString().slice(0, 10);
  const title = truncateTitle(item.title);
  return item.url ? `- ${day} ${title} (${item.url})` : `- ${day} ${title}`;
};

const buildSourceSection = (source: IrisSourcePollResult): string => {
  const lines = [`### ${source.source}`];

  if (source.items.length === 0) {
    lines.push(`- No changes: ${source.skippedReason ?? "nothing new"}`);
    return lines.join("\n");
  }

  const ordered = Array.from(source.items).sort(
    (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()
  );

  for (const item of ordered.slice(0, IRIS_POLL_DIGEST_ITEMS_PER_SOURCE)) {
    lines.push(buildItemLine(item));
  }

  const overflow = ordered.length - IRIS_POLL_DIGEST_ITEMS_PER_SOURCE;
  if (overflow > 0) {
    lines.push(`- and ${overflow} more`);
  }

  return lines.join("\n");
};

export const buildIrisPollDigest = (input: IrisPollDigestInput): string => {
  const header = [
    DIGEST_HEADING,
    `Window: last ${input.lookbackHours} hours, checked at ${input.generatedAt.toISOString()}`,
  ].join("\n\n");

  const sections = input.sources.map(buildSourceSection);

  return [header, ...sections].join("\n\n");
};
