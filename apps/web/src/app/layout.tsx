import { C15tPrefetch } from "@c15t/nextjs";
import { Databuddy, FlagsProvider } from "@databuddy/sdk/react";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ConsentManager } from "../components/consent-manager";
import { SiteShell } from "../components/site-shell";
import { ThemeProvider } from "../components/theme-provider";
import { RSS_FEED_PATH, RSS_FEED_TITLE } from "../utils/constants";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "../utils/metadata";
import { SITE_URL } from "../utils/urls";

import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { color: "#f7f5f3", media: "(prefers-color-scheme: light)" },
    { color: "#1f1a17", media: "(prefers-color-scheme: dark)" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Notra. Ship more. Write less. Reach more.",
    template: "%s - Notra",
  },
  description:
    "Notra turns shipped work into changelogs, launch posts, and social updates in your voice.",
  alternates: {
    canonical: SITE_URL,
    types: {
      "text/plain": `${SITE_URL}/llms.txt`,
      "application/rss+xml": `${SITE_URL}${RSS_FEED_PATH}`,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "120x120" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Notra",
    title: "Notra. Ship more. Write less. Reach more.",
    description:
      "Notra turns shipped work into changelogs, launch posts, and social updates in your voice.",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notra. Ship more. Write less. Reach more.",
    description:
      "Notra turns shipped work into changelogs, launch posts, and social updates in your voice.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "apple-mobile-web-app-title": "Notra",
  },
};

const databuddyClientId = process.env.NEXT_PUBLIC_DATABUDDY_WEB_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ scrollbarGutter: "stable" }}
      suppressHydrationWarning
    >
      <head>
        <link
          href={RSS_FEED_PATH}
          rel="alternate"
          title={RSS_FEED_TITLE}
          type="application/rss+xml"
        />
        <C15tPrefetch backendURL="/api/c15t" />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <FlagsProvider
            clientId={databuddyClientId ?? ""}
            disabled={!databuddyClientId}
          >
            {databuddyClientId && (
              <Databuddy
                clientId={databuddyClientId}
                trackAttributes={true}
                trackErrors={true}
                trackHashChanges={true}
              />
            )}
            <ConsentManager>
              <SiteShell>{children}</SiteShell>
            </ConsentManager>
          </FlagsProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
