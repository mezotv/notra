import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [".internal", ".local", ".localhost"];
const IPV4_MAPPED_IPV6_REGEX = /::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let result = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    result = result * 256 + octet;
  }
  return result;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const value = ipv4ToNumber(ip);
  if (value === null) {
    return true;
  }

  const ranges: [number, number][] = [
    [0x00_00_00_00, 0x00_ff_ff_ff], // 0.0.0.0/8
    [0x0a_00_00_00, 0x0a_ff_ff_ff], // 10.0.0.0/8
    [0x7f_00_00_00, 0x7f_ff_ff_ff], // 127.0.0.0/8
    [0xa9_fe_00_00, 0xa9_fe_ff_ff], // 169.254.0.0/16
    [0xac_10_00_00, 0xac_1f_ff_ff], // 172.16.0.0/12
    [0xc0_a8_00_00, 0xc0_a8_ff_ff], // 192.168.0.0/16
    [0xe0_00_00_00, 0xff_ff_ff_ff], // 224.0.0.0/4 + 240.0.0.0/4 + broadcast
  ];

  return ranges.some(([start, end]) => value >= start && value <= end);
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === "::" || normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80::")) {
    return true;
  }

  const firstByte = Number.parseInt(normalized.split(":")[0] ?? "", 16);
  if (Number.isFinite(firstByte)) {
    // biome-ignore lint/suspicious/noBitwiseOperators: <>
    const isUniqueLocal = (firstByte & 0xfe_00) === 0xfc_00;
    // biome-ignore lint/suspicious/noBitwiseOperators: <>
    const isReserved = (firstByte & 0xff_00) === 0xff_00;
    if (isUniqueLocal || isReserved) {
      return true;
    }
  }

  const mappedMatch = normalized.match(IPV4_MAPPED_IPV6_REGEX);
  if (mappedMatch?.[1]) {
    return isPrivateOrReservedIpv4(mappedMatch[1]);
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix)
  );
}

export function assertPublicHttpUrl(raw: string): void {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL userinfo is not allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (!hostname) {
    throw new Error("URL must include a hostname");
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    if (isPrivateOrReservedIpv4(hostname)) {
      throw new Error("Private or reserved IP addresses are not allowed");
    }
    return;
  }

  if (ipVersion === 6) {
    if (isPrivateOrReservedIpv6(hostname)) {
      throw new Error("Private or reserved IP addresses are not allowed");
    }
    return;
  }

  if (isBlockedHostname(hostname)) {
    throw new Error("Internal or metadata hostnames are not allowed");
  }
}
