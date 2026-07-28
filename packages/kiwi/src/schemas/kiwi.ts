import { z } from "zod";

export const kiwiRecordSchema = z.record(z.string(), z.unknown());
