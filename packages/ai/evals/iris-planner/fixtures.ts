import {
  IRIS_CAPABILITY_CATALOG,
  IRIS_CAPABILITY_NAMES,
} from "@notra/ai/constants/autonomy-capabilities";
import {
  type Mandate,
  type MandatePolicy,
  mandateSchema,
} from "@notra/ai/schemas/autonomy/mandate";

const IRIS_DEFAULT_POLICY: MandatePolicy = {
  allowedCapabilities: IRIS_CAPABILITY_NAMES,
  allowedDestinations: ["slack"],
  maxActionsPerDay: 10,
  maxCostCentsPerDay: 500,
  maxTasksPerPlan: 6,
  autoPublish: false,
};

const buildMandate = (params: {
  id: string;
  name: string;
  objective: string;
  policy?: Partial<MandatePolicy>;
}): Mandate =>
  mandateSchema.parse({
    id: params.id,
    organizationId: "org_eval_notra",
    name: params.name,
    objective: params.objective,
    policy: { ...IRIS_DEFAULT_POLICY, ...params.policy },
    status: "active",
    version: 1,
  });

export interface IrisEvalScenario {
  id: string;
  title: string;
  description: string;
  worldState: string;
  expectations: string[];
  knownPostIds: string[];
  mandate: Mandate;
  signalSummaries: string[];
  recentActionSummaries: string[];
}

const STANDARD_OBJECTIVE =
  "Grow awareness of Notra with developers and technical founders. Turn real shipped work into content, keep a steady drumbeat on twitter and linkedin, and let the analytics decide what to publish next. Never announce the same work twice.";

export const IRIS_EVAL_SCENARIOS: IrisEvalScenario[] = [
  {
    id: "cold-start",
    title: "Cold start, new workspace",
    description:
      "A brand new workspace connected GitHub yesterday. No analytics history, no social accounts with meaningful data, no experiments, no previous Iris actions.",
    worldState:
      "The workspace has zero published social posts, zero analytics rows, and zero experiments. analytics.social.read would come back empty. No post ids exist anywhere in the system.",
    expectations: [
      "Reads may still be scheduled first, but the plan must not assume any numbers exist.",
      "No experiment may be created, because there are no published posts to compare.",
      "Content should still be planned for the first real release, kept small.",
    ],
    knownPostIds: [],
    mandate: buildMandate({
      id: "mnd_cold_start",
      name: "Launch coverage",
      objective:
        "This workspace just connected its repository. Establish a first marketing footprint: cover genuinely shipped work, start building a publishing history, and stay conservative until there is data to learn from.",
    }),
    signalSummaries: [
      "github.release.published from github at 2026-07-30T09:14:22.000Z: release v1.0.0, Notra 1.0, notra/notra",
      "github.push from github at 2026-07-30T09:02:10.000Z: 4 commits (chore: bump drizzle-orm to 0.45.2; docs: fix typo in readme; ci: cache bun install), notra/notra",
    ],
    recentActionSummaries: [],
  },
  {
    id: "data-rich",
    title: "Data rich workspace, no experiment running",
    description:
      "An established workspace with months of publishing history. A meaningful feature just merged.",
    worldState:
      "analytics.social.read would report: twitter 8420 followers (+310 in 30 days), linkedin 2140 followers (+95). 30 day impressions 412000 twitter, 96000 linkedin. Top posts, all twitter: tw_9931 (engagement 4.8 percent, teardown of scheduling internals), tw_9877 (engagement 4.1 percent, short before and after of the editor), tw_9702 (engagement 3.6 percent, changelog roundup), li_4410 (engagement 2.2 percent, long form launch note), tw_9655 (engagement 1.9 percent, generic product announcement). Best weekdays: Monday, Friday, Tuesday. analytics.experiment.read would report zero running experiments and no concluded ones.",
    expectations: [
      "Reads first, content depending on them.",
      "An experiment is reasonable here since nothing is running, but the planner has no post ids in its own input, so it must not invent ids such as tw_9931.",
      "Content should target the platform and cadence the data supports rather than blanket posting everywhere.",
    ],
    knownPostIds: ["tw_9931", "tw_9877", "tw_9702", "li_4410", "tw_9655"],
    mandate: buildMandate({
      id: "mnd_data_rich",
      name: "Steady growth",
      objective: STANDARD_OBJECTIVE,
    }),
    signalSummaries: [
      "github.pull_request.merged from github at 2026-07-31T16:41:03.000Z: Scheduled digests: send a weekly content digest per workspace, notra/notra",
      "github.push from github at 2026-07-31T16:42:55.000Z: 12 commits (feat(digest): weekly digest scheduler; feat(digest): per workspace timezone handling; test(digest): cover quiet hours), notra/notra",
    ],
    recentActionSummaries: [
      "content.social-post.create succeeded at 2026-07-28T10:12:00.000Z",
      "analytics.social.read succeeded at 2026-07-28T10:10:00.000Z",
      "content.changelog.create succeeded at 2026-07-24T09:31:00.000Z",
      "analytics.social.read succeeded at 2026-07-24T09:29:00.000Z",
      "content.blog-post.create succeeded at 2026-07-17T11:05:00.000Z",
    ],
  },
  {
    id: "experiment-running",
    title: "An A/B test is already running",
    description:
      "Mid sized workspace. An experiment started three days ago and is still collecting data. A moderate feature shipped.",
    worldState:
      "analytics.experiment.read would report one running experiment: exp_0031 'Teardown vs announcement', metric engagement, status running, variantA tw_9931 (4.8 percent) versus variantB tw_9655 (1.9 percent), no winner declared yet. analytics.social.read would report twitter 3100 followers (+40 in 30 days), 88000 impressions, top posts tw_9931, tw_9655, tw_9540. Best weekdays: Tuesday, Thursday.",
    expectations: [
      "No new experiment may be created while one is running.",
      "Reads still come first so the plan can see the running test.",
      "Content should be planned normally around the shipped work.",
    ],
    knownPostIds: ["tw_9931", "tw_9655", "tw_9540"],
    mandate: buildMandate({
      id: "mnd_experiment_running",
      name: "Steady growth",
      objective: STANDARD_OBJECTIVE,
    }),
    signalSummaries: [
      "github.release.published from github at 2026-08-01T08:20:11.000Z: release v2.3.0, Inline comments in the editor, notra/notra",
    ],
    recentActionSummaries: [
      "analytics.experiment.create succeeded at 2026-07-29T09:44:00.000Z",
      "analytics.experiment.read succeeded at 2026-07-29T09:42:00.000Z",
      "analytics.social.read succeeded at 2026-07-29T09:41:00.000Z",
      "content.social-post.create succeeded at 2026-07-29T09:50:00.000Z",
    ],
  },
  {
    id: "experiment-concluded",
    title: "A test just concluded with a winner",
    description:
      "The workspace ran an A/B test that has now completed. Variant B won clearly. A small but interesting improvement shipped this week.",
    worldState:
      "analytics.experiment.read would report exp_0028 'Long form vs short hook', metric engagement, status completed, winner variantB: variantA li_4410 long form launch note (2.2 percent) versus variantB tw_9877 short before and after hook (4.1 percent). analytics.social.read would report twitter 5600 followers (+180), linkedin 1900 (+20), top posts tw_9877, tw_9931, tw_9702, li_4410. Best weekdays: Monday, Wednesday. No experiment is currently running.",
    expectations: [
      "The plan should carry the winner's lesson into the new content, favouring the short hook style that won.",
      "Starting a fresh experiment is defensible since none is running, but only with post ids the planner can actually see.",
      "Reasons should reference the concluded result rather than generic phrasing.",
    ],
    knownPostIds: ["tw_9877", "tw_9931", "tw_9702", "li_4410"],
    mandate: buildMandate({
      id: "mnd_experiment_concluded",
      name: "Steady growth",
      objective: STANDARD_OBJECTIVE,
    }),
    signalSummaries: [
      "github.pull_request.merged from github at 2026-07-31T13:02:44.000Z: Editor: paste a URL onto selected text to create a link, notra/notra",
    ],
    recentActionSummaries: [
      "analytics.experiment.create succeeded at 2026-07-18T08:15:00.000Z",
      "analytics.experiment.read succeeded at 2026-07-18T08:13:00.000Z",
      "content.social-post.create succeeded at 2026-07-18T08:20:00.000Z",
      "content.social-post.create succeeded at 2026-07-18T08:21:00.000Z",
      "analytics.social.read succeeded at 2026-07-25T09:00:00.000Z",
    ],
  },
  {
    id: "signal-driven",
    title: "Major release published",
    description:
      "A significant release just went out with two headline features, on a workspace with normal analytics.",
    worldState:
      "analytics.social.read would report twitter 4200 followers (+120), linkedin 1500 (+60), 30 day impressions 140000, top posts tw_9877, tw_9702, li_4410. Best weekdays: Monday, Friday. analytics.experiment.read would report one completed experiment from six weeks ago and nothing running.",
    expectations: [
      "This deserves real coverage: a blog post plus at least one social post, reads first.",
      "The release is the anchor, and nothing in recent actions covers it yet.",
      "Platform choice and angle should follow what the reads will show, not habit.",
    ],
    knownPostIds: ["tw_9877", "tw_9702", "li_4410"],
    mandate: buildMandate({
      id: "mnd_signal_driven",
      name: "Steady growth",
      objective: STANDARD_OBJECTIVE,
    }),
    signalSummaries: [
      "github.release.published from github at 2026-08-01T07:55:00.000Z: release v3.0.0, Workspaces and shared brand kits, notra/notra",
      "github.push from github at 2026-08-01T07:56:12.000Z: 47 commits (feat(workspaces): multi workspace switching; feat(brand): shared brand kits; refactor: split the editor bundle), notra/notra",
    ],
    recentActionSummaries: [
      "content.changelog.create succeeded at 2026-07-22T10:00:00.000Z",
      "analytics.social.read succeeded at 2026-07-22T09:58:00.000Z",
      "content.social-post.create succeeded at 2026-07-15T14:20:00.000Z",
    ],
  },
  {
    id: "quiet-week",
    title: "Quiet week, mandate expects steady output",
    description:
      "Nothing shipped that is worth announcing. The mandate explicitly asks for a steady cadence anyway.",
    worldState:
      "analytics.social.read would report twitter 2400 followers (+8 in 30 days), 21000 impressions, engagement flat around 1.4 percent, top posts tw_9540, tw_9611. Best weekdays: Wednesday, Thursday. analytics.experiment.read would report nothing running and nothing concluded in the last 60 days.",
    expectations: [
      "There is no announcement worthy signal, so shipping a launch post would be wrong.",
      "The mandate asks for a steady cadence, so a competent marketer would still look at the numbers and either publish something evergreen or explain clearly why not.",
      "Whatever it decides, the reasoning should be specific about the flat numbers rather than vague.",
    ],
    knownPostIds: ["tw_9540", "tw_9611"],
    mandate: buildMandate({
      id: "mnd_quiet_week",
      name: "Always on cadence",
      objective:
        "Keep Notra visible to developers every week, even in weeks with no release. Publish from real work when there is any, otherwise lean on what the analytics say already works. Two to three posts a week is the target. Never announce the same work twice, and never dress up chores as news.",
    }),
    signalSummaries: [
      "github.push from github at 2026-07-30T18:02:00.000Z: 6 commits (chore(deps): bump zod to 4.3.4; refactor: extract signal summary helper; test: cover planner repair path), notra/notra",
      "github.pull_request.merged from github at 2026-07-29T11:11:00.000Z: Fix typo in the onboarding empty state, notra/notra",
    ],
    recentActionSummaries: [
      "content.social-post.create succeeded at 2026-07-27T09:30:00.000Z",
      "analytics.social.read succeeded at 2026-07-27T09:28:00.000Z",
      "content.social-post.create succeeded at 2026-07-23T09:30:00.000Z",
    ],
  },
];

export const EVAL_CAPABILITY_CATALOG = IRIS_CAPABILITY_CATALOG;
