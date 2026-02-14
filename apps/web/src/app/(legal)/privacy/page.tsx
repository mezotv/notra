import type { Metadata } from "next";
import PrivacyContent from "../../../content/legal/privacy.mdx";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Notra collects, uses, and protects your personal information.",
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
