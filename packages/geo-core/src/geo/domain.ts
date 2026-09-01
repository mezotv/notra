import type { GeoCompetitor } from "../types/geo";

const PROTOCOL_REGEX = /^[a-z][a-z0-9+.-]*:\/\//i;
const LEADING_WWW_REGEX = /^www\./;
const PATH_SEPARATOR_REGEX = /[/?#]/;

export function normalizeCompetitorDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }

  const withoutProtocol = trimmed.replace(PROTOCOL_REGEX, "");
  const hostname = withoutProtocol.split(PATH_SEPARATOR_REGEX)[0] ?? "";
  const withoutPort = hostname.split(":")[0] ?? "";
  const bare = withoutPort.replace(LEADING_WWW_REGEX, "");

  return bare.length === 0 ? null : bare;
}

export function competitorKey(name: string): string {
  return name.trim().toLowerCase();
}

export function findCompetitor(
  competitors: GeoCompetitor[] | undefined,
  name: string
): GeoCompetitor | null {
  if (!competitors) {
    return null;
  }
  const key = competitorKey(name);
  return (
    competitors.find((competitor) => competitorKey(competitor.name) === key) ??
    null
  );
}

export function findCompetitorDomain(
  competitors: GeoCompetitor[] | undefined,
  name: string
): string | null {
  return findCompetitor(competitors, name)?.domain ?? null;
}
