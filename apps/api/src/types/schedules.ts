import type { contentTriggers, lookbackWindowEnum } from "@notra/db/schema";

type ScheduleLookbackWindow = (typeof lookbackWindowEnum.enumValues)[number];

export type ScheduleTriggerRow = typeof contentTriggers.$inferSelect;

export type ScheduleTriggerWithLookbackWindow = ScheduleTriggerRow & {
  lookbackWindow: ScheduleLookbackWindow;
};
