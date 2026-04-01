"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

/**
 * Company logo via DuckDuckGo Icons API (same as dashboard).
 * Falls back to a colored initial if the image fails to load.
 */

export function CompanyLogoWithFallback({
  name,
  websiteUrl,
  accentColor,
  size = 20,
}: {
  name: string;
  websiteUrl: string;
  accentColor: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const domain = new URL(websiteUrl).hostname;
  const logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  if (failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded font-semibold text-white"
        style={{
          backgroundColor: accentColor ?? "#6b7280",
          width: size,
          height: size,
          fontSize: size * 0.5,
        }}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <img
      alt={`${name} logo`}
      className="rounded"
      height={size}
      onError={() => setFailed(true)}
      src={logoUrl}
      width={size}
    />
  );
}

/**
 * SVG icons for reference platform types.
 */
export function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function BlogIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
    </svg>
  );
}

export function CustomIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

/**
 * X/Twitter verified badges.
 */
export function GoldVerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Verified account"
      className={className}
      role="img"
      viewBox="0 0 22 22"
    >
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="gold-a"
        x1="4.411"
        x2="18.083"
        y1="2.495"
        y2="21.508"
      >
        <stop offset="0" stopColor="#f4e72a" />
        <stop offset=".539" stopColor="#cd8105" />
        <stop offset=".68" stopColor="#cb7b00" />
        <stop offset="1" stopColor="#f4ec26" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="gold-b"
        x1="5.355"
        x2="16.361"
        y1="3.395"
        y2="19.133"
      >
        <stop offset="0" stopColor="#f9e87f" />
        <stop offset=".406" stopColor="#e2b719" />
        <stop offset=".989" stopColor="#e2b719" />
      </linearGradient>
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="M13.324 3.848L11 1.6 8.676 3.848l-3.201-.453-.559 3.184L2.06 8.095 3.48 11l-1.42 2.904 2.856 1.516.559 3.184 3.201-.452L11 20.4l2.324-2.248 3.201.452.559-3.184 2.856-1.516L18.52 11l1.42-2.905-2.856-1.516-.559-3.184zm-7.09 7.575l3.428 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z"
          fill="url(#gold-a)"
        />
        <path
          d="M13.101 4.533L11 2.5 8.899 4.533l-2.895-.41-.505 2.88-2.583 1.37L4.2 11l-1.284 2.627 2.583 1.37.505 2.88 2.895-.41L11 19.5l2.101-2.033 2.895.41.505-2.88 2.583-1.37L17.8 11l1.284-2.627-2.583-1.37-.505-2.88zm-6.868 6.89l3.429 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z"
          fill="url(#gold-b)"
        />
        <path
          d="M6.233 11.423l3.429 3.428 5.65-6.17.038-.033-.005 1.398-5.683 6.206-3.429-3.429-.003-1.405.005.003z"
          fill="#d18800"
        />
      </g>
    </svg>
  );
}

export function BlueVerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Verified account"
      className={className}
      role="img"
      viewBox="0 0 22 22"
    >
      <g>
        <path
          clipRule="evenodd"
          d="M13.324 3.848L11 1.6 8.676 3.848l-3.201-.453-.559 3.184L2.06 8.095 3.48 11l-1.42 2.904 2.856 1.516.559 3.184 3.201-.452L11 20.4l2.324-2.248 3.201.452.559-3.184 2.856-1.516L18.52 11l1.42-2.905-2.856-1.516-.559-3.184zm-7.09 7.575l3.428 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z"
          fill="#1d9bf0"
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function VerifiedBadge({
  variant,
  className,
}: {
  variant: "blue" | "gold";
  className?: string;
}) {
  return variant === "gold" ? (
    <GoldVerifiedBadge className={className} />
  ) : (
    <BlueVerifiedBadge className={className} />
  );
}

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  twitter_post: XIcon,
  linkedin_post: LinkedInIcon,
  blog_post: BlogIcon,
  custom: CustomIcon,
};

export function PlatformIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = PLATFORM_ICONS[type] ?? CustomIcon;
  return <Icon className={className} />;
}
