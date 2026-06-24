import type { z } from "zod";
import type { contactMessageSchema } from "@/schemas/contact";

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
