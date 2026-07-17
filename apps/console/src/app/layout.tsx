import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import "@/styles/globals.css";

import { ImpersonationBanner } from "@/components/auth/impersonation-banner";
import { Providers } from "@/components/providers";
import { getRequestSession } from "@/lib/auth/session";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notra Console",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, user } = await getRequestSession();
  const isImpersonating = Boolean(session?.impersonatedBy);

  return (
    <html
      className={`${notoSans.variable} dark:scheme-dark`}
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex h-svh flex-col overflow-hidden">
            {isImpersonating && user ? (
              <ImpersonationBanner email={user.email} name={user.name} />
            ) : null}
            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
