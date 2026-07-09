import { DOMAINS } from "free-email-domains-list";
import { isValid as isNotDisposableEmail } from "mailchecker";
import { WEBSITE_REACHABILITY_TIMEOUT_MS } from "@/constants/onboarding-agent";
import type { CompanyDomainResolution } from "@/types/onboarding-agent";

const WWW_PREFIX_PATTERN = /^www\./;
const SERVER_ERROR_STATUS = 500;

function extractDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    const hostname = new URL(withProtocol).hostname.replace(
      WWW_PREFIX_PATTERN,
      ""
    );
    return hostname.includes(".") ? hostname : null;
  } catch {
    return null;
  }
}

function isFreeEmailDomain(domain: string): boolean {
  return DOMAINS.has(domain.toLowerCase());
}

export function resolveCompanyDomain({
  websiteUrl,
  email,
}: {
  websiteUrl?: string;
  email?: string;
}): CompanyDomainResolution | null {
  const websiteDomain = websiteUrl ? extractDomain(websiteUrl) : null;
  if (websiteDomain && !isFreeEmailDomain(websiteDomain)) {
    return { domain: websiteDomain, source: "website" };
  }

  if (email && isNotDisposableEmail(email)) {
    const emailDomain = extractDomain(email.split("@").at(-1) ?? "");
    if (emailDomain && !isFreeEmailDomain(emailDomain)) {
      return { domain: emailDomain, source: "email" };
    }
  }

  return null;
}

async function fetchWebsite(domain: string, method: "HEAD" | "GET") {
  return await fetch(`https://${domain}`, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(WEBSITE_REACHABILITY_TIMEOUT_MS),
  });
}

export async function isWebsiteReachable(domain: string): Promise<boolean> {
  try {
    const response = await fetchWebsite(domain, "HEAD");
    if (response.status < SERVER_ERROR_STATUS) {
      return true;
    }
  } catch {}

  try {
    const response = await fetchWebsite(domain, "GET");
    return response.status < SERVER_ERROR_STATUS;
  } catch {
    return false;
  }
}
