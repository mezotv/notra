import { ASSISTANT_MODEL_ID } from "../lib/constants/models";
import { createUsageHook } from "../lib/hooks/usage";

export default createUsageHook(ASSISTANT_MODEL_ID);
