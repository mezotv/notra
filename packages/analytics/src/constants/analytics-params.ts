import { p } from "@tinybirdco/sdk";

export const TRAILING_DAYS_PARAM = {
  days: p.int32().optional(30).describe("Number of trailing days"),
};
