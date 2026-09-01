import { gateway } from "@notra/ai/gateway";
import type { PlannerOutput } from "@notra/ai/schemas/autonomy/planner";
import { generateText, Output } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import type { IrisEvalScenario } from "./fixtures";

export const JUDGE_MODEL_ID = "anthropic/claude-sonnet-4.6";
const JUDGE_MAX_OUTPUT_TOKENS = 2000;

const dimensionSchema = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string(),
});

export const judgeVerdictSchema = z.object({
  dataFirst: dimensionSchema,
  groundedDecisions: dimensionSchema,
  experimentDiscipline: dimensionSchema,
  marketerJudgment: dimensionSchema,
  communication: dimensionSchema,
  headline: z.string(),
});
export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

export const JUDGE_DIMENSIONS = [
  "dataFirst",
  "groundedDecisions",
  "experimentDiscipline",
  "marketerJudgment",
  "communication",
] as const;
export type JudgeDimension = (typeof JUDGE_DIMENSIONS)[number];

const RUBRIC = `
dataFirst (1-10): Are the analytics reads scheduled before content, with the content tasks declaring dependsOn against them, so the writing can actually use the numbers? In the cold start scenario reads should still come first, but the plan must not pretend numbers exist. A plan that writes content with no read in front of it, or that lists reads but leaves content independent of them, scores low. A correct no_op with no tasks at all scores 8 if no_op was the right call.

groundedDecisions (1-10): Do the topics, angles, audiences, platforms and params follow from what the planner can actually see? The planner input contains only the mandate, the GitHub signal lines and the recent action lines. It does not contain analytics results or post ids. Any concrete post id, follower count, impression number or engagement percentage that appears in the plan is fabricated unless it appears verbatim in the planner input, and fabrication should be scored harshly. Restating the shipped work accurately, and deferring the numbers to the reads, scores high.

experimentDiscipline (1-10): analytics.experiment.create must not appear when an experiment is already running, must not appear when there are no published posts to compare, and must never point both variants at the same post. Because post ids are never visible at planning time, creating an experiment with invented ids is a failure, not initiative. Scheduling analytics.experiment.read to find out what is running is the correct move.

marketerJudgment (1-10): Would a competent growth marketer nod at this plan? Right content type for the size of the signal, right cadence, no double announcing work the recent actions already covered, angle diversity, and carrying forward the lesson of a concluded test where one exists. Chores, dependency bumps and typo fixes must never become content. Padding a plan with tasks to look busy is a failure, and so is a lazy no_op when the mandate demands cadence and there is something evergreen to say.

communication (1-10): Do the plan reason, the goal summary and the per task reasons lead with concrete, checkable specifics such as the release tag, the feature name, the metric that will be checked, the number of posts? Generic phrasing like "shared an update", "engage the audience", "drive awareness" scores low. Note that the planner cannot quote analytics numbers it has not read yet, so promising to check a named metric counts as concrete, while inventing a number does not.
`;

export const judgePlan = async (params: {
  scenario: IrisEvalScenario;
  plan: PlannerOutput | null;
  structuralErrors: string[];
  fabricatedTokens: string[];
}): Promise<JudgeVerdict> => {
  const { scenario, plan } = params;

  const prompt = `You are grading an autonomous marketing agent's PLAN, not its writing. Be a hard grader. A 10 means a senior growth marketer would ship this plan unchanged.

<scenario>
title: ${scenario.title}
description: ${scenario.description}
</scenario>

<world-state-the-planner-cannot-see>
${scenario.worldState}
</world-state-the-planner-cannot-see>

<what-a-good-plan-looks-like-here>
${scenario.expectations.map((line) => `- ${line}`).join("\n")}
</what-a-good-plan-looks-like-here>

<mandate>
objective: ${scenario.mandate.objective}
maxTasksPerPlan: ${scenario.mandate.policy.maxTasksPerPlan}
allowedCapabilities: ${scenario.mandate.policy.allowedCapabilities.join(", ")}
</mandate>

<planner-input-signals>
${scenario.signalSummaries.map((line) => `- ${line}`).join("\n") || "- none"}
</planner-input-signals>

<planner-input-recent-actions>
${scenario.recentActionSummaries.map((line) => `- ${line}`).join("\n") || "- none"}
</planner-input-recent-actions>

<plan-under-review>
${plan ? JSON.stringify(plan, null, 2) : "The planner failed structural validation and produced no usable plan."}
</plan-under-review>

<automated-checks>
structuralErrors: ${params.structuralErrors.length > 0 ? params.structuralErrors.join("; ") : "none"}
identifiersInThePlanThatWereNeverGivenToThePlanner: ${params.fabricatedTokens.length > 0 ? params.fabricatedTokens.join(", ") : "none"}
</automated-checks>

<rubric>
${RUBRIC}
</rubric>

Score every dimension 1 to 10 and give a one or two sentence note naming the concrete weakness, or naming what makes it strong when the score is 9 or 10. Then write a headline of one sentence summarising the single biggest problem with this plan.`;

  const generated = await generateText({
    model: gateway(JUDGE_MODEL_ID),
    output: Output.object({ schema: judgeVerdictSchema }),
    prompt,
    temperature: 0,
    maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
  });

  return generated.output;
};
