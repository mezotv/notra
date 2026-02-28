"use client";

import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { Fragment } from "react";
import { COMPARISON_FEATURES, PRICING_PLANS } from "../utils/constants";

const plans = [
  { key: "free" as const, name: PRICING_PLANS.free.name },
  { key: "pro" as const, name: PRICING_PLANS.pro.name },
  { key: "enterprise" as const, name: PRICING_PLANS.enterprise.name },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <HugeiconsIcon className="size-4 text-primary" icon={Tick02Icon} />
    ) : (
      <HugeiconsIcon
        className="size-4 text-muted-foreground/40"
        icon={Cancel01Icon}
      />
    );
  }
  return (
    <span className="block w-full text-right font-normal font-sans text-foreground/80 text-sm">
      {value}
    </span>
  );
}

function MobileComparisonCards() {
  return (
    <div className="flex flex-col gap-8 md:hidden">
      {plans.map((plan) => (
        <div
          className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border"
          key={plan.key}
        >
          <div className="border-border border-b bg-muted/30 px-4 py-3">
            <h3 className="font-sans font-semibold text-base text-foreground">
              {plan.name}
            </h3>
          </div>
          {COMPARISON_FEATURES.map((category) => (
            <div className="flex flex-col" key={category.category}>
              <div className="border-border border-b bg-muted/10 px-4 py-2">
                <span className="font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">
                  {category.category}
                </span>
              </div>
              {category.features.map((feature) => {
                const value = feature[plan.key];
                return (
                  <div
                    className="flex items-center justify-between border-border border-b px-4 py-3 last:border-b-0"
                    key={feature.name}
                  >
                    <span className="font-medium font-sans text-foreground/90 text-sm">
                      {feature.name}
                    </span>
                    <CellValue value={value} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DesktopComparisonTable() {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[240px] font-sans font-semibold text-muted-foreground text-sm lg:w-[300px]">
              Feature
            </TableHead>
            {plans.map((plan) => (
              <TableHead
                className="text-center font-bold font-sans text-foreground text-sm"
                key={plan.key}
              >
                {plan.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_FEATURES.map((category) => (
            <Fragment key={`category-${category.category}`}>
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  className="bg-muted/20 pt-4 pb-2 font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider"
                  colSpan={4}
                >
                  {category.category}
                </TableCell>
              </TableRow>
              {category.features.map((feature) => (
                <TableRow className="border-border" key={feature.name}>
                  <TableCell className="font-medium font-sans text-foreground/90 text-sm">
                    {feature.name}
                  </TableCell>
                  {plans.map((plan) => (
                    <TableCell
                      className="text-right"
                      key={`${feature.name}-${plan.key}`}
                    >
                      <div className="flex items-center justify-end">
                        <CellValue value={feature[plan.key]} />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PricingComparisonTable() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="flex items-center justify-center gap-6 self-stretch px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
          <h2 className="self-stretch text-balance text-center font-sans font-semibold text-2xl text-foreground leading-tight tracking-tight md:text-4xl md:leading-[48px]">
            Compare plans in detail
          </h2>
          <p className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
            See exactly what&apos;s included in each plan
            <br />
            so you can choose the right fit.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[800px] px-4 pb-16 sm:px-6 md:px-8">
        <DesktopComparisonTable />
        <MobileComparisonCards />
      </div>
    </div>
  );
}
