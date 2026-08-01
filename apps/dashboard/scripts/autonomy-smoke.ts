import { acquireClaim, releaseClaim } from "@notra/ai/autonomy/claims";
import { validatePlannerOutputAgainstMandate } from "@notra/ai/autonomy/validate-plan";
import { mandateSchema } from "@notra/ai/schemas/autonomy/mandate";
import { plannerOutputSchema } from "@notra/ai/schemas/autonomy/planner";
import { db } from "@notra/db/drizzle";
import { autonomyClaims, members, users } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

const SMOKE_SCOPE = "smoke-test";
const SMOKE_USER_EMAIL = process.env.SMOKE_USER_EMAIL;
const SMOKE_KEY = `demo-${crypto.randomUUID().slice(0, 8)}`;
const SHORT_TTL_SECONDS = 2;
const EXPIRY_WAIT_MS = 2500;

async function findOrganizationId(): Promise<string> {
  if (!SMOKE_USER_EMAIL) {
    throw new Error("Set SMOKE_USER_EMAIL to run the autonomy smoke script");
  }
  const [row] = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(users.email, SMOKE_USER_EMAIL))
    .limit(1);
  if (!row) {
    throw new Error(`No organization found for ${SMOKE_USER_EMAIL}`);
  }
  return row.organizationId;
}

function demoContracts(organizationId: string) {
  const mandate = mandateSchema.parse({
    id: crypto.randomUUID(),
    organizationId,
    name: "smoke-mandate",
    objective: "Keep the world informed about meaningful product changes",
    policy: {
      allowedCapabilities: [
        "content.changelog.create",
        "content.social-post.create",
        "source.github.read",
      ],
      allowedDestinations: ["slack"],
      maxActionsPerDay: 20,
      maxCostCentsPerDay: 500,
      maxTasksPerPlan: 5,
      autoPublish: false,
    },
    status: "active",
    version: 1,
  });

  const validPlan = plannerOutputSchema.safeParse({
    contractVersion: 1,
    mandate: { mandateId: mandate.id, mandateVersion: 1 },
    decision: "plan",
    reason: "New release detected, worth a changelog and a social post",
    consumedSignalIds: ["sig-1"],
    goal: { title: "Announce release v2.0" },
    tasks: [
      {
        localId: "t1",
        capabilityName: "source.github.read",
        capabilityVersion: 1,
        params: { release: "v2.0" },
        dependsOn: [],
        reason: "Read the release notes",
      },
      {
        localId: "t2",
        capabilityName: "content.changelog.create",
        capabilityVersion: 1,
        params: {},
        dependsOn: ["t1"],
        reason: "Write the changelog",
      },
    ],
  });
  console.log(`valid plan parses: ${validPlan.success}`);
  if (!validPlan.success) {
    throw new Error("expected valid plan to parse");
  }

  const cyclePlan = plannerOutputSchema.safeParse({
    contractVersion: 1,
    mandate: { mandateId: mandate.id, mandateVersion: 1 },
    decision: "plan",
    reason: "cycle test",
    goal: { title: "cycle" },
    tasks: [
      {
        localId: "t1",
        capabilityName: "source.github.read",
        capabilityVersion: 1,
        params: {},
        dependsOn: ["t2"],
        reason: "a",
      },
      {
        localId: "t2",
        capabilityName: "content.changelog.create",
        capabilityVersion: 1,
        params: {},
        dependsOn: ["t1"],
        reason: "b",
      },
    ],
  });
  console.log(`cyclic plan rejected: ${!cyclePlan.success}`);
  if (cyclePlan.success) {
    throw new Error("expected the planner schema to reject the cyclic plan");
  }

  const violations = validatePlannerOutputAgainstMandate(
    {
      ...validPlan.data,
      mandate: { mandateId: mandate.id, mandateVersion: 99 },
      tasks: validPlan.data.tasks.map((task) =>
        task.localId === "t2"
          ? { ...task, capabilityName: "capability.not.granted" }
          : task
      ),
    },
    { ...mandate, status: "paused" }
  );
  console.log(`mandate violations detected: ${violations.length}`);
  for (const violation of violations) {
    console.log(`  - ${violation}`);
  }
}

async function demoClaims(organizationId: string) {
  const ownerA = crypto.randomUUID();
  const ownerB = crypto.randomUUID();

  const first = await acquireClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerA,
    ttlSeconds: 60,
    organizationId,
  });
  console.log(`owner A acquires: ${first.claimed}`);
  if (!first.claimed) {
    throw new Error("expected owner A to acquire the claim");
  }

  const contender = await acquireClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerB,
    ttlSeconds: 60,
    organizationId,
  });
  console.log(`owner B contends while A holds: ${contender.claimed}`);
  if (contender.claimed) {
    throw new Error("expected owner B to be denied while owner A holds");
  }

  await releaseClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerA,
  });
  const afterRelease = await acquireClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerB,
    ttlSeconds: SHORT_TTL_SECONDS,
    organizationId,
  });
  console.log(`owner B acquires after release: ${afterRelease.claimed}`);
  if (!afterRelease.claimed) {
    throw new Error("expected owner B to acquire after release");
  }

  await new Promise((resolve) => setTimeout(resolve, EXPIRY_WAIT_MS));
  const takeover = await acquireClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerA,
    ttlSeconds: 60,
    organizationId,
  });
  console.log(`owner A takes over expired claim: ${takeover.claimed}`);
  if (!takeover.claimed) {
    throw new Error("expected owner A to take over the expired claim");
  }

  await releaseClaim({
    scope: SMOKE_SCOPE,
    claimKey: SMOKE_KEY,
    ownerToken: ownerA,
  });
  console.log("smoke claim released");

  const rows = await db
    .select({ scope: autonomyClaims.scope })
    .from(autonomyClaims)
    .where(
      and(
        eq(autonomyClaims.scope, SMOKE_SCOPE),
        eq(autonomyClaims.claimKey, SMOKE_KEY)
      )
    );
  console.log(`leftover smoke claims: ${rows.length}`);
  if (rows.length > 0) {
    throw new Error("expected no leftover smoke claims");
  }
}

async function main() {
  const organizationId = await findOrganizationId();
  console.log(`organization: ${organizationId}`);
  demoContracts(organizationId);
  await demoClaims(organizationId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
