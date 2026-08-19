import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans } from "next/font/google";
import "@/styles/globals.css";

import { Providers } from "@/utils/providers";
import { SITE_CONFIG } from "../utils/site";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    template: `%s - ${SITE_CONFIG.title}`,
    default: SITE_CONFIG.title,
  },
  description: SITE_CONFIG.description,
  appleWebApp: {
    title: SITE_CONFIG.title,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${notoSans.variable} ${geistMono.variable} dark:scheme-dark`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
