import type { Metadata } from "next";
import TermsContent from "../../../content/legal/terms.mdx";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for using Notra, the content automation platform.",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="mb-8 font-sans font-semibold text-3xl tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <TermsContent />
    </>
  );
}
