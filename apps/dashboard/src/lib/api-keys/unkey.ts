import { Unkey } from "@unkey/api";

const UNKEY_ROOT_KEY = process.env.UNKEY_ROOT_KEY;

export const unkey = UNKEY_ROOT_KEY
  ? new Unkey({ rootKey: UNKEY_ROOT_KEY })
  : null;
