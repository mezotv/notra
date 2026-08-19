import { Autumn } from "autumn-js";

const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

export const autumn = AUTUMN_SECRET_KEY
  ? new Autumn({ secretKey: AUTUMN_SECRET_KEY })
  : null;

// Local `next dev` skips Autumn plan/credit gates so AI features work without
// billing. Set ALLOW_UNMETERED_AI_IN_DEVELOPMENT=false to test billing. Production
// never uses this bypass.
export const allowUnmeteredAiInDevelopment =
  process.env.NODE_ENV === "development" &&
  process.env.ALLOW_UNMETERED_AI_IN_DEVELOPMENT !== "false";
