import type { Metadata } from "next";
import PrivacyContent from "@/content/legal/privacy.mdx";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Privacy Policy";
const description =
  "Learn how Notra collects, uses, and protects your personal information.";
const url = `${SITE_URL}/privacy`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="mb-8 font-sans font-semibold text-3xl tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <PrivacyContent />
    </>
  );
}
