import type { Metadata } from "next";
import LegalContent from "../../../content/legal/legal.mdx";

export const metadata: Metadata = {
  title: "Legal Notice",
  description:
    "Legal notice and imprint for Notra in accordance with German Telemedia Act (TMG).",
};

export default function LegalPage() {
  return (
    <>
      <h1 className="mb-8 font-sans font-semibold text-3xl tracking-tight sm:text-4xl">
        Legal Notice
      </h1>
      <LegalContent />
    </>
  );
}
