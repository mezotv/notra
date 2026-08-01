idempotency, cost, and compensation contract.

## 12. Test strategy

### Deterministic kernel tests

- signal dedupe, ordering, coalescing, and replay;
- mandate version conflicts and kill-switch propagation;
- lease fencing, stale-owner recovery, and concurrent controllers;
- task dependency readiness and cycle rejection;
- action idempotency and `unknown` side-effect handling;
- outbox retry/dedupe and destination ownership;
- adaptive wake clamping and QStash reconciliation;
- budget reservation/finalization and backoff.

### Agent contract tests

- planner emits valid bounded DAGs or a valid no-op;
- planner cannot invent capability names or alter mandate fields;
- untrusted source instructions do not change policy;
- executor receives only task-scoped capabilities;
- executor cannot create goals, schedules, or capability grants;
- evaluator cannot rewrite run/action history;
- malformed outputs terminate visibly without side effects.

### End-to-end autonomy scenarios

1. Meaningful GitHub release -> plan -> changelog/social/image -> publish -> Slack
   summary -> engagement follow-up.
2. Ten low-value commits -> coalesced signal -> no-op -> no message -> bounded
   next wake.
3. Linear launch milestone plus GitHub release -> cross-source synthesis -> one
   campaign, not duplicate content.
4. Provider rate limit -> waiting task -> exact retry -> verified completion.
5. Crash after provider write but before commit -> read-after-write recovery ->
   one artifact and one action record.
6. Mandate paused during execution -> pending actions canceled -> no stale
   delivery or wake.
7. Prompt injection in issue/README/Slack -> treated as source data -> no policy
   or destination change.
8. Slack reply changes priority -> interactive policy/memory update -> controller
   replans current goal.

Run the scenarios against isolated organizations and provider emulators. Replay
the same recorded signal stream after code changes and compare decisions,
actions, costs, and user-visible delivery.

## 13. Metrics

### Autonomy value

- percentage of useful artifacts initiated by Notra rather than a human;
- percentage of goals completed without intervention;
- event-to-useful-action latency;
- published artifact open/edit/unpublish and engagement rates;
- useful proactive message rate and reply rate;
- duplicate/noisy action rate;
- time humans save per organization.

### Control-loop quality

- signals coalesced per planner invocation;
- deterministic no-op rate before model invocation;
- planner no-op/action/escalation distribution;
- task replan and verification-failure rates;
- stale goal and waiting-task age;
- adaptive wake versus event-trigger ratio;
- cost per completed goal and per useful artifact.

### Reliability and safety

- duplicate logical runs, actions, artifacts, and deliveries;
- unknown external side effects;
- lease and reconciliation repairs;
- blocked out-of-policy actions;
- cross-tenant access attempts;
- kill-switch latency;
- budget and provider-rate violations;
- prompt-injection regression results.

The north-star is not how often the model wakes. It is the percentage of
organization outcomes Notra initiates and completes correctly without human
coordination, at an acceptable cost and noise level.

## 14. Immediate engineering order

The first implementation should proceed in this order:

1. Define the mandate and planner output contracts.
2. Add Postgres signal/run/goal/task/action/checkpoint/outbox persistence.
3. Replace fail-open Redis-only claims for autonomous side effects.
4. Fix dynamic skill precedence and require run-scoped resource authorization
   for unattended mutating tools.
5. Consolidate dashboard/API schedule state behind one desired-state service.
6. Build signal ingestion, controller lease, deterministic gate, and exact wake
   reconciliation.
7. Add the Eve `autonomy-plan` and `autonomy-act` surfaces plus the
   schema-validated task graph.
8. Wrap existing source and content operations as versioned capabilities with
   idempotency and verifiers.
9. Execute the autonomous content-operator vertical slice through Workflow.
10. Add verified external publication capabilities per provider.
11. Add Slack outbound/events and attach results to the home conversation.
12. Add persistent waiting/continuation and evaluator-driven follow-ups.
13. Add learning only after run/action provenance and replay are trustworthy.

Do not begin with a universal hourly prompt, a generic tool-enabled agent, or a
self-modifying schedule. Begin with the durable autonomy kernel and one
end-to-end mission that can independently observe, decide, act, verify, and
continue.

## Conclusion

The right goal is not "make schedules conversational." It is to give Notra a
persistent job: understand the organization's outcomes, watch the world, and
own the work required to move those outcomes forward.

Notra already has important pieces: organization-bound Eve sessions, a
non-interactive task surface, durable Workflow execution, QStash, connected
sources, content tools, billing gates, and an onboarding agent that runs without
questions. The missing system is the autonomous operating layer around them:
mandates, signals, goals, task graphs, capability policy, durable action state,
verification, memory, adaptive wakes, and proactive conversation.

Build that layer and the clock becomes an implementation detail. Events wake
Notra when the world changes; exact timers wake it when a goal needs attention;
the repair sweep catches drift. Notra itself decides what matters and what to do
next, then carries the work through to a verified result under standing
authority.