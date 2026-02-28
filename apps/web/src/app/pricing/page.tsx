import type { Metadata } from "next";
import PricingComparisonTable from "../../components/pricing-comparison-table";
import PricingSection from "../../components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the right Notra plan for your team. Compare features across Free, Pro, and Enterprise tiers.",
};

export default function PricingPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <PricingSection />
      <div className="w-full border-border border-t">
        <PricingComparisonTable />
      </div>
    </div>
  );
}
