"use client";

import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { GeoPromptAnswerThread } from "@notra/ui/components/geo/geo-prompt-answer-thread";
import { PromptEngineSwitcher } from "@notra/ui/components/geo/prompt-engine-switcher";
import { PromptOutcomeIcon } from "@notra/ui/components/geo/prompt-outcome-icon";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";

import {
  ANSWER_EXAMPLE_DEFAULT_ENGINE,
  ANSWER_EXAMPLE_FACTS,
  ANSWER_EXAMPLE_HEADING,
  ANSWER_EXAMPLE_OUTCOME_LABELS,
  ANSWER_EXAMPLE_POSITION_CLASS,
  ANSWER_EXAMPLE_POSITION_NONE,
  ANSWER_EXAMPLE_PROMPT,
  ANSWER_EXAMPLE_RESULT_HEADERS,
  ANSWER_EXAMPLE_RESULTS,
  ANSWER_EXAMPLE_RESULTS_TITLE,
  ANSWER_EXAMPLE_SENTIMENT_CLASS,
  ANSWER_EXAMPLE_SENTIMENT_LABELS,
  ANSWER_EXAMPLE_SUBCOPY,
  ANSWER_EXAMPLE_TIMESTAMP,
} from "@/constants/landing/answer-example";
import { GEO_ENGINE_NAMES } from "@/constants/landing/geo-engines";
import { answerPositionTone } from "@/utils/answer-example";

const HEADER_CLASS = "text-muted-foreground text-xs";

const SWITCHER_ITEMS = ANSWER_EXAMPLE_RESULTS.map((result) => ({
  engine: result.id,
  family: GEO_ENGINE_NAMES[result.id],
  label: GEO_ENGINE_NAMES[result.id],
  showSearchIcon: false,
}));

function ResultsTable() {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="text-foreground px-5 pt-4 pb-3 text-sm font-medium">
        {ANSWER_EXAMPLE_RESULTS_TITLE}
      </div>
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className={HEADER_CLASS}>
              {ANSWER_EXAMPLE_RESULT_HEADERS.engine}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {ANSWER_EXAMPLE_RESULT_HEADERS.mentioned}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {ANSWER_EXAMPLE_RESULT_HEADERS.position}
            </TableHead>
            <TableHead className={HEADER_CLASS}>
              {ANSWER_EXAMPLE_RESULT_HEADERS.sentiment}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ANSWER_EXAMPLE_RESULTS.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-3">
                <span className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                  <EngineIcon engine={row.id} />
                  {GEO_ENGINE_NAMES[row.id]}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <span
                  aria-label={
                    row.mentioned
                      ? ANSWER_EXAMPLE_OUTCOME_LABELS.mentioned
                      : ANSWER_EXAMPLE_OUTCOME_LABELS.notMentioned
                  }
                  className="inline-flex items-center"
                  role="img"
                >
                  <PromptOutcomeIcon mentioned={row.mentioned} />
                </span>
              </TableCell>
              <TableCell className="py-3">
                {row.position === null ? (
                  <span className="text-muted-foreground text-sm">
                    {ANSWER_EXAMPLE_POSITION_NONE}
                  </span>
                ) : (
                  <Badge
                    className={cn(
                      "rounded-sm tabular-nums",
                      ANSWER_EXAMPLE_POSITION_CLASS[
                        answerPositionTone(row.position)
                      ]
                    )}
                    variant="outline"
                  >
                    #{row.position}
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "py-3 text-sm",
                  ANSWER_EXAMPLE_SENTIMENT_CLASS[row.sentiment]
                )}
              >
                {ANSWER_EXAMPLE_SENTIMENT_LABELS[row.sentiment]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AnswerExampleSection() {
  const [engine, setEngine] = useState<string>(ANSWER_EXAMPLE_DEFAULT_ENGINE);
  const active =
    ANSWER_EXAMPLE_RESULTS.find((result) => result.id === engine) ??
    ANSWER_EXAMPLE_RESULTS[0];

  return (
    <section className="mx-auto flex w-full max-w-360 flex-col items-center px-6 pt-24 antialiased [font-synthesis:none] sm:px-12 lg:px-20 lg:pt-40">
      <div className="flex w-full flex-col items-center gap-12 lg:gap-16">
        <header className="flex flex-col items-center gap-4">
          <h2 className="font-display max-w-[44rem] text-center text-[2rem] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-black sm:text-[2.25rem] lg:text-[3.0625rem]/14 dark:text-white">
            {ANSWER_EXAMPLE_HEADING}
          </h2>
          <p className="font-display w-full max-w-[44rem] text-center text-lg/7 font-medium tracking-[-0.01em] text-balance text-[#1E1E1EBF] sm:text-xl/7.5 dark:text-white/70">
            {ANSWER_EXAMPLE_SUBCOPY}
          </p>
        </header>
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div className="border-border bg-background flex h-[40rem] flex-col overflow-hidden rounded-2xl border shadow-[0_0.125rem_1.4375rem_#0000001A,0_0.0625rem_0.125rem_#0000000A] dark:shadow-none">
            <div className="border-border flex shrink-0 flex-col gap-3 border-b px-6 pt-5 pb-3">
              <p className="text-xl leading-snug font-semibold text-balance">
                {ANSWER_EXAMPLE_PROMPT}
              </p>
              <PromptEngineSwitcher
                active={engine}
                items={SWITCHER_ITEMS}
                onChange={setEngine}
              />
            </div>
            {active ? (
              <GeoPromptAnswerThread
                key={active.id}
                prompt={ANSWER_EXAMPLE_PROMPT}
                result={{
                  engine: active.id,
                  excerpt: active.excerpt,
                  mentioned: active.mentioned,
                }}
                timestamp={ANSWER_EXAMPLE_TIMESTAMP}
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-8">
            <ResultsTable />
            <ul className="flex flex-col gap-5">
              {ANSWER_EXAMPLE_FACTS.map((fact) => (
                <li className="flex flex-col gap-1" key={fact.id}>
                  <span className="font-sans text-base font-medium text-[#0A0D14] dark:text-white">
                    {fact.title}
                  </span>
                  <span className="font-sans text-[0.9375rem]/6 text-[#6A6B70] dark:text-white/60">
                    {fact.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
