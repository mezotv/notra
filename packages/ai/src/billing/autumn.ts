import { Autumn } from "autumn-js";

import { shouldBypassAutumnInDevelopment } from "../utils/autumn-development";

const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

export const autumn = AUTUMN_SECRET_KEY
  ? new Autumn({ secretKey: AUTUMN_SECRET_KEY })
  : null;

// Local development skips Autumn plan/credit gates so AI features work without
// billing. Production never uses this bypass.
export const allowUnmeteredAiInDevelopment = shouldBypassAutumnInDevelopment(
  process.env.NODE_ENV,
  AUTUMN_SECRET_KEY
);
