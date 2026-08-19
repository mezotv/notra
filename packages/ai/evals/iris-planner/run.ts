import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { invokeIrisPlanner } from "@notra/ai/autonomy/planner";
import { validatePlannerOutputAgainstMandate } from "@notra/ai/autonomy/validate-plan";
import { irisTaskParamSchemas } from "@notra/ai/schemas/autonomy/capability-params";
import {
  type PlannerOutput,
  plannerOutputSchema,
} from "@notra/ai/schemas/autonomy/planner";
import { Effect } from "effect";
import {
  EVAL_CAPABILITY_CATALOG,
  IRIS_EVAL_SCENARIOS,
  type IrisEvalScenario,
} from "./fixtures";
import {
  JUDGE_DIMENSIONS,
  type JudgeDimension,
  type JudgeVerdict,
  judgePlan,
} from "./judge";

const RESULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "results");
const IDENTIFIER_PATTERN = /\b[a-z]{2,4}_[0-9a-z]{3,}\b/g;
const SCORE_ON_STRUCTURAL_FAILURE = 0;

interface ScenarioResult {
  scenarioId: string;
  decision: string | null;
  taskCount: number;
  capabilities: string[];
  structuralErrors: string[];
  fabricatedTokens: string[];
  costCents: number;
  plan: PlannerOutput | null;
  scores: Record<JudgeDimension, number>;
  notes: Record<JudgeDimension, string>;
  headline: string;
}

const collectStructuralErrors = (
  plan: PlannerOutput,
  scenario: IrisEvalScenario
): string[] => {
  const errors = [
    ...validatePlannerOutputAgainstMandate(plan, scenario.mandate),
  ];

  for (const [index, task] of plan.tasks.entries()) {
    const schema = irisTaskParamSchemas[task.capabilityName];
    if (!schema) {
      continue;
    }
    const parsed = schema.safeParse(task.params);
    if (parsed.success) {
      continue;
    }
    for (const issue of parsed.error.issues) {
      errors.push(
        `tasks.${index}.params.${issue.path.join(".")}: ${issue.message}`
      );
    }
  }

  return errors;
};

const collectFabricatedTokens = (
  plan: PlannerOutput,
  scenario: IrisEvalScenario
): string[] => {
  const haystack = [
    scenario.mandate.objective,
    scenario.mandate.id,
    ...scenario.signalSummaries,
    ...scenario.recentActionSummaries,
  ]
    .join(" ")
    .toLowerCase();

  const found = new Set<string>();
  for (const match of JSON.stringify(plan)
    .toLowerCase()
    .matchAll(IDENTIFIER_PATTERN)) {
    const token = match[0];
    if (!haystack.includes(token)) {
      found.add(token);
    }
  }

  return [...found];
};

const buildDimensionRecord = <T>(
  pick: (dimension: JudgeDimension) => T
): Record<JudgeDimension, T> => ({
  dataFirst: pick("dataFirst"),
  groundedDecisions: pick("groundedDecisions"),
  experimentDiscipline: pick("experimentDiscipline"),
  marketerJudgment: pick("marketerJudgment"),
  communication: pick("communication"),
});

const runScenario = async (
  scenario: IrisEvalScenario
): Promise<ScenarioResult> => {
  const invoked = await Effect.runPromise(
    Effect.result(
      invokeIrisPlanner({
        mandate: scenario.mandate,
        signalSummaries: scenario.signalSummaries,
        recentActionSummaries: scenario.recentActionSummaries,
        capabilityCatalog: EVAL_CAPABILITY_CATALOG,
      })
    )
  ).catch((defect: unknown) => ({
    _tag: "Failure" as const,
    failure: {
      violations: [] as string[],
      message: `planner defect: ${defect instanceof Error ? defect.message : String(defect)}`,
      costCents: 0,
    },
  }));

  if (invoked._tag === "Failure") {
    const failure = invoked.failure;
    const structuralErrors =
      failure.violations.length > 0
        ? [...failure.violations]
        : [failure.message];
    const verdict = await judgePlan({
      scenario,
      plan: null,
      structuralErrors,
      fabricatedTokens: [],
    });

    return {
      scenarioId: scenario.id,
      decision: null,
      taskCount: 0,
      capabilities: [],
      structuralErrors,
      fabricatedTokens: [],
      costCents: failure.costCents,
      plan: null,
      scores: buildDimensionRecord(() => SCORE_ON_STRUCTURAL_FAILURE),
      notes: buildDimensionRecord((dimension) => verdict[dimension].note),
      headline: `structural failure: ${structuralErrors.join("; ")}`,
    };
  }

  const { output, costCents } = invoked.success;
  const reparsed = plannerOutputSchema.safeParse(output);
  const structuralErrors = reparsed.success
    ? collectStructuralErrors(reparsed.data, scenario)
    : reparsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
  const fabricatedTokens = collectFabricatedTokens(output, scenario);

  const verdict: JudgeVerdict = await judgePlan({
    scenario,
    plan: output,
    structuralErrors,
    fabricatedTokens,
  });

  const hardFailed = structuralErrors.length > 0;

  return {
    scenarioId: scenario.id,
    decision: output.decision,
    taskCount: output.tasks.length,
    capabilities: output.tasks.map((task) => task.capabilityName),
    structuralErrors,
    fabricatedTokens,
    costCents,
    plan: output,
    scores: buildDimensionRecord((dimension) =>
      hardFailed ? SCORE_ON_STRUCTURAL_FAILURE : verdict[dimension].score
    ),
    notes: buildDimensionRecord((dimension) => verdict[dimension].note),
    headline: verdict.headline,
  };
};

const mean = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const formatCell = (value: string, width: number): string =>
  value.padEnd(width, " ");

const printSummary = (results: ScenarioResult[]) => {
  const header = [
    formatCell("scenario", 22),
    ...JUDGE_DIMENSIONS.map((dimension) =>
      formatCell(dimension.slice(0, 9), 10)
    ),
    "mean",
  ].join(" ");
  process.stdout.write(`\n${header}\n${"-".repeat(header.length)}\n`);

  for (const result of results) {
    const row = [
      formatCell(result.scenarioId, 22),
      ...JUDGE_DIMENSIONS.map((dimension) =>
        formatCell(String(result.scores[dimension]), 10)
      ),
      mean(JUDGE_DIMENSIONS.map((d) => result.scores[d])).toFixed(2),
    ].join(" ");
    process.stdout.write(`${row}\n`);
  }

  const perDimension = JUDGE_DIMENSIONS.map((dimension) =>
    formatCell(
      mean(results.map((result) => result.scores[dimension])).toFixed(2),
      10
    )
  );
  const overall = mean(
    results.flatMap((result) => JUDGE_DIMENSIONS.map((d) => result.scores[d]))
  );
  process.stdout.write(
    `${[formatCell("MEAN", 22), ...perDimension, overall.toFixed(2)].join(" ")}\n\n`
  );

  for (const result of results) {
    process.stdout.write(
      `${result.scenarioId}: decision=${result.decision} tasks=${result.taskCount} [${result.capabilities.join(", ")}]\n  ${result.headline}\n`
    );
    for (const dimension of JUDGE_DIMENSIONS) {
      if (result.scores[dimension] < 9) {
        process.stdout.write(
          `  ${dimension} ${result.scores[dimension]}: ${result.notes[dimension]}\n`
        );
      }
    }
    if (result.fabricatedTokens.length > 0) {
      process.stdout.write(
        `  fabricated identifiers: ${result.fabricatedTokens.join(", ")}\n`
      );
    }
    if (result.structuralErrors.length > 0) {
      process.stdout.write(
        `  structural errors: ${result.structuralErrors.join("; ")}\n`
      );
    }
    process.stdout.write("\n");
  }
};

const nextRoundNumber = async (): Promise<number> => {
  const fromArg = Number.parseInt(process.argv[2] ?? "", 10);
  if (Number.isInteger(fromArg) && fromArg > 0) {
    return fromArg;
  }
  try {
    const files = await readdir(RESULTS_DIR);
    const rounds = files.flatMap((file) => {
      const value = Number.parseInt(file.replace(/[^0-9]/g, ""), 10);
      return Number.isInteger(value) ? [value] : [];
    });
    return rounds.length === 0 ? 1 : Math.max(...rounds) + 1;
  } catch {
    return 1;
  }
};

const main = async () => {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is not set");
  }

  const round = await nextRoundNumber();
  process.stdout.write(`Running iris planner eval round ${round}\n`);

  const results: ScenarioResult[] = [];
  for (const scenario of IRIS_EVAL_SCENARIOS) {
    process.stdout.write(`  ${scenario.id} ...\n`);
    results.push(await runScenario(scenario));
  }

  printSummary(results);

  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(
    join(RESULTS_DIR, `round-${round}.json`),
    `${JSON.stringify(
      {
        round,
        ranAt: new Date().toISOString(),
        overallMean: mean(
          results.flatMap((result) =>
            JUDGE_DIMENSIONS.map((d) => result.scores[d])
          )
        ),
        dimensionMeans: Object.fromEntries(
          JUDGE_DIMENSIONS.map((dimension) => [
            dimension,
            mean(results.map((result) => result.scores[dimension])),
          ])
        ),
        results,
      },
      null,
      2
    )}\n`
  );
};

await main();
