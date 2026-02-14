import { Databuddy } from "@databuddy/sdk/react";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Toaster } from "sonner";
import FooterSection from "../components/footer-section";
import { Navbar } from "../components/navbar";

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
  themeColor: "#8b5cf6",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://usenotra.com"),
  title: {
    default: "Notra - Turn your daily work into publish-ready content",
    template: "%s | Notra",
  },
  description:
    "Notra connects to GitHub, Linear and Slack to turn shipped work into ready-to-publish changelogs, blog posts, and social updates.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://usenotra.com",
    siteName: "Notra",
    title: "Notra - Turn your daily work into publish-ready content",
    description:
      "Notra connects to GitHub, Linear and Slack to turn shipped work into ready-to-publish changelogs, blog posts, and social updates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notra - Turn your daily work into publish-ready content",
    description:
      "Notra connects to GitHub, Linear and Slack to turn shipped work into ready-to-publish changelogs, blog posts, and social updates.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "apple-mobile-web-app-title": "Notra",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ scrollbarGutter: "stable" }}>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
      >
        <div className="relative flex min-h-screen w-full flex-col items-center justify-start bg-background">
          <div className="relative flex w-full flex-col items-center justify-start">
            <div className="relative flex w-full max-w-none flex-col items-start justify-start px-4 sm:px-6 md:px-8 lg:w-265 lg:max-w-265 lg:px-0">
              <div className="absolute top-0 left-4 z-0 h-full w-px bg-border shadow-[1px_0px_0px_white] sm:left-6 md:left-8 lg:left-0" />
              <div className="absolute top-0 right-4 z-0 h-full w-px bg-border shadow-[1px_0px_0px_white] sm:right-6 md:right-8 lg:right-0" />

              <div className="relative z-10 flex flex-col items-center self-stretch pt-2.25 pb-8 md:pb-12">
                <Navbar />
                {children}
                <div className="w-full">
                  <FooterSection />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
        <Databuddy
          clientId={process.env.NEXT_PUBLIC_DATABUDDY_ID!}
          trackAttributes={true}
          trackErrors={true}
          trackHashChanges={true}
          trackScrollDepth={true}
        />
      </body>
    </html>
  );
}
